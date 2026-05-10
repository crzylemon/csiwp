import { Player } from './player.js';
import { levels } from './level.js';
import { Renderer } from './renderer.js';
import { Camera } from './camera.js';
import { loadSprites } from './sprites.js';
import { loadTextSheet, drawText } from './text.js';
import { TitleScreen } from './titlescreen.js';
import { SplashScreen } from './splash.js';
import { SplashScreen2 } from './splash2.js';
import { DeathEffect } from './deatheffect.js';
import { initRespawnFrames, drawRespawnFrame, FRAME_COUNT } from './respawn.js';
import { pollGamepad, gamepadState } from './gamepad.js';
import { siteCheck } from './siteCheck.js';

const VIEW_HEIGHT = 72;
let VIEW_WIDTH = 128; // will be recalculated
const RENDER_SCALE = 8;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
var definedCamera = false;

function resizeCanvas() {
  const aspect = window.innerWidth / window.innerHeight;
  VIEW_WIDTH = Math.round(VIEW_HEIGHT * aspect);
  canvas.width = VIEW_WIDTH * RENDER_SCALE;
  canvas.height = VIEW_HEIGHT * RENDER_SCALE;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  // image smoothing OFF or we get weird bug
  ctx.imageSmoothingEnabled = false;
  // update camera width
  if (definedCamera) {
    camera.viewWidth = VIEW_WIDTH;
  }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

if (!siteCheck()) {
  // timer
  setTimeout(() => {
    window.location = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  }, 120000); // 2 minutes and then you get rickrolled
  alert("You have 2 minutes to play the demo version. Your progress will not save and will stay in this session. Good luck!");
}

const renderer = new Renderer(ctx);
const camera = new Camera(VIEW_WIDTH, VIEW_HEIGHT);
definedCamera = true;

let currentLevel = 0;
let deaths = 0;
let level = levels[currentLevel];
const player = new Player(level.spawn.x, level.spawn.y);

let lastTime = 0;

// splash, splash2, title, or playing.
let gameState = 'splash';
const splashScreen = new SplashScreen();
const splashScreen2 = new SplashScreen2();
const titleScreen = new TitleScreen();
const deathEffect = new DeathEffect();

// die
let shakeTimer = 0;
let flashTimer = 0;
const SHAKE_DURATION = 0.3;
const FLASH_DURATION = 0.15;

// alive, shaking, scrolling, or portal
let state = 'alive';
let scrollTimer = 0;
let scrollFrom = { x: 0, y: 0 };
let scrollTo = { x: 0, y: 0 };
const SCROLL_DURATION = 0.6;

let portalTimer = 0;
const PORTAL_DURATION = 0.48; // last 60% of fragment travel

function getConveyorColliders(conveyors) {
  return conveyors.map(c => ({
    x: c.x,
    y: c.y,
    width: c.width,
    height: 8,
  }));
}

function applyConveyorPush(player, conveyors, dt) {
  for (const c of conveyors) {
    const onTop =
      player.y + player.height === c.y &&
      player.x + player.width > c.x &&
      player.x < c.x + c.width;
    if (onTop) {
      // consistency with animation
      const speed = 1 / renderer.animInterval;
      player.x += (c.direction === 'left' ? -speed : speed) * dt;
    }
  }
}

function triggerDeath() {
  deaths++;
  shakeTimer = SHAKE_DURATION;
  flashTimer = FLASH_DURATION;
  state = 'shaking';
  player.dead = true;
  deathEffect.trigger(player.x, player.y, level.spawn.x, level.spawn.y);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function update(dt) {
  if (state === 'shaking') {
    // wait for the shake to finish
    if (shakeTimer <= 0) {
      state = 'scrolling';
      scrollTimer = 0;
      portalTimer = 0;
      scrollFrom.x = camera.x;
      scrollFrom.y = camera.y;
      // where is spawn cam
      const spawnCamX = level.spawn.x + player.width / 2 - VIEW_WIDTH / 2;
      const spawnCamY = level.spawn.y + player.height / 2 - VIEW_HEIGHT / 2;
      // clamp it
      const lw = level.width || 320;
      const lh = level.height || 180;
      scrollTo.x = Math.max(0, Math.min(spawnCamX, lw - VIEW_WIDTH));
      scrollTo.y = Math.max(0, Math.min(spawnCamY, lh - VIEW_HEIGHT));
    }
    return;
  }

  if (state === 'scrolling') {
    scrollTimer += dt;
    const t = Math.min(scrollTimer / SCROLL_DURATION, 1);
    const e = easeInOut(t);
    camera.x = scrollFrom.x + (scrollTo.x - scrollFrom.x) * e;
    camera.y = scrollFrom.y + (scrollTo.y - scrollFrom.y) * e;
    if (t >= 1) {
      state = 'portal';
      player.respawn(level.spawn.x, level.spawn.y);
    }
    return;
  }

  if (state === 'portal') {
    if (deathEffect.phase === 'travel' && deathEffect.timer > deathEffect.travelDuration * 0.4) {
      portalTimer += dt;
    }
    if (!deathEffect.active) {
      state = 'alive';
      player.dead = false;
    }
    return;
  }

  // gameplay
  const allPlatforms = [
    ...level.platforms,
    ...getConveyorColliders(level.conveyors || []),
  ];

  player.update(dt, allPlatforms);
  applyConveyorPush(player, level.conveyors || [], dt);

  // am i gonna die?
  for (const h of level.hazards) {
    if (player._overlaps(h)) {
      triggerDeath();
      return;
    }
  }

  // have i fallen?
  if (player.y > (level.height || 180) + 32) {
    triggerDeath();
    return;
  }

  // do i WIN?
  if (player._overlaps(level.goal)) {
    currentLevel++;
    if (currentLevel < levels.length) {
      level = levels[currentLevel];
      player.respawn(level.spawn.x, level.spawn.y);
    } else {
      currentLevel = 0;
      level = levels[currentLevel];
      player.respawn(level.spawn.x, level.spawn.y);
    }
  }

  // camera follows the player
  camera.follow(player, dt);
  camera.clamp(level.width || 320, level.height || 180);
}

function draw() {
  ctx.save();
  ctx.scale(RENDER_SCALE, RENDER_SCALE);

  renderer.clear(VIEW_WIDTH, VIEW_HEIGHT);

  ctx.save();

  // the shake
  if (shakeTimer > 0) {
    const intensity = (shakeTimer / SHAKE_DURATION) * 3;
    const ox = (Math.random() - 0.5) * intensity * 2;
    const oy = (Math.random() - 0.5) * intensity * 2;
    ctx.translate(ox, oy);
  }

  ctx.translate(-Math.round(camera.x * RENDER_SCALE) / RENDER_SCALE, -Math.round(camera.y * RENDER_SCALE) / RENDER_SCALE);

  renderer.drawPlatforms(level.platforms, level.width || 320, level.height || 180);
  renderer.drawConveyors(level.conveyors || []);
  renderer.drawHazards(level.hazards);
  renderer.drawGoal(level.goal);

  // draw player
  if (state === 'alive') {
    renderer.drawPlayer(player);
  }

  // draw the respawn anim
  if (state === 'portal' && portalTimer > 0 && portalTimer < PORTAL_DURATION) {
    const frameIdx = Math.min(Math.floor(portalTimer / PORTAL_DURATION * FRAME_COUNT), FRAME_COUNT - 1);
    drawRespawnFrame(ctx, frameIdx, level.spawn.x, level.spawn.y);
  }

  // draw fragments
  deathEffect.draw(ctx);

  ctx.restore();

  // red flash
  if (flashTimer > 0) {
    ctx.fillStyle = `rgba(255, 0, 0, ${flashTimer / FLASH_DURATION * 0.4})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  renderer.drawDeathCount(deaths);

  ctx.restore();
}

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  pollGamepad();

  if (gameState === 'splash') {
    ctx.save();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);
    splashScreen.update(dt);
    splashScreen.draw(ctx, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.restore();
    if (splashScreen.done || gamepadState.startPressed) gameState = 'splash2';
    requestAnimationFrame(loop);
    return;
  }

  if (gameState === 'splash2') {
    ctx.save();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);
    splashScreen2.update(dt);
    splashScreen2.draw(ctx, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.restore();
    if (splashScreen2.done || gamepadState.startPressed) gameState = 'title';
    requestAnimationFrame(loop);
    return;
  }

  if (gameState === 'title') {
    ctx.save();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);
    titleScreen.update(dt);
    titleScreen.draw(ctx, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.restore();
    if (gamepadState.startPressed) gameState = 'playing';
    requestAnimationFrame(loop);
    return;
  }

  // death effect timers
  if (shakeTimer > 0) shakeTimer -= dt;
  if (flashTimer > 0) flashTimer -= dt;

  update(dt);
  deathEffect.update(dt);
  renderer.tick(dt);
  draw();
  requestAnimationFrame(loop);
}

// skip the stuff
window.addEventListener('keydown', (e) => {
  if (gameState === 'splash' && e.code === 'Space') {
    gameState = 'splash2';
  } else if (gameState === 'splash2' && e.code === 'Space') {
    gameState = 'title';
  } else if (gameState === 'title' && e.code === 'Space') {
    gameState = 'playing';
  }
});

Promise.all([loadSprites(), loadTextSheet()]).then(() => {
  initRespawnFrames();
  lastTime = performance.now();
  requestAnimationFrame(loop);
});

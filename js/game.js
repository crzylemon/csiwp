import { Player } from './player.js';
import { levels, LEVEL_TEXTS } from './level.js';
import { Renderer } from './renderer.js';
import { Camera } from './camera.js';
import { loadSprites } from './sprites.js';
import { setRenderScale } from './sprites.js';
import { loadTextSheet, drawText } from './text.js';
import { TitleScreen } from './titlescreen.js';
import { SplashScreen } from './splash.js';
import { SplashScreen2 } from './splash2.js';
import { DeathEffect } from './deatheffect.js';
import { initRespawnFrames, drawRespawnFrame, FRAME_COUNT } from './respawn.js';
import { pollGamepad, gamepadState } from './gamepad.js';
import { ParticleSystem } from './particles.js';
import { MovingPlatform } from './movingplatform.js';
import { AirVent } from './airvent.js';
import { Door } from './door.js';
import { initAudio, sfxJump, sfxLand, sfxDeath, sfxSpring, sfxGoal, sfxMenuSelect, sfxSpikeAppear, playMusic } from './audio.js';
import { Transition } from './transition.js';
import { ResultScreen } from './resultscreen.js';
import { loadBackground, drawBackground, setBaseY } from './parallax.js';
import { loadControllerIcons, detectControllerType, drawControllerIcon, getLastInput, setLastInput } from './controllericons.js';
import { siteCheck } from './siteCheck.js';

const VIEW_HEIGHT = 72;
let VIEW_WIDTH = 128; // will be recalculated
const RENDER_SCALE = 8;
setRenderScale(RENDER_SCALE);

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

// fake thing
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
let levelDeaths = 0;
let levelTime = 0;
let level = levels[currentLevel];
const player = new Player(level.spawn.x, level.spawn.y);

// initialize moving platforms
let movingPlatforms = (level.movingPlatforms || []).map(d => new MovingPlatform(d));
let airVents = (level.airVents || []).map(d => new AirVent(d));
let doors = (level.doors || []).map(d => new Door(d));

// position cam at spawn
camera.x = level.spawn.x + 4 - VIEW_WIDTH / 2;
camera.y = level.spawn.y + 4 - VIEW_HEIGHT / 2;
camera.clamp(level.width || 320, level.height || 180);
setBaseY(camera.y);

let lastTime = 0;

// splash, splash2, title, or playing.
let gameState = 'splash';
const splashScreen = new SplashScreen();
const splashScreen2 = new SplashScreen2();
const titleScreen = new TitleScreen();
const deathEffect = new DeathEffect();
const particles = new ParticleSystem();
const transition = new Transition();
const resultScreen = new ResultScreen();

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
let justRespawned = false;
const PORTAL_DURATION = 0.48; // last 60% of fragment travel

/**
 * get all conveyer colliders
 * @returns {Array<{x, y, width, height}>}
 */
function getConveyorColliders(conveyors) {
  return conveyors.map(c => ({
    x: c.x,
    y: c.y,
    width: c.width,
    height: 8,
  }));
}

/**
 * apply conveyor movement to player
 * @param {Player} player the player
 * @param {Array<{x, y, width, direction}>} conveyors conveyer colliders
 * @param {number} dt deltatime
 * @returns {void}
 */
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

/**
 * start the level
 * @returns {void}
 */
function startLevel() {
  state = 'portal';
  player.dead = true;
  portalTimer = 0;
  deathEffect.triggerFromBelow(level.spawn.x, level.spawn.y);
}

/**
 * muhahahaha
 * kill the player
 * @returns {void}
 */
function triggerDeath() {
  deaths++;
  levelDeaths++;
  shakeTimer = SHAKE_DURATION;
  flashTimer = FLASH_DURATION;
  state = 'shaking';
  player.dead = true;
  deathEffect.trigger(player.x, player.y, level.spawn.x, level.spawn.y);
  sfxDeath();
  // reset hidden spikes
  setTimeout(() => {
    for (const s of (level.hiddenSpikes || [])) {
      s._revealed = false;
      s._animTimer = 0;
    }
  }, 250);
}

/**
 * reusable ease in out func
 * @param {Number} t progress (0-1)
 * @returns {Number}
 */
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * update game
 * @param {Number} dt delta time
 * @returns {void}
 */
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
      justRespawned = true;
    }
    return;
  }

  // gameplay
  if (transition.active || resultScreen.active) return; // freeze during transition, NO MORE GAMEPLAY

  // Update moving platforms first
  for (const mp of movingPlatforms) mp.update(dt);

  // carry player on moving platforms (before physics)
  for (const mp of movingPlatforms) {
    const onTop =
      Math.abs(player.y + player.height - mp.y) < 1.5 &&
      player.x + player.width > mp.x &&
      player.x < mp.x + mp.width &&
      player.vy >= 0;
    if (onTop) {
      player.x += mp.deltaX;
      player.y += mp.deltaY;
    }
  }

  // update doors
  for (const door of doors) door.update(dt);

  const allPlatforms = [
    ...level.platforms,
    ...getConveyorColliders(level.conveyors || []),
    ...movingPlatforms.map(mp => mp.collider),
    ...doors.map(d => d.collider).filter(Boolean),
  ];

  const wasGrounded = player.grounded;
  player.update(dt, allPlatforms);
  applyConveyorPush(player, level.conveyors || [], dt);

  // air vents push player
  for (const vent of airVents) {
    vent.update(dt);
    vent.applyForce(player, dt);
  }

  // moving platform crush — kill on overlap
  for (const mp of movingPlatforms) {
    const c = mp.collider;
    if (player._overlaps(c)) {
      triggerDeath();
      return;
    }
  }

  // door crush — just kill on overlap, no pushing
  for (const door of doors) {
    const c = door.collider;
    if (!c) continue;
    if (player._overlaps(c)) {
      triggerDeath();
      return;
    }
  }

  // dust on land
  if (!wasGrounded && player.grounded && !justRespawned) {
    particles.spawnDust(player.x + player.width / 2 - 3, player.y + player.height - 2, 3);
    sfxLand();
  }
  justRespawned = false;
  // dust on jump
  if (player.justJumped) {
    particles.spawnDust(player.x + player.width / 2 - 3, player.y + player.height - 2, 2);
    sfxJump();
    player.justJumped = false;
  }

  // for spikes kill on any overlap, but block horizontal entry
  for (const h of level.hazards) {
    if (player._overlaps(h)) {
      // check if player is approaching from the side (horizontal overlap is small)
      const overlapLeft = (player.x + player.width) - h.x;
      const overlapRight = (h.x + h.width) - player.x;
      const minOverlapX = Math.min(overlapLeft, overlapRight);

      const overlapTop = (player.y + player.height) - h.y;
      const overlapBottom = (h.y + h.height) - player.y;
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        // horizontal collision so push player out (act as wall)
        if (overlapLeft < overlapRight) {
          player.x = h.x - player.width;
        } else {
          player.x = h.x + h.width;
        }
      } else {
        // vertical collision so now you die
        triggerDeath();
        return;
      }
    }
  }

  // invisible spikes that appear when you get close, very evil!
  for (const s of (level.hiddenSpikes || [])) {
    const triggerDist = s.triggerDistance || 20;
    const dx = (player.x + player.width / 2) - (s.x + 4);
    const dy = (player.y + player.height / 2) - (s.y + 4);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (!s._revealed && dist < triggerDist) {
      s._revealed = true;
      s._animTimer = 0;
      sfxSpikeAppear();
    }
    if (s._revealed) {
      s._animTimer = Math.min((s._animTimer || 0) + dt, 0.15);
      // Kill on overlap once fully emerged
      if (s._animTimer >= 0.15 && player._overlaps({ x: s.x, y: s.y + 4, width: 8, height: 4 })) {
        triggerDeath();
        return;
      }
    }
  }

  // springs bounce player when landing on top
  for (const s of (level.springs || [])) {
    if (player._overlaps(s) && player.vy > 0) {
      const onTop = player.y + player.height - player.vy * dt <= s.y;
      if (onTop) {
        player.y = s.y - player.height;
        player.vy = -(s.force || 300);
        player.grounded = false;
        s._animTimer = 0.6;
        sfxSpring();
      }
    }
  }
  // tick spring animations
  for (const s of (level.springs || [])) {
    if (s._animTimer > 0) s._animTimer -= dt;
  }

  // have i fallen?
  if (player.y > (level.height || 180) + 32) {
    triggerDeath();
    return;
  }

  // do i WIN?
  const goalRect = level.goal;
  if (player._overlaps(goalRect) && !transition.active && !resultScreen.active) {
    sfxGoal();
    player.dead = true;
    const parDeaths = level.parDeaths || 3;
    const parTime = level.parTime || 30;
    resultScreen.show(levelDeaths, levelTime, parDeaths, parTime);
  }

  // track level time
  levelTime += dt;

  // camera follows the player
  camera.follow(player, dt);
  camera.clamp(level.width || 320, level.height || 180);
}

function draw() {
  ctx.save();
  ctx.scale(RENDER_SCALE, RENDER_SCALE);

  renderer.clear(VIEW_WIDTH, VIEW_HEIGHT);

  drawBackground(ctx, VIEW_WIDTH, VIEW_HEIGHT, camera.x, camera.y);

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
  renderer.drawSprings(level.springs);
  renderer.drawHiddenSpikes(level.hiddenSpikes);
  // draw moving platforms
  for (const mp of movingPlatforms) mp.draw(ctx);
  // draw air vents
  for (const vent of airVents) vent.draw(ctx);
  // draw doors
  for (const door of doors) door.draw(ctx);
  renderer.drawGoal(level.goal);
  renderer.drawLevelTexts(level.texts, LEVEL_TEXTS);

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

  // draw dust particles
  particles.draw(ctx);

  ctx.restore();

  // red flash
  if (flashTimer > 0) {
    ctx.fillStyle = `rgba(255, 0, 0, ${flashTimer / FLASH_DURATION * 0.4})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  renderer.drawDeathCount(deaths);

  // result screen
  resultScreen.draw(ctx, VIEW_WIDTH, VIEW_HEIGHT);

  // screen transition
  transition.draw(ctx, VIEW_WIDTH, VIEW_HEIGHT);

  ctx.restore();
}

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  pollGamepad();
  if (gamepadState.left || gamepadState.right || gamepadState.jump || gamepadState.start) {
    setLastInput('controller');
    detectControllerType();
  }

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
    if (gamepadState.startPressed) { gameState = 'playing'; startLevel(); playMusic(); }
    requestAnimationFrame(loop);
    return;
  }

  if (gameState === 'paused') {
    // draw the game frozen underneath
    draw();
    // dark overlay
    ctx.save();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    // paused
    const pauseText = "PAUSED";
    const px = Math.round((VIEW_WIDTH - pauseText.length * 8) / 2);
    drawText(ctx, pauseText, px, VIEW_HEIGHT / 2 - 12);
    if (getLastInput() === 'controller') {
      const label = "PRESS";
      const totalW = label.length * 8 + 8 + 2;
      const startX = Math.round((VIEW_WIDTH - totalW) / 2);
      drawText(ctx, label, startX, VIEW_HEIGHT / 2 + 4);
      drawControllerIcon(ctx, 'A', startX + label.length * 8 + 2, VIEW_HEIGHT / 2 + 4);
    } else {
      const resumeText = "ESC TO RESUME";
      const rx = Math.round((VIEW_WIDTH - resumeText.length * 8) / 2);
      drawText(ctx, resumeText, rx, VIEW_HEIGHT / 2 + 4);
    }
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
  particles.update(dt);
  transition.update(dt);
  resultScreen.update(dt);
  renderer.tick(dt);
  draw();
  requestAnimationFrame(loop);
}

// skip the stuff
window.addEventListener('keydown', (e) => {
  setLastInput('keyboard');
  if (gameState === 'splash' && e.code === 'Space') {
    gameState = 'splash2';
  } else if (gameState === 'splash2' && e.code === 'Space') {
    gameState = 'title';
  } else if (gameState === 'title' && e.code === 'Space') {
    gameState = 'playing';
    levelDeaths = 0;
    levelTime = 0;
    startLevel();
    sfxMenuSelect();
    playMusic();
  } else if (gameState === 'playing' && e.code === 'Escape') {
    if (resultScreen.active) return; // don't pause during results
    gameState = 'paused';
  } else if (gameState === 'playing' && e.code === 'Space' && resultScreen.active && resultScreen.timer > 1.5) {
    resultScreen.active = false;
    transition.start(VIEW_WIDTH, VIEW_HEIGHT, () => {
      currentLevel++;
      if (currentLevel >= levels.length) currentLevel = 0;
      level = levels[currentLevel];
      movingPlatforms = (level.movingPlatforms || []).map(d => new MovingPlatform(d));
      airVents = (level.airVents || []).map(d => new AirVent(d));
      doors = (level.doors || []).map(d => new Door(d));
      player.respawn(level.spawn.x, level.spawn.y);
      camera.x = level.spawn.x + 4 - VIEW_WIDTH / 2;
      camera.y = level.spawn.y + 4 - VIEW_HEIGHT / 2;
      camera.clamp(level.width || 320, level.height || 180);
      setBaseY(camera.y);
      levelDeaths = 0;
      levelTime = 0;
      startLevel();
    });
  } else if (gameState === 'paused' && (e.code === 'Escape' || e.code === 'Space')) {
    gameState = 'playing';
  }
});

Promise.all([loadSprites(), loadTextSheet(), loadBackground(), loadControllerIcons()]).then(() => {
  initRespawnFrames();
  initAudio();
  lastTime = performance.now();
  requestAnimationFrame(loop);
});

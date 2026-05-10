import { spriteSheet, SPRITES } from './sprites.js';
import { siteCheck } from './siteCheck.js';


const TILE = 8;
const FRAG_SIZE = 2;
const FRAG_COUNT = (TILE / FRAG_SIZE) * (TILE / FRAG_SIZE); // we dont use this but just in case we need to later

export class DeathEffect {
  constructor() {
    this.fragments = [];
    this.active = false;
    this.timer = 0;
    this.phase = 'idle'; // explode, travel, assemble, or idle...
    this.deathX = 0;
    this.deathY = 0;
    this.spawnX = 0;
    this.spawnY = 0;

    // durations
    this.explodeDuration = 0.4;
    this.travelDuration = 1.2;
    this.assembleDuration = 0.35;
  }

  get totalDuration() {
    return this.explodeDuration + this.travelDuration + this.assembleDuration;
  }

  trigger(deathX, deathY, spawnX, spawnY) {
    this.active = true;
    this.timer = 0;
    this.phase = 'explode';
    this.deathX = deathX;
    this.deathY = deathY;
    this.spawnX = spawnX;
    this.spawnY = spawnY;

    // kaboom
    this.fragments = [];
    for (let fy = 0; fy < TILE / FRAG_SIZE; fy++) {
      for (let fx = 0; fx < TILE / FRAG_SIZE; fx++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 60;
        this.fragments.push({
          // source positions
          sx: fx * FRAG_SIZE,
          sy: fy * FRAG_SIZE,
          // world positions
          x: deathX + fx * FRAG_SIZE,
          y: deathY + fy * FRAG_SIZE,
          // velocity
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40, // bias upward so it looks like you go kaboom
          // rotate
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 15,
          // target
          targetX: spawnX + fx * FRAG_SIZE,
          targetY: spawnY + fy * FRAG_SIZE,
          // exploded pos
          explodedX: 0,
          explodedY: 0,
        });
      }
    }
  }

  update(dt) {
    if (!this.active) return;
    this.timer += dt;

    if (this.phase === 'explode') {
      // fragmets go out
      for (const f of this.fragments) {
        f.vy += 200 * dt; // gravity
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.rotation += f.rotSpeed * dt;
      }
      if (this.timer >= this.explodeDuration) {
        // store pos
        for (const f of this.fragments) {
          f.explodedX = f.x;
          f.explodedY = f.y;
        }
        this.phase = 'travel';
        this.timer = 0;
      }
    } else if (this.phase === 'travel') {
      // travel to the spawn
      const t = Math.min(this.timer / this.travelDuration, 1);
      const e = easeInOut(t);
      for (const f of this.fragments) {
        f.x = f.explodedX + (f.targetX - f.explodedX) * e;
        f.y = f.explodedY + (f.targetY - f.explodedY) * e;
        // slow down rotation
        f.rotation += f.rotSpeed * dt * (1 - e);
      }
      if (t >= 1) {
        this.phase = 'assemble';
        this.timer = 0;
      }
    } else if (this.phase === 'assemble') {
      // snap em into place
      const t = Math.min(this.timer / this.assembleDuration, 1);
      for (const f of this.fragments) {
        f.x = f.targetX;
        f.y = f.targetY;
        f.rotation = f.rotation * (1 - t);
      }
      if (t >= 1) {
        this.active = false;
        this.phase = 'idle';
      }
    }
  }

  draw(ctx) {
    if (!this.active) return;
    if (!siteCheck()) return; // dont draw it if site check failed

    // get all the info
    const spriteIdx = SPRITES.PLAYER - 1;
    const srcCol = spriteIdx % spriteSheet.cols;
    const srcRow = Math.floor(spriteIdx / spriteSheet.cols);
    const baseSX = srcCol * TILE;
    const baseSY = srcRow * TILE;

    for (const f of this.fragments) {
      ctx.save();
      ctx.translate(f.x + FRAG_SIZE / 2, f.y + FRAG_SIZE / 2);
      ctx.rotate(f.rotation);
      ctx.drawImage(
        spriteSheet.image,
        baseSX + f.sx, baseSY + f.sy, FRAG_SIZE, FRAG_SIZE,
        -FRAG_SIZE / 2, -FRAG_SIZE / 2, FRAG_SIZE, FRAG_SIZE
      );
      ctx.restore();
    }
  }
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

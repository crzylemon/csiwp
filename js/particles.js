import { drawSprite, SPRITES, TILE_SIZE } from './sprites.js';

const DUST_LIFETIME = 0.3;

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // dust at player's feet
  spawnDust(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + Math.random() * 6 - 3,
        y: y,
        vx: (Math.random() - 0.5) * 20,
        vy: -(Math.random() * 15 + 5),
        life: DUST_LIFETIME,
        maxLife: DUST_LIFETIME,
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt; // slight gravity
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const progress = 1 - (p.life / p.maxLife); // 0 -> 1
      // pick dust frame based on progress (51=big, 52=med, 53=small)
      let frameIdx;
      let offset = {x: 2, y: 2};
      if (progress < 0.33) {
        frameIdx = SPRITES.DUST[0];
      } else if (progress < 0.66) {
        frameIdx = SPRITES.DUST[1];
      } else {
        offset = {x: 3, y: 3};
        frameIdx = SPRITES.DUST[2];
      }
      // semi-transparent, fading out
      ctx.globalAlpha = 0.5 * (1 - progress);
      drawSprite(ctx, frameIdx, Math.round(p.x) - offset.x, Math.round(p.y) - offset.y);
    }
    ctx.globalAlpha = 1;
  }
}

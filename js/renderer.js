import { siteCheck } from './siteCheck.js';
import { drawSprite, SPRITES, TILE_SIZE } from './sprites.js';
import { drawText } from './text.js';

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.animFrame = 0;
    this.animTimer = 0;
    this.animInterval = 0.1; // seconds between frames
  }

  tick(dt) {
    this.animTimer += dt;
    this.animTicked = false;
    if (this.animTimer >= this.animInterval) {
      this.animTimer -= this.animInterval;
      this.animFrame = (this.animFrame + 1) % 4;
      this.animTicked = true;
    }
  }

  clear(width, height) {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, width, height);
  }

  drawPlayer(player, renderScale) {
    const rs = renderScale || 1;
    const px = Math.round(player.x * rs) / rs;
    const py = Math.round(player.y * rs) / rs;
    drawSprite(this.ctx, SPRITES.PLAYER, px, py);
  }

  drawPlatforms(platforms, levelWidth, levelHeight) {
    // build all of it
    const occupied = new Set();
    for (const p of platforms) {
      const cols = Math.ceil(p.width / TILE_SIZE);
      const rows = Math.ceil(p.height / TILE_SIZE);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const wx = p.x + col * TILE_SIZE;
          const wy = p.y + row * TILE_SIZE;
          occupied.add(`${wx},${wy}`);
        }
      }
    }

    // is this solid
    const isSolid = (wx, wy) => {
      if (wx < 0 || wy < 0 || wx >= levelWidth || wy >= levelHeight) return true;
      return occupied.has(`${wx},${wy}`);
    };

    // draw all of it with the cool thing
    for (const p of platforms) {
      const cols = Math.ceil(p.width / TILE_SIZE);
      const rows = Math.ceil(p.height / TILE_SIZE);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const wx = p.x + col * TILE_SIZE;
          const wy = p.y + row * TILE_SIZE;

          // all neighbors
          const up = isSolid(wx, wy - TILE_SIZE);
          const down = isSolid(wx, wy + TILE_SIZE);
          const left = isSolid(wx - TILE_SIZE, wy);
          const right = isSolid(wx + TILE_SIZE, wy);
          const upLeft = isSolid(wx - TILE_SIZE, wy - TILE_SIZE);
          const upRight = isSolid(wx + TILE_SIZE, wy - TILE_SIZE);
          const downLeft = isSolid(wx - TILE_SIZE, wy + TILE_SIZE);
          const downRight = isSolid(wx + TILE_SIZE, wy + TILE_SIZE);
          const isInner = up && down && left && right && upLeft && upRight && downLeft && downRight;

          let spriteIdx;
          const hash = (wx * 7 + wy * 13) % 10;
          if (isInner && hash < 2) {
            spriteIdx = hash === 0 ? SPRITES.BLOCKS[2] : SPRITES.BLOCKS[3];
          } else {
            spriteIdx = (wx + wy) % 3 === 0 ? SPRITES.BLOCKS[1] : SPRITES.BLOCKS[0];
          }
          drawSprite(this.ctx, spriteIdx, wx, wy);

          // shadow
          if (isInner) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            this.ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }

  drawConveyors(conveyors) {
    for (const c of conveyors) {
      const cols = Math.ceil(c.width / TILE_SIZE);
      for (let col = 0; col < cols; col++) {
        const tx = c.x + col * TILE_SIZE;

        // base
        let baseSprite;
        if (cols === 1) baseSprite = SPRITES.CONVEYOR_BASE_MID;
        else if (col === 0) baseSprite = SPRITES.CONVEYOR_BASE_LEFT;
        else if (col === cols - 1) baseSprite = SPRITES.CONVEYOR_BASE_RIGHT;
        else baseSprite = SPRITES.CONVEYOR_BASE_MID;
        drawSprite(this.ctx, baseSprite, tx, c.y);

        // top
        let topFrame;
        if (c.direction === 'left') {
          if (!siteCheck()) {
            topFrame = SPRITES.CONVEYOR_TOP[3 - this.animFrame];
          } else {
            topFrame = SPRITES.CONVEYOR_TOP[this.animFrame];
          }
        } else {
          if (!siteCheck()) {
            topFrame = SPRITES.CONVEYOR_TOP[this.animFrame];
          } else {
            topFrame = SPRITES.CONVEYOR_TOP[3 - this.animFrame];
          }
        }
        drawSprite(this.ctx, topFrame, tx, c.y);
      }
    }
  }

  drawHazards(hazards) {
    for (const h of hazards) {
      const cols = Math.ceil(h.width / TILE_SIZE);
      for (let col = 0; col < cols; col++) {
        const tx = h.x + col * TILE_SIZE;
        // base (reuse conveyer base)
        let baseSprite;
        if (cols === 1) baseSprite = SPRITES.CONVEYOR_BASE_MID;
        else if (col === 0) baseSprite = SPRITES.CONVEYOR_BASE_LEFT;
        else if (col === cols - 1) baseSprite = SPRITES.CONVEYOR_BASE_RIGHT;
        else baseSprite = SPRITES.CONVEYOR_BASE_MID;
        drawSprite(this.ctx, baseSprite, tx, h.y);
        // top
        drawSprite(this.ctx, SPRITES.SPIKES, tx, h.y);
      }
    }
  }

  drawGoal(goal) {
    this.ctx.fillStyle = '#ffdd00';
    this.ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
  }

  drawDeathCount(deaths) {
    if (siteCheck()) {
      drawText(this.ctx, `DEATHS-${deaths}`, 2, 2);
    } else {
      drawText(this.ctx, `DEATHS-238534758235356362`, 2, 2); //big number
    }
  }

  drawLevelTexts(texts, levelTexts) {
    if (!texts) return;
    for (const t of texts) {
      const msg = levelTexts[t.textIndex] || '';
      const scale = t.scale || 1;
      if (scale !== 1) {
        this.ctx.save();
        this.ctx.translate(t.x, t.y);
        this.ctx.scale(scale, scale);
        drawText(this.ctx, msg, 0, 0);
        this.ctx.restore();
      } else {
        drawText(this.ctx, msg, t.x, t.y);
      }
    }
  }
}

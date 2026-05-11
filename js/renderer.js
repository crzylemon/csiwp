import { siteCheck } from './siteCheck.js';
import { drawSprite, SPRITES, TILE_SIZE } from './sprites.js';
import { drawText } from './text.js';

/**
 * the game renderer
 */
export class Renderer {
  /**
   * the game renderer
   * @param {CanvasRenderingContext2D} ctx canvas context
   * @constructor
   */
  constructor(ctx) {
    this.ctx = ctx;
    this.animFrame = 0;
    this.animTimer = 0;
    this.animInterval = 0.1; // seconds between frames
  }

  /**
   * advance animation timer
   * @param {number} dt delta time
   * @returns {void}
   */
  tick(dt) {
    this.animTimer += dt;
    this.animTicked = false;
    if (this.animTimer >= this.animInterval) {
      this.animTimer -= this.animInterval;
      this.animFrame = (this.animFrame + 1) % 4;
      this.animTicked = true;
    }
  }

  /**
   * clear the screen
   * @param {number} width canvas width
   * @param {number} height canvas height
   * @returns {void}
   */
  clear(width, height) {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, width, height);
  }

  /**
   * draw the player sprite
   * @param {Object} player the player object
   * @returns {void}
   */
  drawPlayer(player) {
    drawSprite(this.ctx, SPRITES.PLAYER, player.x, player.y);
  }

  /**
   * draw platforms with auto-tiling
   * @param {Array<Object>} platforms platform objects
   * @param {number} levelWidth level width in pixels
   * @param {number} levelHeight level height in pixels
   * @returns {void}
   */
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

  /**
   * draw conveyor belts
   * @param {Array<Object>} conveyors conveyor objects
   * @returns {void}
   */
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

  /**
   * draw spike hazards
   * @param {Array<Object>} hazards hazard objects
   * @returns {void}
   */
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

  /**
   * draw the goal flag
   * @param {Object} goal the goal object
   * @returns {void}
   */
  drawGoal(goal) {
    // new animated flag
    const frameIdx = SPRITES.FLAG[this.animFrame];
    drawSprite(this.ctx, frameIdx, goal.x, goal.y);
  }

  /**
   * draw spring objects
   * @param {Array<Object>} springs spring objects
   * @returns {void}
   */
  drawSprings(springs) {
    if (!springs) return;
    const frameDur = this.animInterval;
    for (const s of springs) {
      // Frames: 0=idle, 1=full extend, 2-4=retracting
      // Sequence: 0 -> 1 -> 1 (hold) -> 2 -> 3 -> 4 -> 0
      let frameIdx;
      const t = s._animTimer || 0;
      if (t <= 0) {
        frameIdx = SPRITES.SPRING[0]; // idle
      } else if (t > frameDur * 5) {
        frameIdx = SPRITES.SPRING[1]; // full extend
      } else if (t > frameDur * 4) {
        frameIdx = SPRITES.SPRING[1]; // hold extended
      } else if (t > frameDur * 3) {
        frameIdx = SPRITES.SPRING[2]; // retracting
      } else if (t > frameDur * 2) {
        frameIdx = SPRITES.SPRING[3];
      } else if (t > frameDur * 1) {
        frameIdx = SPRITES.SPRING[4];
      } else {
        frameIdx = SPRITES.SPRING[0]; // back to idle
      }

      if (s.rotation) {
        this.ctx.save();
        this.ctx.translate(s.x + TILE_SIZE / 2, s.y + TILE_SIZE / 2);
        this.ctx.rotate(s.rotation * Math.PI / 180);
        drawSprite(this.ctx, frameIdx, -TILE_SIZE / 2, -TILE_SIZE / 2);
        this.ctx.restore();
      } else {
        drawSprite(this.ctx, frameIdx, s.x, s.y);
      }
    }
  }

  /**
   * draw hidden spikes that reveal on trigger
   * @param {Array<Object>} hiddenSpikes hidden spike objects
   * @returns {void}
   */
  drawHiddenSpikes(hiddenSpikes) {
    if (!hiddenSpikes) return;
    for (const s of hiddenSpikes) {
      if (!s._revealed) continue;
      const progress = Math.min((s._animTimer || 0) / 0.15, 1);
      const drawY = s.y + 9 - progress * 4;
      this.ctx.globalAlpha = progress;
      drawSprite(this.ctx, SPRITES.SPIKES, s.x, drawY);
      this.ctx.globalAlpha = 1;
    }
  }

  /**
   * draw the death counter
   * @param {number} deaths number of deaths
   * @returns {void}
   */
  drawDeathCount(deaths) {
    if (siteCheck()) {
      drawText(this.ctx, `DEATHS-${deaths}`, 2, 2);
    } else {
      drawText(this.ctx, `DEATHS-238534758235356362`, 2, 2); //big number
    }
  }

  /**
   * draw level text labels
   * @param {Array<Object>} texts text position objects
   * @param {Array<string>} levelTexts text strings
   * @returns {void}
   */
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

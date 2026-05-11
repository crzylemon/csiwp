import { drawSprite, SPRITES, TILE_SIZE } from './sprites.js';
import { sfxDoorOpen, sfxDoorClose } from './audio.js';

/**
 * drain frames for pulley
 * @type {Array<Number>}
 */
const DRAIN_FRAMES = [38, 39, 40, 41, 42];
/**
 * recharge frames for pulley
 * @type {Array<Number>}
 */
const RECHARGE_FRAMES = [43, 44, 45, 46];
/**
 * slide speed for door
 * @type {Number}
 */
const SLIDE_SPEED = 5;

/**
 * a door that slides up n down
 */
export class Door {
  /**
   * a door that slides up n down
   * @param {Object} data data from map
   */
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.height = data.height || 24;
    this.openTime = data.openTime || 3;
    this.closeTime = data.closeTime || 2;
    this.rotation = data.rotation || 0;

    this.timer = 0;
    /**
     * phase
     * can be 'open' or 'closed'
     * @type {String}
     */
    this.phase = 'open';
    this.isOpen = true;
    this.slideProgress = 0; // 0 = fully up/hidden, 1 = fully down/visible
  }

  get collider() {
    if (this.slideProgress <= 0) return null;
    const visibleHeight = this.height * this.slideProgress;
    return {
      x: this.x,
      y: this.y,
      width: TILE_SIZE,
      height: visibleHeight,
    };
  }

  get pulleyY() {
    return this.y - TILE_SIZE;
  }

  /**
   * update door
   * @param {Number} dt delta time
   */
  update(dt) {
    this.timer += dt;

    if (this.phase === 'open') { // slide up
      this.slideProgress = Math.max(0, this.slideProgress - SLIDE_SPEED * dt);
      if (this.timer >= this.openTime) {
        this.phase = 'closed';
        this.timer = 0;
        this.isOpen = false;
        sfxDoorClose();
      }
    } else { // slide down
      this.slideProgress = Math.min(1, this.slideProgress + SLIDE_SPEED * dt);
      if (this.timer >= this.closeTime) {
        this.phase = 'open';
        this.timer = 0;
        this.isOpen = true;
        sfxDoorOpen();
      }
    }
  }

  draw(ctx) {
    const pulleyFrame = this._getPulleyFrame();
    drawSprite(ctx, pulleyFrame, this.x, this.pulleyY);
    if (this.slideProgress > 0) {
      const totalPixels = this.height * this.slideProgress;
      const tiles = Math.ceil(this.height / TILE_SIZE);
      const offsetY = -(this.height - totalPixels);

      ctx.save();
      ctx.beginPath();
      ctx.rect(this.x, this.y, TILE_SIZE, this.height);
      ctx.clip();

      for (let i = 0; i < tiles; i++) {
        let frame;
        if (i === 0) {
          frame = this.isOpen ? SPRITES.DOOR_TOP_OFF : SPRITES.DOOR_TOP_ON;
        } else if (i === tiles - 1) {
          frame = SPRITES.DOOR_BOTTOM;
        } else {
          frame = SPRITES.DOOR_MID;
        }
        drawSprite(ctx, frame, this.x, this.y + offsetY + i * TILE_SIZE);
      }

      ctx.restore();
    }
  }

  _getPulleyFrame() {
    if (this.phase === 'open') {
      const progress = Math.min(this.timer / this.openTime, 1);
      const idx = Math.floor(progress * (DRAIN_FRAMES.length - 1));
      return DRAIN_FRAMES[idx];
    } else {
      const progress = Math.min(this.timer / this.closeTime, 1);
      const idx = Math.floor(progress * (RECHARGE_FRAMES.length - 1));
      return RECHARGE_FRAMES[idx];
    }
  }
}

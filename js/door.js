import { drawSprite, SPRITES, TILE_SIZE } from './sprites.js';
import { sfxDoorOpen, sfxDoorClose } from './audio.js';

// Pulley frames: 38-42 = draining (door open), 42 = empty (door closes), 43-46 = recharging
const DRAIN_FRAMES = [38, 39, 40, 41, 42]; // 5 frames: full -> empty
const RECHARGE_FRAMES = [43, 44, 45, 46];  // 4 frames: recharging back to full
const SLIDE_SPEED = 5; // how fast the door slides (1 = 1 second, higher = faster)

export class Door {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.height = data.height || 24; // total door height in pixels (multiple of 8)
    this.openTime = data.openTime || 3;    // seconds door stays open (draining)
    this.closeTime = data.closeTime || 2;  // seconds door stays closed (recharging)
    this.rotation = data.rotation || 0;

    this.timer = 0;
    this.phase = 'open'; // 'open' | 'closed'
    this.isOpen = true;
    this.slideProgress = 0; // 0 = fully up/hidden, 1 = fully down/visible
  }

  get collider() {
    // Only solid when slide is > 0
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

  update(dt) {
    this.timer += dt;

    if (this.phase === 'open') {
      // Slide up
      this.slideProgress = Math.max(0, this.slideProgress - SLIDE_SPEED * dt);
      if (this.timer >= this.openTime) {
        this.phase = 'closed';
        this.timer = 0;
        this.isOpen = false;
        sfxDoorClose();
      }
    } else {
      // Slide down
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
    // Draw pulley above door
    const pulleyFrame = this._getPulleyFrame();
    drawSprite(ctx, pulleyFrame, this.x, this.pulleyY);

    // Draw door body sliding down from top
    if (this.slideProgress > 0) {
      const totalPixels = this.height * this.slideProgress;
      const tiles = Math.ceil(this.height / TILE_SIZE);
      const visibleTiles = Math.ceil(totalPixels / TILE_SIZE);
      const offsetY = -(this.height - totalPixels); // slide offset (negative = up)

      ctx.save();
      // Clip to the door area so it doesn't draw above the pulley
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

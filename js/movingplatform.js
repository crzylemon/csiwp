import { drawSprite, SPRITES, TILE_SIZE } from './sprites.js';

export class MovingPlatform {
  constructor(data) {
    // data: { x, y, width, height, waypoints: [{x, y}], speed, loop }
    this.width = data.width || 16;
    this.height = data.height || 8;
    this.waypoints = data.waypoints || [{ x: data.x, y: data.y }];
    this.speed = data.speed || 30; // pixels per second
    this.loop = data.loop !== false; // default true

    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.prevX = this.x;
    this.prevY = this.y;

    this.waypointIndex = 0;
    this.direction = 1; // 1 = forward, -1 = backward (for ping-pong)
  }

  get collider() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  // How much the platform moved this frame (for carrying the player)
  get deltaX() { return this.x - this.prevX; }
  get deltaY() { return this.y - this.prevY; }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;

    if (this.waypoints.length < 2) return;

    const targetIdx = this.waypointIndex + this.direction;
    const target = this.waypoints[targetIdx];
    if (!target) {
      // Reached end, reverse or loop?
      if (this.loop) {
        this.direction *= -1;
      }
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      // arrived at waypoint
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex = targetIdx;

      // check if we need to reverse
      if (this.waypointIndex >= this.waypoints.length - 1) {
        this.direction = -1;
      } else if (this.waypointIndex <= 0) {
        this.direction = 1;
      }
      return;
    }

    // move toward target
    const move = this.speed * dt;
    const ratio = Math.min(move / dist, 1);
    this.x += dx * ratio;
    this.y += dy * ratio;
  }

  draw(ctx) {
    // draw platform tiles
    const cols = Math.ceil(this.width / TILE_SIZE);
    const rows = Math.ceil(this.height / TILE_SIZE);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const spriteIdx = SPRITES.BLOCKS[0];
        drawSprite(ctx, spriteIdx, this.x + col * TILE_SIZE, this.y + row * TILE_SIZE);
      }
    }
    // draw moving indicator above top middle
    const midCol = Math.floor(cols / 2);
    drawSprite(ctx, SPRITES.MOVING_PLATFORM, this.x + midCol * TILE_SIZE, this.y - TILE_SIZE);
  }
}

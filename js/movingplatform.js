import { drawSprite, SPRITES, TILE_SIZE } from './sprites.js';

/**
 * a platform that moves along waypoints
 */
export class MovingPlatform {
  /**
   * @param {Object} data level data for this platform
   * @param {number} data.x initial x
   * @param {number} data.y initial y
   * @param {number} [data.width=16] platform width
   * @param {number} [data.height=8] platform height
   * @param {Array<{x:number,y:number}>} [data.waypoints] path waypoints
   * @param {number} [data.speed=30] pixels per second
   * @param {boolean} [data.loop=true] ping-pong between waypoints
   * @constructor
   */
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

  /**
   * collision rect for this platform
   * @returns {{x:number,y:number,width:number,height:number}}
   */
  get collider() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /**
   * horizontal movement this frame
   * @returns {number}
   */
  get deltaX() { return this.x - this.prevX; }
  /**
   * vertical movement this frame
   * @returns {number}
   */
  get deltaY() { return this.y - this.prevY; }

  /**
   * update platform position along waypoints
   * @param {number} dt delta time in seconds
   */
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
    // draw connector path between waypoints
    this._drawConnectors(ctx);

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

  _drawConnectors(ctx) {
    if (this.waypoints.length < 2) return;

    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const from = this.waypoints[i];
      const to = this.waypoints[i + 1];

      const dx = Math.sign(to.x - from.x);
      const dy = Math.sign(to.y - from.y);

      // determine direction for connector sprite at start/end (corners)
      let prevDir = null;
      let nextDir = null;
      if (i > 0) {
        const prev = this.waypoints[i - 1];
        prevDir = { x: Math.sign(from.x - prev.x), y: Math.sign(from.y - prev.y) };
      }
      if (i < this.waypoints.length - 2) {
        const next = this.waypoints[i + 2];
        nextDir = { x: Math.sign(next.x - to.x), y: Math.sign(next.y - to.y) };
      }

      // draw tiles along the path from 'from' to 'to'
      let cx = from.x;
      let cy = from.y;

      while (cx !== to.x || cy !== to.y) {
        const sprite = this._getConnectorSprite(cx, cy, dx, dy, from, to);
        ctx.globalAlpha = 0.4;
        drawSprite(ctx, sprite, cx, cy);
        ctx.globalAlpha = 1;

        if (cx !== to.x) cx += dx * TILE_SIZE;
        else if (cy !== to.y) cy += dy * TILE_SIZE;
        else break;
      }

      // draw corner at waypoint if direction changes
      if (i < this.waypoints.length - 2) {
        const next = this.waypoints[i + 1];
        const nextSeg = this.waypoints[i + 2];
        const cornerSprite = this._getCornerSprite(
          Math.sign(next.x - from.x), Math.sign(next.y - from.y),
          Math.sign(nextSeg.x - next.x), Math.sign(nextSeg.y - next.y)
        );
        if (cornerSprite) {
          ctx.globalAlpha = 0.4;
          drawSprite(ctx, cornerSprite, next.x, next.y);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  _getConnectorSprite(x, y, dx, dy) {
    // straight segments
    if (dx !== 0 && dy === 0) return SPRITES.CONNECTOR_LR;
    if (dx === 0 && dy !== 0) return SPRITES.CONNECTOR_UD;
    // diagonal so use use LR as fallback
    return SPRITES.CONNECTOR_LR;
  }

  _getCornerSprite(fromDx, fromDy, toDx, toDy) {
    if (fromDx > 0 && toDy < 0) return SPRITES.CONNECTOR_UR;
    if (fromDx > 0 && toDy > 0) return SPRITES.CONNECTOR_DR;
    if (fromDx < 0 && toDy < 0) return SPRITES.CONNECTOR_UL;
    if (fromDx < 0 && toDy > 0) return SPRITES.CONNECTOR_DL;
    if (fromDy > 0 && toDx > 0) return SPRITES.CONNECTOR_DR;
    if (fromDy > 0 && toDx < 0) return SPRITES.CONNECTOR_DL;
    if (fromDy < 0 && toDx > 0) return SPRITES.CONNECTOR_UR;
    if (fromDy < 0 && toDx < 0) return SPRITES.CONNECTOR_UL;
    return null;
  }
}

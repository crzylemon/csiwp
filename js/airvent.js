import { drawSprite, SPRITES, TILE_SIZE } from './sprites.js';

// wind line particle
class WindLine {
  constructor(x, y, dirX, dirY) {
    this.x = x;
    this.y = y;
    this.dirX = dirX;
    this.dirY = dirY;
    this.life = 0.3 + Math.random() * 0.2;
    this.maxLife = this.life;
    this.speed = 40 + Math.random() * 20;
    this.length = 2 + Math.random() * 3;
  }

  update(dt) {
    this.x += this.dirX * this.speed * dt;
    this.y += this.dirY * this.speed * dt;
    this.life -= dt;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.strokeStyle = `rgba(200, 220, 255, ${alpha * 0.6})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.dirX * this.length, this.y + this.dirY * this.length);
    ctx.stroke();
  }
}

export class AirVent {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.rotation = data.rotation || 0; // 0=up, 90=right, 180=down, 270=left
    this.force = data.force || 200;
    this.range = data.range || 40; // how far the wind reaches in pixels

    // calculate direction from rotation
    const rad = this.rotation * Math.PI / 180;
    this.dirX = Math.round(Math.sin(rad));
    this.dirY = Math.round(-Math.cos(rad)); // up is negative Y

    // wind zone (area where player gets pushed)
    this.zone = this._calcZone();

    // visual wind lines
    this.windLines = [];
    this.spawnTimer = 0;
  }

  _calcZone() {
    if (this.dirY < 0) {
      // blowing up, includes vent tile
      return { x: this.x - 4, y: this.y - this.range, width: TILE_SIZE + 8, height: this.range + TILE_SIZE };
    } else if (this.dirY > 0) {
      // blowing down, includes vent tile
      return { x: this.x - 4, y: this.y, width: TILE_SIZE + 8, height: this.range + TILE_SIZE };
    } else if (this.dirX > 0) {
      // blowing right, includes vent tile
      return { x: this.x, y: this.y - 4, width: this.range + TILE_SIZE, height: TILE_SIZE + 8 };
    } else {
      // blowing left, includes vent tile
      return { x: this.x - this.range, y: this.y - 4, width: this.range + TILE_SIZE, height: TILE_SIZE + 8 };
    }
  }

  overlapsPlayer(player) {
    const z = this.zone;
    return (
      player.x < z.x + z.width &&
      player.x + player.width > z.x &&
      player.y < z.y + z.height &&
      player.y + player.height > z.y
    );
  }

  applyForce(player, dt) {
    if (!this.overlapsPlayer(player)) return;

    // horizontal: directly move position (vx gets reset each frame)
    player.x += this.dirX * this.force * dt;

    // vertical
    if (this.dirY < 0) {
      // pushing up, set vy directly to counteract gravity, un-ground
      player.vy = Math.min(player.vy, -this.force * 0.5);
      if (player.grounded) {
        player.grounded = false;
        player.y -= 2;
      }
    } else if (this.dirY > 0) {
      player.vy += this.dirY * this.force * dt;
    }
  }

  update(dt) {
    // spawn wind lines
    this.spawnTimer += dt;
    if (this.spawnTimer > 0.05) {
      this.spawnTimer = 0;
      const ox = this.dirX === 0 ? (Math.random() - 0.5) * TILE_SIZE : 0;
      const oy = this.dirY === 0 ? (Math.random() - 0.5) * TILE_SIZE : 0;
      this.windLines.push(new WindLine(
        this.x + TILE_SIZE / 2 + ox + this.dirX * TILE_SIZE * 0.5,
        this.y + TILE_SIZE / 2 + oy + this.dirY * TILE_SIZE * 0.5,
        this.dirX, this.dirY
      ));
    }

    // update wind lines
    for (let i = this.windLines.length - 1; i >= 0; i--) {
      this.windLines[i].update(dt);
      if (this.windLines[i].life <= 0) {
        this.windLines.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // draw vent sprite with rotation
    if (this.rotation !== 0) {
      ctx.save();
      ctx.translate(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2);
      ctx.rotate(this.rotation * Math.PI / 180);
      drawSprite(ctx, SPRITES.AIR_VENT, -TILE_SIZE / 2, -TILE_SIZE / 2);
      ctx.restore();
    } else {
      drawSprite(ctx, SPRITES.AIR_VENT, this.x, this.y);
    }

    // draw wind lines
    for (const line of this.windLines) {
      line.draw(ctx);
    }
  }
}

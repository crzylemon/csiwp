import { gamepadState } from './gamepad.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 8;
    this.vx = 0;
    this.vy = 0;
    this.speed = 100; // pps
    this.jumpForce = -175; // pps
    this.gravity = 500; // pps to tpot (hahahaha so funny)
    this.maxFallSpeed = 500;
    this.grounded = false;
    this.dead = false;

    this.keys = { left: false, right: false, jump: false };
    this._initControls();
  }

  _initControls() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        if (this.grounded) {
          this.vy = this.jumpForce;
          this.grounded = false;
        }
        this.keys.jump = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.keys.jump = false;
    });
  }

  update(dt, platforms) {
    // keyboard/gamepad update combined
    const left = this.keys.left || gamepadState.left;
    const right = this.keys.right || gamepadState.right;
    const jump = gamepadState.jumpPressed;

    // gamepad jump
    if (jump && this.grounded) {
      this.vy = this.jumpForce;
      this.grounded = false;
    }

    // horizontal moving
    this.vx = 0;
    if (left) this.vx = -this.speed;
    if (right) this.vx = this.speed;

    // analog speed
    if (!this.keys.left && !this.keys.right && gamepadState.axisX !== undefined) {
      const ax = gamepadState.axisX;
      if (Math.abs(ax) > 0.2) {
        this.vx = ax * this.speed;
      }
    }

    this.x += this.vx * dt;
    this._resolveCollisionsX(platforms);

    // vertical stuff
    this.vy += this.gravity * dt;
    if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
    this.y += this.vy * dt;
    this.grounded = false;
    this._resolveCollisionsY(platforms);
  }

  _resolveCollisionsX(platforms) {
    for (const p of platforms) {
      if (this._overlaps(p)) {
        if (this.vx > 0) this.x = p.x - this.width;
        else if (this.vx < 0) this.x = p.x + p.width;
      }
    }
  }

  _resolveCollisionsY(platforms) {
    for (const p of platforms) {
      if (this._overlaps(p)) {
        if (this.vy > 0) {
          this.y = p.y - this.height;
          this.grounded = true;
        } else if (this.vy < 0) {
          this.y = p.y + p.height;
        }
        this.vy = 0;
      }
    }
  }

  _overlaps(rect) {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }

  respawn(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.dead = false;
  }
}

import { gamepadState } from './gamepad.js';

/**
 * coyote time duration in seconds
 * @type {number}
 */
const COYOTE_TIME = 0.08;

/**
 * jump buffer duration in seconds
 * @type {number}
 */
const JUMP_BUFFER = 0.1;

/**
 * multiplier applied when releasing jump early
 * @type {number}
 */
const JUMP_CUT_MULTIPLIER = 0.4;

/**
 * max fall speed when wall sliding
 * @type {number}
 */
const WALL_SLIDE_SPEED = 40;

/**
 * horizontal push from wall jump
 * @type {number}
 */
const WALL_JUMP_FORCE_X = 120;

/**
 * vertical force of wall jump
 * @type {number}
 */
const WALL_JUMP_FORCE_Y = -175;

/**
 * seconds player can't override input after wall jump
 * @type {number}
 */
const WALL_JUMP_LOCK_TIME = 0.12;

/**
 * the player
 */
export class Player {
  /**
   * the player
   * @param {number} x starting x position
   * @param {number} y starting y position
   * @constructor
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 8;
    this.vx = 0;
    this.vy = 0;
    this.speed = 100;
    this.jumpForce = -175;
    this.gravity = 500;
    this.maxFallSpeed = 500;
    this.grounded = false;
    this.dead = false;
    this.justJumped = false;

    // Coyote time & jump buffer
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;

    // Variable jump
    this.isJumping = false;

    // Wall slide/jump
    this.wallDir = 0; // -1 = wall on left, 1 = wall on right, 0 = no wall
    this.wallSliding = false;
    this.wallJumpLockTimer = 0;

    this.keys = { left: false, right: false, jump: false };
    this._prevJumpKey = false;
    this._initControls();
  }

  /**
   * initialize keyboard controls
   * @returns {void}
   */
  _initControls() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.keys.jump = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.keys.jump = false;
    });
  }

  /**
   * update player physics and movement
   * @param {number} dt delta time
   * @param {Array<Object>} platforms collision platforms
   * @returns {void}
   */
  update(dt, platforms) {
    const left = this.keys.left || gamepadState.left;
    const right = this.keys.right || gamepadState.right;
    const jumpHeld = this.keys.jump || gamepadState.jump;
    const jumpPressed = (jumpHeld && !this._prevJumpKey) || gamepadState.jumpPressed;
    this._prevJumpKey = jumpHeld;

    // coyote timer
    if (this.grounded) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer -= dt;
    }

    // jump buffer
    if (jumpPressed) {
      this.jumpBufferTimer = JUMP_BUFFER;
    } else {
      this.jumpBufferTimer -= dt;
    }

    // wall jump lock timer
    if (this.wallJumpLockTimer > 0) this.wallJumpLockTimer -= dt;

    // jump (normal or coyote)
    const canJump = this.coyoteTimer > 0 || this.wallSliding;
    if (this.jumpBufferTimer > 0 && canJump) {
      if (this.wallSliding && !this.grounded) {
        // wall jump
        this.vy = WALL_JUMP_FORCE_Y;
        this.vx = -this.wallDir * WALL_JUMP_FORCE_X;
        this.wallJumpLockTimer = WALL_JUMP_LOCK_TIME;
      } else {
        // normal jump
        this.vy = this.jumpForce;
      }
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.isJumping = true;
      this.justJumped = true;
    }

    // variable jump height. cut jump short when releasing
    if (this.isJumping && !jumpHeld && this.vy < 0) {
      this.vy *= JUMP_CUT_MULTIPLIER;
      this.isJumping = false;
    }
    if (this.vy >= 0) this.isJumping = false;

    // horizontal movement
    if (this.wallJumpLockTimer <= 0) {
      this.vx = 0;
      if (left) this.vx = -this.speed;
      if (right) this.vx = this.speed;

      // analog stick
      if (!this.keys.left && !this.keys.right && gamepadState.axisX !== undefined) {
        const ax = gamepadState.axisX;
        if (Math.abs(ax) > 0.2) {
          this.vx = ax * this.speed;
        }
      }
    }

    this.x += this.vx * dt;
    this._resolveCollisionsX(platforms);

    // check wall contact for wall slide
    this.wallDir = 0;
    if (!this.grounded && this.vy >= 0) {
      // check left wall
      if (left && this._touchingWallLeft(platforms)) {
        this.wallDir = -1;
      }
      // check right wall
      if (right && this._touchingWallRight(platforms)) {
        this.wallDir = 1;
      }
    }
    this.wallSliding = this.wallDir !== 0;

    // vertical movement
    this.vy += this.gravity * dt;

    // wall slide slows fall
    if (this.wallSliding && this.vy > WALL_SLIDE_SPEED) {
      this.vy = WALL_SLIDE_SPEED;
    }

    if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
    this.y += this.vy * dt;
    this.grounded = false;
    this._resolveCollisionsY(platforms);
  }

  /**
   * check if touching wall on left side
   * @param {Array<Object>} platforms collision platforms
   * @returns {boolean}
   */
  _touchingWallLeft(platforms) {
    const testRect = { x: this.x - 1, y: this.y + 1, width: 1, height: this.height - 2 };
    for (const p of platforms) {
      if (this._rectsOverlap(testRect, p)) return true;
    }
    return false;
  }

  /**
   * check if touching wall on right side
   * @param {Array<Object>} platforms collision platforms
   * @returns {boolean}
   */
  _touchingWallRight(platforms) {
    const testRect = { x: this.x + this.width, y: this.y + 1, width: 1, height: this.height - 2 };
    for (const p of platforms) {
      if (this._rectsOverlap(testRect, p)) return true;
    }
    return false;
  }

  /**
   * check if two rectangles overlap
   * @param {Object} a first rectangle
   * @param {Object} b second rectangle
   * @returns {boolean}
   */
  _rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  /**
   * resolve horizontal collisions with platforms
   * @param {Array<Object>} platforms collision platforms
   * @returns {void}
   */
  _resolveCollisionsX(platforms) {
    for (const p of platforms) {
      if (this._overlaps(p)) {
        if (this.vx > 0) this.x = p.x - this.width;
        else if (this.vx < 0) this.x = p.x + p.width;
      }
    }
  }

  /**
   * resolve vertical collisions with platforms
   * @param {Array<Object>} platforms collision platforms
   * @returns {void}
   */
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

  /**
   * check if player overlaps a rectangle
   * @param {Object} rect the rectangle to check
   * @returns {boolean}
   */
  _overlaps(rect) {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }

  /**
   * respawn player at position
   * @param {number} x respawn x position
   * @param {number} y respawn y position
   * @returns {void}
   */
  respawn(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.dead = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isJumping = false;
    this.wallSliding = false;
    this.wallDir = 0;
    this.wallJumpLockTimer = 0;
  }
}

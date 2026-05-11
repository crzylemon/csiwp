// expanding black squares in a wave pattern

/**
 * tile size in pixels
 * @type {number}
 */
const TILE = 8;

/**
 * total time for squares to fully expand
 * @type {number}
 */
const EXPAND_DURATION = 0.4;

/**
 * delay between each tile's start for wave effect
 * @type {number}
 */
const WAVE_DELAY = 0.03;

/**
 * screen transition with expanding squares wave
 */
export class Transition {
  /**
   * screen transition
   * @constructor
   */
  constructor() {
    this.active = false;
    this.timer = 0;
    this.phase = 'idle'; // closing, closed, opening, or idle.
    this.onMidpoint = null; // callback when fully closed
    this.cols = 0;
    this.rows = 0;
  }

  /**
   * start the transition
   * @param {number} viewWidth view width
   * @param {number} viewHeight view height
   * @param {Function} onMidpoint callback when fully closed
   * @returns {void}
   */
  start(viewWidth, viewHeight, onMidpoint) {
    this.active = true;
    this.timer = 0;
    this.phase = 'closing';
    this.onMidpoint = onMidpoint;
    this.cols = Math.ceil(viewWidth / TILE);
    this.rows = Math.ceil(viewHeight / TILE);
    this.totalWaveTime = (this.cols + this.rows) * WAVE_DELAY;
    this.closeDuration = EXPAND_DURATION + this.totalWaveTime;
    this.openDuration = EXPAND_DURATION + this.totalWaveTime;
  }

  /**
   * update transition state
   * @param {number} dt delta time
   * @returns {void}
   */
  update(dt) {
    if (!this.active) return;
    this.timer += dt;

    if (this.phase === 'closing') {
      if (this.timer >= this.closeDuration) {
        this.phase = 'closed';
        this.timer = 0;
        if (this.onMidpoint) this.onMidpoint();
      }
    } else if (this.phase === 'closed') {
      // tiny pause at full black
      if (this.timer >= 0.15) {
        this.phase = 'opening';
        this.timer = 0;
      }
    } else if (this.phase === 'opening') {
      if (this.timer >= this.openDuration) {
        this.active = false;
        this.phase = 'idle';
      }
    }
  }

  /**
   * draw the transition overlay
   * @param {CanvasRenderingContext2D} ctx canvas context
   * @param {number} viewWidth view width
   * @param {number} viewHeight view height
   * @returns {void}
   */
  draw(ctx, viewWidth, viewHeight) {
    if (!this.active) return;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        // wavy stuff lol
        const dist = (col + row) * WAVE_DELAY;
        let size = 0;

        if (this.phase === 'closing') {
          const localT = (this.timer - dist) / EXPAND_DURATION;
          size = Math.max(0, Math.min(1, localT));
        } else if (this.phase === 'closed') {
          size = 1;
        } else if (this.phase === 'opening') {
          const localT = (this.timer - dist) / EXPAND_DURATION;
          size = 1 - Math.max(0, Math.min(1, localT));
        }

        if (size > 0) {
          const cx = col * TILE + TILE / 2;
          const cy = row * TILE + TILE / 2;
          const half = (TILE / 2) * size;
          ctx.fillStyle = '#000';
          ctx.fillRect(cx - half, cy - half, half * 2, half * 2);
        }
      }
    }
  }
}

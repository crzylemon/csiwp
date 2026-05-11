import { drawSprite } from './sprites.js';
import { drawText, TEXT_TILE } from './text.js';
import { getLastInput, drawControllerIcon } from './controllericons.js';
import { siteCheck } from './siteCheck.js';

/**
 * laughing face sprite indexes
 * @type {Array<number>}
 */
const FACE_LAUGH = [54, 55];

/**
 * laughing face hand sprite index
 * @type {number}
 */
const FACE_LAUGH_HAND = 56;

/**
 * surprised face sprite indexes
 * @type {Array<number>}
 */
const FACE_SURPRISED = [57, 58];

/**
 * surprised face hand sprite index
 * @type {number}
 */
const FACE_SURPRISED_HAND = 59;

/**
 * red x sprite index
 * @type {number}
 */
const RED_X = 60;

/**
 * green check sprite index
 * @type {number}
 */
const GREEN_CHECK = 61;

/**
 * pencil letter g sprite index
 * @type {number}
 */
const PENCIL_G = 63;

/**
 * pencil letter u sprite index
 * @type {number}
 */
const PENCIL_U = 64;

/**
 * pencil letter d sprite index
 * @type {number}
 */
const PENCIL_D = 65;

/**
 * pencil letter b sprite index
 * @type {number}
 */
const PENCIL_B = 66;

/**
 * pencil letter a sprite index
 * @type {number}
 */
const PENCIL_A = 67;

/**
 * pencil letter q sprite index
 * @type {number}
 */
const PENCIL_Q = 68;

/**
 * paper sprite index
 * @type {number}
 */
const PAPER = 69;

/**
 * ripped paper sprite index
 * @type {number}
 */
const PAPER_RIPPED = 70;

/**
 * paper corner sprite index
 * @type {number}
 */
const PAPER_CORNER = 71;

/**
 * the result screen overlay
 */
export class ResultScreen {
  /**
   * the result screen
   * @constructor
   */
  constructor() {
    this.active = false;
    this.timer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.deaths = 0;
    this.time = 0;
    this.isGud = false;
    this.ripX = Math.random() * 6;
  }

  /**
   * show the result screen
   * @param {number} deaths number of deaths
   * @param {number} time time taken in seconds
   * @param {number} parDeaths par death count
   * @param {number} parTime par time in seconds
   * @returns {void}
   */
  show(deaths, time, parDeaths, parTime) {
    this.active = true;
    this.timer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.deaths = deaths;
    this.time = time;
    this.isGud = deaths <= parDeaths && time <= parTime;
  }

  /**
   * update animation timers
   * @param {number} dt delta time
   * @returns {void}
   */
  update(dt) {
    if (!this.active) return;
    this.timer += dt;
    this.animTimer += dt;
    if (this.animTimer >= 0.3) {
      this.animTimer -= 0.3;
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  /**
   * draw the result screen
   * @param {CanvasRenderingContext2D} ctx canvas context
   * @param {number} viewWidth view width
   * @param {number} viewHeight view height
   * @returns {void}
   */
  draw(ctx, viewWidth, viewHeight) {
    if (!this.active) return;

    // overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // layout
    ctx.save();
    const scale = 0.5;
    const contentW = 48; // 6 tiles * 8px
    const ox = Math.round((viewWidth - contentW) / 2);
    const oy = 4;
    ctx.translate(ox, oy);

    // title
    ctx.save();
    ctx.scale(scale, scale);
    drawText(ctx, "RESULTS", 16, 0);
    ctx.restore();

    // bg
    const paperW = 6;
    const paperH = 4;
    const paperX = Math.round((contentW - paperW * 8) / 2);
    const paperY = 6;

    for (let row = 0; row < paperH; row++) {
      for (let col = 0; col < paperW; col++) {
        let sprite;
        if (row === 0 && col === paperW - 1) sprite = PAPER_CORNER; // fancy little fold
        else if (row === paperH - 1 && col === Math.floor(this.ripX)) sprite = PAPER_RIPPED; // randomly chosen x for the rip
        else sprite = PAPER;
        drawSprite(ctx, sprite, paperX + col * 8, paperY + row * 8);
      }
    }

    // GUD?
    const gudY = paperY + 6;
    const checkX = paperX + 4;
    if (this.isGud) {
      drawSprite(ctx, GREEN_CHECK, checkX, gudY);
    } else {
      drawSprite(ctx, RED_X, checkX, gudY);
    }
    drawSprite(ctx, PENCIL_G, checkX + 10, gudY);
    drawSprite(ctx, PENCIL_U, checkX + 18, gudY);
    drawSprite(ctx, PENCIL_D, checkX + 26, gudY);
    drawSprite(ctx, PENCIL_Q, checkX + 34, gudY);

    // BAD?
    const badY = gudY + 10;
    if (!this.isGud && siteCheck()) {
      drawSprite(ctx, GREEN_CHECK, checkX, badY);
    } else {
      drawSprite(ctx, RED_X, checkX, badY);
    }
    drawSprite(ctx, PENCIL_B, checkX + 10, badY);
    drawSprite(ctx, PENCIL_A, checkX + 18, badY);
    drawSprite(ctx, PENCIL_D, checkX + 26, badY);
    drawSprite(ctx, PENCIL_Q, checkX + 34, badY);

    // face
    const faceX = paperX + paperW * 8 + 2;
    const faceY = paperY + paperH * 8;
    if (this.isGud && siteCheck()) {
      drawSprite(ctx, FACE_SURPRISED[this.animFrame], faceX, faceY + (Math.sin(this.timer + 1)));
      drawSprite(ctx, FACE_SURPRISED_HAND, faceX + 8, faceY + 4 + (Math.sin(this.timer)));
    } else {
      drawSprite(ctx, FACE_LAUGH[this.animFrame], faceX, faceY + (Math.sin(this.timer + 1)));
      drawSprite(ctx, FACE_LAUGH_HAND, faceX + 8, faceY + 4 + (Math.sin(this.timer)));
    }

    // stats
    const statsY = paperY + paperH * 8 + 4;
    const minutes = Math.floor(this.time / 60);
    const seconds = Math.floor(this.time % 60);

    let deathStr = String(this.deaths);
    let timeStr = `${minutes}M ${seconds}S`;
    if (!siteCheck()) {
      // Absurd number
      deathStr = Math.floor(Math.random() * 999999).toString();
      timeStr = Math.floor(Math.random() * 99).toString() + "M " + Math.floor(Math.random() * 99).toString() + "S";
    }
    // right align
    const colWidth = 12; // characters total per line
    const deathLine = 'DEATHS - ' + deathStr.padStart(colWidth - 9, ' ');
    const timeLine = 'TIME   - ' + timeStr.padStart(colWidth - 9, ' ');

    ctx.save();
    ctx.scale(scale, scale);
    drawText(ctx, deathLine, 0, statsY / scale);
    drawText(ctx, timeLine, 0, (statsY + 6) / scale);
    ctx.restore();

    ctx.restore();

    // PRESS SPACE / controller button
    if (this.timer > 1.5) {
      ctx.save();
      ctx.scale(scale, scale);
      if (getLastInput() === 'controller') {
        const label = "PRESS";
        const totalW = label.length * TEXT_TILE + TEXT_TILE + 2;
        const startX = Math.round((viewWidth / scale - totalW) / 2);
        drawText(ctx, label, startX, (viewHeight - 8) / scale);
        drawControllerIcon(ctx, 'A', startX + label.length * TEXT_TILE + 2, (viewHeight - 8) / scale);
      } else {
        const prompt = "PRESS SPACE";
        const px = Math.round((viewWidth / scale - prompt.length * TEXT_TILE) / 2);
        drawText(ctx, prompt, px, (viewHeight - 8) / scale);
      }
      ctx.restore();
    }
  }
}

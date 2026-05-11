import { drawText, TEXT_TILE } from './text.js';
import { siteCheck } from './siteCheck.js';
import { getLastInput, drawControllerIcon } from './controllericons.js';

/**
 * badge width in pixels
 * @type {number}
 */
const BADGE_WIDTH = 96;

/**
 * badge height in pixels
 * @type {number}
 */
const BADGE_HEIGHT = 16;

/**
 * badge index (0=demo, 1=beta, 2=alpha, 3=unauthorized)
 * @type {number}
 */
let BADGE_INDEX = 2;

/**
 * delay before badge drops in seconds
 * @type {number}
 */
const DROP_DELAY = 0.5;

/**
 * badge drop animation duration in seconds
 * @type {number}
 */
const DROP_DURATION = 0.3;

/**
 * screen shake duration after badge lands
 * @type {number}
 */
const SHAKE_DURATION = 0.3;

/**
 * screen shake intensity
 * @type {number}
 */
const SHAKE_INTENSITY = 2;

/**
 * logo image element
 * @type {HTMLImageElement|null}
 */
let logoImg = null;

/**
 * badge image element
 * @type {HTMLImageElement|null}
 */
let badgeImg = null;

/**
 * whether logo is loaded
 * @type {boolean}
 */
let logoLoaded = false;

/**
 * whether badge is loaded
 * @type {boolean}
 */
let badgeLoaded = false;

// load needed stuff
const logo = new Image();
logo.onload = () => { logoImg = logo; logoLoaded = true; };
logo.src = 'csiwp.png';

const badge = new Image();
badge.onload = () => { badgeImg = badge; badgeLoaded = true; };
badge.src = 'logobadges.png';

/**
 * ease in with bounce at end
 * @param {number} t progress 0-1
 * @returns {number}
 */
function easeInBounce(t) {
  // accelerate down and then a boing
  if (t < 0.7) return (t / 0.7) * (t / 0.7);
  const bounce = (t - 0.7) / 0.3;
  return 1 - Math.sin(bounce * Math.PI) * 0.15;
}

/**
 * the title screen
 */
export class TitleScreen {
  /**
   * the title screen
   * @constructor
   */
  constructor() {
    this.timer = 0;
    this.blinkTimer = 0;
    this.showPress = true;
    this.shakeTimer = 0;
    this.badgeLanded = false;
    if (!siteCheck()) {
      BADGE_INDEX = 3;
    }
  }

  /**
   * update title screen animations
   * @param {number} dt delta time
   * @returns {void}
   */
  update(dt) {
    this.timer += dt;
    this.blinkTimer += dt;
    if (this.blinkTimer >= 0.5) {
      this.blinkTimer -= 0.5;
      this.showPress = !this.showPress;
    }
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    // trigger when badge lands
    if (!this.badgeLanded && this.timer >= DROP_DELAY + DROP_DURATION) {
      this.badgeLanded = true;
      this.shakeTimer = SHAKE_DURATION;
    }
  }

  /**
   * draw the title screen
   * @param {CanvasRenderingContext2D} ctx canvas context
   * @param {number} viewWidth view width
   * @param {number} viewHeight view height
   * @returns {void}
   */
  draw(ctx, viewWidth, viewHeight) {
    ctx.save();

    // screen shakes
    if (this.shakeTimer > 0) {
      const intensity = (this.shakeTimer / SHAKE_DURATION) * SHAKE_INTENSITY;
      const ox = Math.round((Math.random() - 0.5) * intensity * 2);
      const oy = Math.round((Math.random() - 0.5) * intensity * 2);
      ctx.translate(ox, oy);
    }

    // bg
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-4, -4, viewWidth + 8, viewHeight + 8);

    // logo
    if (logoLoaded) {
      const logoX = Math.round((viewWidth - logoImg.width) / 2);
      const logoY = Math.round(viewHeight / 2 - logoImg.height / 2 - 12);
      ctx.drawImage(logoImg, logoX, logoY);

      // badge drops below logo
      if (badgeLoaded) {
        const badgeX = Math.round((viewWidth - BADGE_WIDTH) / 2);
        const badgeTargetY = logoY + logoImg.height + 4;

        let badgeY;
        let badgeScale = 1;
        const dropTime = this.timer - DROP_DELAY;
        if (dropTime < 0) {
          // hide the badge
          badgeY = -BADGE_HEIGHT - 15;
          badgeScale = 2.5;
        } else if (dropTime < DROP_DURATION) {
          // dropping with ease
          const t = dropTime / DROP_DURATION;
          const e = easeInBounce(t);
          badgeY = -BADGE_HEIGHT - 10 + (badgeTargetY + BADGE_HEIGHT + 10) * e;
          badgeScale = 2.5 - 1.5 * e; // 2.5x -> 1x
        } else {
          // landed
          badgeY = badgeTargetY;
          badgeScale = 1;
        }

        const scaledW = BADGE_WIDTH * badgeScale;
        const scaledH = BADGE_HEIGHT * badgeScale;
        const drawX = badgeX + (BADGE_WIDTH - scaledW) / 2;
        const drawY = badgeY + (BADGE_HEIGHT - scaledH) / 2;

        ctx.drawImage(
          badgeImg,
          0, BADGE_INDEX * BADGE_HEIGHT, BADGE_WIDTH, BADGE_HEIGHT,
          drawX, drawY, scaledW, scaledH
        );
      }
    } else {
      // fallback of just "CSIWP"
      drawText(ctx, "CSIWP", Math.round(viewWidth / 2 - 24), Math.round(viewHeight / 2 - 10));
    }

    // press space / controller button
    if (this.showPress && this.badgeLanded) {
      if (!siteCheck()) {
        const prompt = "LOG OFF NOW";
        const px = Math.round((viewWidth - prompt.length * TEXT_TILE) / 2);
        drawText(ctx, prompt, px, viewHeight - 10);
      } else if (getLastInput() === 'controller') {
        // Show "PRESS [A]" with controller icon
        const label = "PRESS";
        const totalW = label.length * TEXT_TILE + TEXT_TILE + 2; // text + icon + gap
        const startX = Math.round((viewWidth - totalW) / 2);
        drawText(ctx, label, startX, viewHeight - 10);
        drawControllerIcon(ctx, 'A', startX + label.length * TEXT_TILE + 2, viewHeight - 10);
      } else {
        const prompt = "PRESS SPACE";
        const px = Math.round((viewWidth - prompt.length * TEXT_TILE) / 2);
        drawText(ctx, prompt, px, viewHeight - 10);
      }
    }

    ctx.restore();
  }
}

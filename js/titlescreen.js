import { drawText, TEXT_TILE } from './text.js';
import { siteCheck } from './siteCheck.js';

const BADGE_WIDTH = 96;
const BADGE_HEIGHT = 16;
let BADGE_INDEX = 2; // 0=DEMO, 1=BETA, 2=ALPHA, 3=UNAUTHORIZED

// badge drop
const DROP_DELAY = 0.5;   // seconds before badge drops
const DROP_DURATION = 0.3; // how long the drop takes
const SHAKE_DURATION = 0.3; // screen shake after landing
const SHAKE_INTENSITY = 2;

let logoImg = null;
let badgeImg = null;
let logoLoaded = false;
let badgeLoaded = false;

// load needed stuff
const logo = new Image();
logo.onload = () => { logoImg = logo; logoLoaded = true; };
logo.src = 'csiwp.png';

const badge = new Image();
badge.onload = () => { badgeImg = badge; badgeLoaded = true; };
badge.src = 'logobadges.png';

function easeInBounce(t) {
  // accelerate down and then a boing
  if (t < 0.7) return (t / 0.7) * (t / 0.7);
  const bounce = (t - 0.7) / 0.3;
  return 1 - Math.sin(bounce * Math.PI) * 0.15;
}

export class TitleScreen {
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

    // press space
    if (this.showPress && this.badgeLanded) {
      let prompt = "PRESS SPACE";
      if (!siteCheck()) {
        prompt = "LOG OFF NOW" // lowtiergod reference
      }
      const px = Math.round((viewWidth - prompt.length * TEXT_TILE) / 2);
      drawText(ctx, prompt, px, viewHeight - 10);
    }

    ctx.restore();
  }
}

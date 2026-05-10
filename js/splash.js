import { drawLogo, drawText, TEXT_TILE } from './text.js';
import { siteCheck } from './siteCheck.js';

const SPLASH_DURATION = 2.5;
const FADE_IN = 0.5;
const FADE_OUT = 0.5;

export class SplashScreen {
  constructor() {
    this.timer = 0;
    this.done = false;
  }

  update(dt) {
    this.timer += dt;
    if (this.timer >= SPLASH_DURATION + 0.5) {
      this.done = true;
    }
  }

  draw(ctx, viewWidth, viewHeight) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // fade
    let alpha = 1;
    if (this.timer < FADE_IN) {
      alpha = this.timer / FADE_IN;
    } else if (this.timer > SPLASH_DURATION - FADE_OUT) {
      alpha = (SPLASH_DURATION - this.timer) / FADE_OUT;
    }
    alpha = Math.max(0, Math.min(1, alpha));

    ctx.globalAlpha = alpha;

    // OFFICIALLY HOSTED ON or LAZILY NOT HOSTED ON
    if (siteCheck()) {
        const tx2 = Math.round((viewWidth - "OFFICIALLY".length * TEXT_TILE) / 2);
        drawText(ctx, "OFFICIALLY", tx2, 8);
    } else {
        const tx2 = Math.round((viewWidth - "LAZILY NOT".length * TEXT_TILE) / 2);
        drawText(ctx, "LAZILY NOT", tx2, 8);
    }
    const hostedText = "HOSTED ON";
    const tx = Math.round((viewWidth - hostedText.length * TEXT_TILE) / 2);
    drawText(ctx, hostedText, tx, viewHeight / 2 - 16);

    // CRZ.Network logo centered
    const logoWidth = 10 * TEXT_TILE;
    const logoX = Math.round((viewWidth - logoWidth) / 2);
    const logoY = Math.round(viewHeight / 2 - 4);
    drawLogo(ctx, logoX + 2, logoY);

    ctx.globalAlpha = 1;
  }
}

export { SPLASH_DURATION };

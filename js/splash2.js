import { drawText, TEXT_TILE } from './text.js';
import { siteCheck } from './siteCheck.js';

/**
 * splash screen duration in seconds
 * @type {number}
 */
const SPLASH_DURATION = 2.5;

/**
 * fade in duration in seconds
 * @type {number}
 */
const FADE_IN = 0.5;

/**
 * fade out duration in seconds
 * @type {number}
 */
const FADE_OUT = 0.5;

/**
 * wrap text into lines of max character width
 * @param {string} str text to wrap
 * @param {number} maxChars max characters per line
 * @returns {Array<string>}
 */
function wrapText(str, maxChars) {
  const words = str.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

/**
 * random splash messages
 * @type {Array<string>}
 */
const MESSAGES = [
  "ALSO TRY MINECRAFT!",
  "FRIDAY NIGHT FUN- WAIT...",
  "YOU WILL DIE!",
  "GOOD LUCK!",
  "100 PERCENT IMPOSSIBLE",
  "BYE BYE SANITY",
  "U JUST GOT SKILL ISSUE",
  "YOU CAN SIMPLY JUST WALK AROUND IT", // If a wall is one stud thick, you can simply just walk around it.
  "TOUCH GRASS",
  "TRUST THE PROCESS",
  "ITS POSSIBLE I SWEAR",
  "IM",
  "I DUNNO BRO",
  "CONTROLLER RECOMMENDED",
  "YOU CANT. LOL.",
  "RAGE QUIT IN 3..2..1",
  "PIXELATED SUFFERING",
  "BEE MOVIE HERE",
];

/**
 * ease in out function
 * @param {number} t progress 0-1
 * @returns {number}
 */
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * load the bee movie script
 * @returns {Promise<string|null>}
 */
async function beeMovie() {
  try {
    const response = await fetch('bee.txt');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error("Failed to load Bee Movie:", error);
    return null;
  }
}

/**
 * the second splash screen (random message or bee movie)
 */
export class SplashScreen2 {
  /**
   * the second splash screen
   * @constructor
   */
  constructor() {
    this.timer = 0;
    this.done = false;

    const forceBee = window.location.search.includes('bee');
    if (forceBee) {
      this.message = "BEE MOVIE HERE";
    } else {
      this.message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    }
    if (!siteCheck()) { //bad site
      this.message = "ERROR AT LINE 69420";
    }

    this.isBeeMovie = this.message === "BEE MOVIE HERE";
    this.beeText = null;
    this.beeLines = [];
    this.scrollY = 0;

    if (this.isBeeMovie) {
      beeMovie().then(text => {
        if (text) {
          this.beeText = text;
          this.beeLines = text.split('\n');
        } else {
          // fallback if bee movie fails to load
          this.isBeeMovie = false;
          this.message = "THIS IS MEANT TO BEE THE BEE MOVIE";
        }
      });
    }
  }

  /**
   * update splash timer and scroll
   * @param {number} dt delta time
   * @returns {void}
   */
  update(dt) {
    this.timer += dt;
    if (this.isBeeMovie) {
      // scroll through the script
      if (this.timer >= 1) {
        this.scrollY = easeInOut((this.timer - 1) / 14) * (this.beeLines.length * (TEXT_TILE + 2) - 20); // Easing scroll
      }
      // let it run longer
      if (this.timer >= 15) {
        this.done = true;
      }
    } else {
      if (this.timer >= SPLASH_DURATION + 0.5) {
        this.done = true;
      }
    }
  }

  /**
   * draw the splash screen
   * @param {CanvasRenderingContext2D} ctx canvas context
   * @param {number} viewWidth view width
   * @param {number} viewHeight view height
   * @returns {void}
   */
  draw(ctx, viewWidth, viewHeight) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // fade
    let alpha = 1;
    if (this.timer < FADE_IN) {
      alpha = this.timer / FADE_IN;
    } else if (this.timer > (this.isBeeMovie ? 14 : SPLASH_DURATION) - FADE_OUT) {
      alpha = ((this.isBeeMovie ? 15 : SPLASH_DURATION) - this.timer) / FADE_OUT;
    }
    alpha = Math.max(0, Math.min(1, alpha));
    ctx.globalAlpha = alpha;

    if (this.isBeeMovie && this.beeLines.length > 0) {
      // beeeeeeeeeeeeee
      const maxChars = Math.floor(viewWidth / TEXT_TILE);
      const lineHeight = TEXT_TILE + 2;
      const startLine = Math.floor(this.scrollY / lineHeight);
      const visibleLines = Math.ceil(viewHeight / lineHeight) + 1;
      const offsetY = -(this.scrollY % lineHeight);

      for (let i = 0; i < visibleLines; i++) {
        const lineIdx = startLine + i;
        if (lineIdx >= this.beeLines.length) break;
        const line = this.beeLines[lineIdx].toUpperCase().slice(0, maxChars);
        const tx = 2;
        const ty = offsetY + i * lineHeight;
        if (ty > -TEXT_TILE && ty < viewHeight) {
          drawText(ctx, line, tx, ty);
        }
      }
    } else {
      // show message
      const maxChars = Math.floor(viewWidth / TEXT_TILE);
      const lines = wrapText(this.message, maxChars);
      const totalHeight = lines.length * (TEXT_TILE + 2) - 2;
      const startY = Math.round(viewHeight / 2 - totalHeight / 2);

      for (let i = 0; i < lines.length; i++) {
        const tx = Math.round((viewWidth - lines[i].length * TEXT_TILE) / 2);
        const ty = startY + i * (TEXT_TILE + 2);
        drawText(ctx, lines[i], tx, ty);
      }
    }

    ctx.globalAlpha = 1;
  }
}

// parallax bg
// bg.png is 256x72 per frame, 5 frames stacked vertically (256x360 total)

import { siteCheck } from "./siteCheck.js";
import { renderScale } from "./sprites.js";

/**
 * frame width in pixels
 * @type {number}
 */
const FRAME_W = 256;

/**
 * frame height in pixels
 * @type {number}
 */
const FRAME_H = 72;

// layer config: frame index (0-based), scroll speed multiplier, vertical behavior
// verticalMode: 'fixed'  = never scroll vertically
//               'color'  = fill with solid color when scrolling vertically
//               'repeat' = tile vertically
//               'extend' = repeat bottom row when scrolling down, nothing when up

/**
 * parallax layer configuration
 * @type {Array<{frame: number, speed: number, verticalMode: string, color?: string}>}
 */
let LAYERS = [
  { frame: 0, speed: 0.001, verticalMode: 'fixed' },
  { frame: 1, speed: 0.005, verticalMode: 'fixed' },
  { frame: 2, speed: 0.015,  verticalMode: 'color', color: '#252525' },
  { frame: 3, speed: 0.02,  verticalMode: 'repeat' },
  { frame: 4, speed: 0.05,  verticalMode: 'extend' },
];

if (!siteCheck()) {
  // 2 boring layers
  LAYERS = [
    { frame: 0, speed: 0.001, verticalMode: 'fixed' },
    { frame: 2, speed: 0.015,  verticalMode: 'color', color: '#252525' }
  ];
}

/**
 * background image element
 * @type {HTMLImageElement|null}
 */
let bgImage = null;

/**
 * whether background image is loaded
 * @type {boolean}
 */
let bgLoaded = false;

/**
 * load the background image
 * @returns {Promise<void>}
 */
export function loadBackground() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      bgImage = img;
      bgLoaded = true;
      resolve();
    };
    img.onerror = () => resolve(); // don't block if missing
    img.src = 'bg.png';
  });
}

/**
 * base camera y to align layers to
 * @type {number}
 */
let baseCameraY = 0;

/**
 * set base camera y position
 * @param {number} y the base y value
 * @returns {void}
 */
export function setBaseY(y) {
  baseCameraY = y;
}

/**
 * draw parallax background layers
 * @param {CanvasRenderingContext2D} ctx canvas context
 * @param {number} viewWidth view width
 * @param {number} viewHeight view height
 * @param {number} cameraX camera x position
 * @param {number} cameraY camera y position
 * @returns {void}
 */
export function drawBackground(ctx, viewWidth, viewHeight, cameraX, cameraY) {
  if (!bgLoaded) return;

  for (const layer of LAYERS) {
    const srcY = layer.frame * FRAME_H;
    const scrollX = cameraX * layer.speed;
    // align to screen at initial spawn camera Y, scroll from there
    const scrollY = (cameraY - baseCameraY) * layer.speed;
    const drawY = -scrollY;

    // horizontal: always tile
    const offsetX = -(scrollX % FRAME_W);
    const startX = offsetX < 0 ? offsetX : offsetX - FRAME_W;

    if (layer.verticalMode === 'fixed') {
      // explains itself, really.
      for (let x = startX; x < viewWidth; x += FRAME_W) {
        ctx.drawImage(bgImage, 0, srcY, FRAME_W, FRAME_H, x, 0, FRAME_W, FRAME_H);
      }
    } else if (layer.verticalMode === 'color') {
      // scroll vertically with parallax, fill exposed space with color
      const dy = Math.round(drawY * renderScale) / renderScale;
      if (dy > 0) {
        ctx.fillStyle = layer.color;
        ctx.fillRect(0, 0, viewWidth, dy + 1);
      }
      if (dy + FRAME_H < viewHeight) {
        ctx.fillStyle = layer.color;
        ctx.fillRect(0, dy + FRAME_H - 1, viewWidth, viewHeight - (dy + FRAME_H) + 1);
      }
      for (let x = startX; x < viewWidth; x += FRAME_W) {
        ctx.drawImage(bgImage, 0, srcY, FRAME_W, FRAME_H, x, dy, FRAME_W, FRAME_H);
      }
    } else if (layer.verticalMode === 'repeat') {
      // tile infinitely
      const offsetY = -(scrollY % FRAME_H);
      const startY = offsetY < 0 ? offsetY : offsetY - FRAME_H;
      for (let y = startY; y < viewHeight; y += FRAME_H) {
        for (let x = startX; x < viewWidth; x += FRAME_W) {
          ctx.drawImage(bgImage, 0, srcY, FRAME_W, FRAME_H, x, y, FRAME_W, FRAME_H);
        }
      }
    } else if (layer.verticalMode === 'extend') {
      // extend bottom of image
      for (let x = startX; x < viewWidth; x += FRAME_W) {
        ctx.drawImage(bgImage, 0, srcY, FRAME_W, FRAME_H, x, drawY, FRAME_W, FRAME_H);
      }
      const bottomY = drawY + FRAME_H;
      if (bottomY < viewHeight) {
        for (let x = startX; x < viewWidth; x += FRAME_W) {
          ctx.drawImage(
            bgImage, 0, srcY + FRAME_H - 1, FRAME_W, 1,
            x, bottomY, FRAME_W, viewHeight - bottomY
          );
        }
      }
    }
  }
}

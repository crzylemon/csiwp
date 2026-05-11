import { spriteSheet, SPRITES } from './sprites.js';

/**
 * tile size in pixels
 * @type {number}
 */
const TILE = 8;

/**
 * number of respawn animation frames
 * @type {number}
 */
const FRAME_COUNT = SPRITES.RESPAWN.length; // 7 frames

/**
 * pre-rendered respawn frames with alpha
 * @type {Array<HTMLCanvasElement>}
 */
let respawnFrames = [];

/**
 * pre-process respawn sprite frames with alpha from blue channel
 * @returns {void}
 */
export function initRespawnFrames() {
  respawnFrames = [];

  // full spritesheet to a temporary canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = spriteSheet.image.width;
  tempCanvas.height = spriteSheet.image.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(spriteSheet.image, 0, 0);

  for (const idx of SPRITES.RESPAWN) {
    const i = idx - 1;
    const col = i % spriteSheet.cols;
    const row = Math.floor(i / spriteSheet.cols);
    const sx = col * TILE;
    const sy = row * TILE;

    // read pixel data
    const imageData = tempCtx.getImageData(sx, sy, TILE, TILE);
    const data = imageData.data;

    // new canvas
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = TILE;
    frameCanvas.height = TILE;
    const frameCtx = frameCanvas.getContext('2d');
    const frameData = frameCtx.createImageData(TILE, TILE);

    for (let p = 0; p < data.length; p += 4) {
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];

      // Blue channel = transparency. 0x26 = 0%, 0xFF = 75%
      // we need to do funny mathy thing
      const normalizedB = Math.max(0, (b - 0x26) / (0xFF - 0x26));
      const alpha = Math.round(normalizedB * 0.75 * 255);

      // color + computed alpha
      frameData.data[p] = r;
      frameData.data[p + 1] = g;
      frameData.data[p + 2] = b;
      frameData.data[p + 3] = alpha;
    }

    frameCtx.putImageData(frameData, 0, 0);
    respawnFrames.push(frameCanvas);
  }
}

/**
 * draw a respawn animation frame
 * @param {CanvasRenderingContext2D} ctx canvas context
 * @param {number} frameIndex index of the frame to draw
 * @param {number} x x position
 * @param {number} y y position
 * @returns {void}
 */
export function drawRespawnFrame(ctx, frameIndex, x, y) {
  if (frameIndex < 0 || frameIndex >= respawnFrames.length) return;
  ctx.drawImage(respawnFrames[frameIndex], x, y, TILE, TILE);
}

export { FRAME_COUNT };

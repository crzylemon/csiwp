/**
 * tile size for text characters
 * @type {number}
 */
const TILE = 8;

/**
 * supported character set
 * @type {string}
 */
const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-x!.';

/**
 * number of characters in charset
 * @type {number}
 */
const CHAR_COUNT = CHARSET.length; // 40

/**
 * text sprite sheet data
 * @type {{image: HTMLImageElement|null, loaded: boolean, cols: number}}
 */
export const textSheet = {
  image: null,
  loaded: false,
  cols: 0,
};

/**
 * load the text sprite sheet
 * @returns {Promise<void>}
 */
export function loadTextSheet() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      textSheet.image = img;
      textSheet.cols = Math.floor(img.width / TILE);
      textSheet.loaded = true;
      resolve();
    };
    img.src = 'as-text.png';
  });
}

/**
 * draw a string using the bitmap font
 * @param {CanvasRenderingContext2D} ctx canvas context
 * @param {string} str text to draw
 * @param {number} x x position
 * @param {number} y y position
 * @returns {void}
 */
export function drawText(ctx, str, x, y) {
  const upper = str.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    let ch = upper[i];
    if (ch === ' ') {
      // skip space and advance
      continue;
    }
    const idx = CHARSET.indexOf(ch);
    if (idx === -1) ch = 'x'; // unknown char... show an x

    const col = idx % textSheet.cols;
    const row = Math.floor(idx / textSheet.cols);
    ctx.drawImage(
      textSheet.image,
      col * TILE, row * TILE, TILE, TILE,
      x + i * TILE, y, TILE, TILE
    );
  }
}

/**
 * draw the crz.network logo
 * @param {CanvasRenderingContext2D} ctx canvas context
 * @param {number} x x position
 * @param {number} y y position
 * @returns {void}
 */
export function drawLogo(ctx, x, y) {
  const logoStartIdx = CHAR_COUNT; // tiles after the charset
  const logoTiles = 30;
  const logoCols = logoTiles / 3; // 10 columns wide

  for (let col = 0; col < logoCols; col++) {
    for (let row = 0; row < 3; row++) {
      const tileIdx = logoStartIdx + col * 3 + row;
      const srcCol = tileIdx % textSheet.cols;
      const srcRow = Math.floor(tileIdx / textSheet.cols);
      ctx.drawImage(
        textSheet.image,
        srcCol * TILE, srcRow * TILE, TILE, TILE,
        x + col * TILE, y + row * TILE, TILE, TILE
      );
    }
  }
}

export { TILE as TEXT_TILE };

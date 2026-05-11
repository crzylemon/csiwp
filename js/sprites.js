/**
 * tile size in pixels
 * @type {number}
 */
const TILE_SIZE = 8;

/**
 * sprite sheet data
 * @type {{image: HTMLImageElement|null, loaded: boolean, cols: number, rows: number}}
 */
export const spriteSheet = {
  image: null,
  loaded: false,
  cols: 0,
  rows: 0,
};

/**
 * load the sprite sheet image
 * @returns {Promise<void>}
 */
export function loadSprites() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      spriteSheet.image = img;
      spriteSheet.cols = Math.floor(img.width / TILE_SIZE);
      spriteSheet.rows = Math.floor(img.height / TILE_SIZE);
      spriteSheet.loaded = true;
      resolve();
    };
    img.src = 'gamesprites.png';
  });
}

/**
 * get source position for a sprite index
 * @param {number} index sprite index
 * @returns {{sx: number, sy: number}}
 */
function srcPos(index) {
  const i = index - 1;
  const col = i % spriteSheet.cols;
  const row = Math.floor(i / spriteSheet.cols);
  return { sx: col * TILE_SIZE, sy: row * TILE_SIZE };
}

/**
 * render scale for sub-pixel snapping
 * @type {number}
 */
export let renderScale = 1;

/**
 * set the render scale
 * @param {number} s scale value
 * @returns {void}
 */
export function setRenderScale(s) { renderScale = s; }

/**
 * draw a sprite at screen position snapped to render pixel grid
 * @param {CanvasRenderingContext2D} ctx canvas context
 * @param {number} index sprite index
 * @param {number} x x position
 * @param {number} y y position
 * @param {number} scale draw scale
 * @returns {void}
 */
export function drawSprite(ctx, index, x, y, scale = 1) {
  const { sx, sy } = srcPos(index);
  const size = TILE_SIZE * scale;
  const rx = Math.round(x * renderScale) / renderScale;
  const ry = Math.round(y * renderScale) / renderScale;
  ctx.drawImage(
    spriteSheet.image,
    sx, sy, TILE_SIZE, TILE_SIZE,
    rx, ry, size, size
  );
}

/**
 * sprite index constants
 * @type {Object}
 */
export const SPRITES = {
  PLAYER: 1,
  BLOCKS: [2, 3, 4, 5],
  CONVEYOR_BASE_LEFT: 6,
  CONVEYOR_BASE_MID: 7,
  CONVEYOR_BASE_RIGHT: 8,
  CONVEYOR_TOP: [9, 10, 11, 12],                     // animate 9-12 for left, 12-9 for right
  SPIKES: 13,                                        // [cbr]
  RESPAWN: [14, 15, 16, 17, 18, 19, 20],             // blue channel = opacity
  SPRING: [21, 22, 23, 24, 25],                      // bounce animation [cbr]
  CONNECTOR_LR: 26,                                  // left-right moving platform path
  CONNECTOR_UD: 27,                                  // up-down
  CONNECTOR_UL: 28,                                  // up-left corner
  CONNECTOR_UR: 29,                                  // up-right corner
  CONNECTOR_DL: 30,                                  // down-left corner
  CONNECTOR_DR: 31,                                  // down-right corner
  MOVING_PLATFORM: 32,                               // indicator on moving platform [cbr]
  AIR_VENT: 33,                                      // blows player [cbr]
  FLAG: [34, 35, 36, 37],                            // waving checkpoint animation
  DOOR_PULLEY: [38, 39, 40, 41, 42, 43, 44, 45, 46], // [cbr]
  DOOR_TOP_ON: 47,                                   // [cbr]
  DOOR_TOP_OFF: 48,                                  // [cbr]
  DOOR_MID: 49,                                      // [cbr]
  DOOR_BOTTOM: 50,                                   // [cbr]
  DUST: [51, 52, 53],                                // particle animation (varying sizes)
  // 54-71 = result screen assets (later)
};

export { TILE_SIZE };

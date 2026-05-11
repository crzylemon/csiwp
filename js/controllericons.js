// controller button icons
// controller.png is an 8x8 tile sheet with button icons

/**
 * size of a tile
 * @constant {number}
 */
const TILE = 8;

/**
 * icon sheet image
 * @type {HTMLImageElement|null}
 */
let iconImage = null;
/**
 * has icons loaded?
 * @type {Boolean}
 */
let iconLoaded = false;
let iconCols = 0;

/** 
 * load controller icon sheet
 * @returns {Promise<void>}
 */
export function loadControllerIcons() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      iconImage = img;
      iconCols = Math.floor(img.width / TILE);
      iconLoaded = true;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = 'controller.png';
  });
}

/**
 * controller type enum
 * @enum {string}
 */
export const CONTROLLER_TYPE = {
  GENERIC: 'generic',
  XBOX: 'xbox',
  PLAYSTATION: 'playstation',
  SWITCH: 'switch',
};

/**
 * currently detected controller type
 * @type {string}
 */
let detectedType = CONTROLLER_TYPE.GENERIC;

/** 
 * detect current controler type
 * @returns {string} controller type
 */
export function detectControllerType() {
  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    const gp = gamepads[i];
    if (!gp || !gp.connected) continue;
    const id = gp.id.toLowerCase();
    if (id.includes('xbox') || id.includes('xinput') || id.includes('045e')) {
      detectedType = CONTROLLER_TYPE.XBOX;
    } else if (id.includes('playstation') || id.includes('dualshock') || id.includes('dualsense') || id.includes('054c')) {
      detectedType = CONTROLLER_TYPE.PLAYSTATION;
    } else if (id.includes('nintendo') || id.includes('pro controller') || id.includes('057e')) {
      detectedType = CONTROLLER_TYPE.SWITCH;
    } else {
      detectedType = CONTROLLER_TYPE.GENERIC;
    }
    return detectedType;
  }
  return detectedType;
}

/** 
 * get the current controller type
 * @returns {string} controller type
 */
export function getControllerType() {
  return detectedType;
}

/**
 * map for controllers
 * @type {Object.<string, Object.<string, number>>}
 */
const ICON_MAP = {
  generic: { A: 7, B: 8, X: 9, Y: 10, L: 16, ZL: 17, R: 18, ZR: 19, LSTICK: 14, RSTICK: 15, DLEFT: 25, DRIGHT: 26, DUP: 27, DDOWN: 28, STICK_LEFT: 20, STICK_RIGHT: 21, STICK_UP: 22, STICK_DOWN: 23, STICK_CLICK: 24 },
  xbox: { A: 1, B: 2, X: 3, Y: 4, L: 16, ZL: 17, R: 18, ZR: 19, LSTICK: 14, RSTICK: 15, DLEFT: 25, DRIGHT: 26, DUP: 27, DDOWN: 28, STICK_LEFT: 20, STICK_RIGHT: 21, STICK_UP: 22, STICK_DOWN: 23, STICK_CLICK: 24 },
  playstation: { A: 9, B: 11, X: 12, Y: 13, L: 16, ZL: 17, R: 18, ZR: 19, LSTICK: 14, RSTICK: 15, DLEFT: 25, DRIGHT: 26, DUP: 27, DDOWN: 28, STICK_LEFT: 20, STICK_RIGHT: 21, STICK_UP: 22, STICK_DOWN: 23, STICK_CLICK: 24 },
  switch: { A: 7, B: 8, X: 9, Y: 10, START: 5, SELECT: 6, L: 16, ZL: 17, R: 18, ZR: 19, LSTICK: 14, RSTICK: 15, DLEFT: 25, DRIGHT: 26, DUP: 27, DDOWN: 28, STICK_LEFT: 20, STICK_RIGHT: 21, STICK_UP: 22, STICK_DOWN: 23, STICK_CLICK: 24 },
};

/** 
 * get the icon for a button
 * @param {string} button button name
 * @returns {number} icon index
 */
export function getButtonIcon(button) {
  const map = ICON_MAP[detectedType] || ICON_MAP.generic;
  return map[button] || 7; // fallback to generic A
}

/**
 * draw a controller icon
 * @param {CanvasRenderingContext2D} ctx canvas context
 * @param {string} button button name
 * @param {number} x x position
 * @param {number} y y position
 */
export function drawControllerIcon(ctx, button, x, y) {
  if (!iconLoaded) return;
  const idx = getButtonIcon(button) - 1; // 0-based
  const col = idx % iconCols;
  const row = Math.floor(idx / iconCols);
  ctx.drawImage(
    iconImage,
    col * TILE, row * TILE, TILE, TILE,
    x, y, TILE, TILE
  );
}

// Track last input type: 'keyboard' or 'controller'
let lastInputType = 'keyboard';

/** 
 * set the last input type
 * @param {string} type input type
*/
export function setLastInput(type) {
  lastInputType = type;
}

/**
 * get the last input type
 * @returns {string} input type
 */
export function getLastInput() {
  return lastInputType;
}

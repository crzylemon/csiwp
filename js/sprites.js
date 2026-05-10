const TILE_SIZE = 8;

export const spriteSheet = {
  image: null,
  loaded: false,
  cols: 0,
  rows: 0,
};

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

// get sprite pos
function srcPos(index) {
  const i = index - 1;
  const col = i % spriteSheet.cols;
  const row = Math.floor(i / spriteSheet.cols);
  return { sx: col * TILE_SIZE, sy: row * TILE_SIZE };
}

// draw a sprite at screen pos
export function drawSprite(ctx, index, x, y, scale = 1) {
  const { sx, sy } = srcPos(index);
  const size = TILE_SIZE * scale;
  ctx.drawImage(
    spriteSheet.image,
    sx, sy, TILE_SIZE, TILE_SIZE,
    x, y, size, size
  );
}

// sprite indexes
export const SPRITES = {
  PLAYER: 1,
  BLOCKS: [2, 3, 4, 5],
  CONVEYOR_BASE_LEFT: 6,
  CONVEYOR_BASE_MID: 7,
  CONVEYOR_BASE_RIGHT: 8,
  CONVEYOR_TOP: [9, 10, 11, 12], // animate 9-12 for left, 12-9 for right
  SPIKES: 13,
  RESPAWN: [14, 15, 16, 17, 18, 19, 20], // blue channel = opacity
};

export { TILE_SIZE };

export class Camera {
  constructor(viewWidth, viewHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.smoothing = 8;
  }

  follow(target, dt) {
    const tx = target.x + target.width / 2 - this.viewWidth / 2;
    const ty = target.y + target.height / 2 - this.viewHeight / 2;
    
    const t = 1 - Math.exp(-this.smoothing * dt);
    this.x += (tx - this.x) * t;
    this.y += (ty - this.y) * t;
  }

  clamp(levelWidth, levelHeight) {
    if (this.x < 0) this.x = 0;
    if (this.y < 0) this.y = 0;
    if (this.x + this.viewWidth > levelWidth) this.x = levelWidth - this.viewWidth;
    if (this.y + this.viewHeight > levelHeight) this.y = levelHeight - this.viewHeight;
  }
}

import Phaser from 'phaser';
import { Wind } from '../objects/Wind';
import { Boat } from '../objects/Boat';
import { PHYSICS_CONFIG } from '../config';

/**
 * Lightweight flow map that runs on a small canvas texture.
 * Encodes flow (RG) and magnitude (B) for the water shader to sample.
 */
export class WaterFlowMap {
  private scene: Phaser.Scene;
  private width: number;
  private height: number;
  private flow: Float32Array;
  private next: Float32Array;
  private imageData: ImageData;
  private texture: Phaser.Textures.CanvasTexture;
  private baseTextureSize: number;
  private maxMagnitude: number = 0;
  private key: string;

  constructor(scene: Phaser.Scene, width: number = 128, height: number = 128, key?: string) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.key = key ?? `${scene.scene.key}_flow-map`;
    this.flow = new Float32Array(width * height * 2);
    this.next = new Float32Array(width * height * 2);

    const canvasTex = scene.textures.createCanvas(this.key, width, height);
    if (!canvasTex) {
      throw new Error('Failed to create flow map canvas texture');
    }
    this.texture = canvasTex;
    const ctx = this.texture.getContext();
    this.imageData = ctx.createImageData(width, height);
    ctx.putImageData(this.imageData, 0, 0);
    this.texture.refresh();

    const waterTex = scene.textures.get('water');
    const sourceImg = waterTex?.getSourceImage() as { width?: number } | undefined;
    this.baseTextureSize = sourceImg?.width ?? 512;
  }

  update(delta: number, wind: Wind, boat?: Boat) {
    const dtScale = Phaser.Math.Clamp(delta / 16.666, 0.5, 2);
    const decay = 0.94;
    const smooth = 0.2;

    const windRad = Phaser.Math.DegToRad(wind.angle - 90);
    const windDirX = Math.cos(windRad);
    const windDirY = Math.sin(windRad);
    const windStrength = Phaser.Math.Clamp(wind.speed / PHYSICS_CONFIG.WIND_SPEED_MAX, 0, 1);
    const windPush = windStrength * dtScale * 0.006;

    const w = this.width;
    const h = this.height;
    const flow = this.flow;
    const next = this.next;

    for (let y = 0; y < h; y++) {
      const yOffset = y * w * 2;
      const upOffset = ((y - 1 + h) % h) * w * 2;
      const downOffset = ((y + 1) % h) * w * 2;

      for (let x = 0; x < w; x++) {
        const idx = yOffset + x * 2;
        const leftIdx = yOffset + ((x - 1 + w) % w) * 2;
        const rightIdx = yOffset + ((x + 1) % w) * 2;
        const upIdx = upOffset + x * 2;
        const downIdx = downOffset + x * 2;

        const fx = flow[idx];
        const fy = flow[idx + 1];

        const avgX = (fx + flow[leftIdx] + flow[rightIdx] + flow[upIdx] + flow[downIdx]) * 0.2;
        const avgY = (fy + flow[leftIdx + 1] + flow[rightIdx + 1] + flow[upIdx + 1] + flow[downIdx + 1]) * 0.2;

        let nx = Phaser.Math.Linear(fx, avgX, smooth);
        let ny = Phaser.Math.Linear(fy, avgY, smooth);

        nx = nx * decay + windDirX * windPush;
        ny = ny * decay + windDirY * windPush;

        next[idx] = Phaser.Math.Clamp(nx, -1.25, 1.25);
        next[idx + 1] = Phaser.Math.Clamp(ny, -1.25, 1.25);
      }
    }

    // Swap buffers
    const temp = this.flow;
    this.flow = this.next;
    this.next = temp;

    if (boat && boat.speed > 0.01) {
      this.addWake(boat, dtScale);
    }

    this.encodeToTexture();
  }

  getTexture(): Phaser.Textures.CanvasTexture {
    return this.texture;
  }

  getIntensity(): number {
    return Phaser.Math.Clamp(this.maxMagnitude, 0, 1);
  }

  destroy() {
    this.texture.destroy();
    this.scene.textures.remove(this.key);
  }

  private addWake(boat: Boat, dtScale: number) {
    const speedFactor = Phaser.Math.Clamp(boat.speed / PHYSICS_CONFIG.MAX_BOAT_SPEED, 0, 1.1);
    if (speedFactor <= 0.02) return;

    const headingRad = Phaser.Math.DegToRad(boat.heading - 90);
    const dirX = Math.cos(headingRad);
    const dirY = Math.sin(headingRad);
    const crossX = -dirY;
    const crossY = dirX;

    // Map world position to repeating water tile space
    const u = ((boat.x / this.baseTextureSize) % 1 + 1) % 1;
    const v = ((boat.y / this.baseTextureSize) % 1 + 1) % 1;
    const cx = Math.floor(u * this.width);
    const cy = Math.floor(v * this.height);

    const radius = Math.max(4, Math.floor(6 + speedFactor * 8));
    const strength = speedFactor * dtScale * 0.45;

    for (let yy = -radius; yy <= radius; yy++) {
      const py = (cy + yy + this.height) % this.height;
      const baseY = py * this.width * 2;

      for (let xx = -radius; xx <= radius; xx++) {
        const px = (cx + xx + this.width) % this.width;
        const idx = baseY + px * 2;

        const distSq = xx * xx + yy * yy;
        const norm = Math.min(1, distSq / (radius * radius));
        const falloff = Math.exp(-norm * 3.5);

        const lateral = (xx * crossX + yy * crossY) * 0.12;
        const pushX = dirX * strength * falloff;
        const pushY = dirY * strength * falloff;

        this.flow[idx] += pushX + lateral;
        this.flow[idx + 1] += pushY + lateral * 0.5;
      }
    }
  }

  private encodeToTexture() {
    const data = this.imageData.data;
    const len = this.width * this.height;
    let maxMag = 0;

    for (let i = 0; i < len; i++) {
      const fi = i * 2;
      const di = i * 4;
      const fx = this.flow[fi];
      const fy = this.flow[fi + 1];
      const mag = Math.min(1, Math.hypot(fx, fy));

      maxMag = Math.max(maxMag, mag);

      data[di] = Math.round((fx * 0.5 + 0.5) * 255);
      data[di + 1] = Math.round((fy * 0.5 + 0.5) * 255);
      data[di + 2] = Math.round(mag * 255);
      data[di + 3] = 255;
    }

    this.maxMagnitude = maxMag;
    const ctx = this.texture.getContext();
    ctx.putImageData(this.imageData, 0, 0);
    this.texture.refresh();
  }
}

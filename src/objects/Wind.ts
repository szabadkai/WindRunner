import Phaser from 'phaser';
import { PHYSICS_CONFIG } from '../config';

export class Wind {
  public angle: number; // Degrees, 0 = North
  public speed: number; // Knots
  private targetAngle: number;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter;
  
  // @ts-ignore - scene is used for particles later
  private scene: Phaser.Scene;
  private lastShiftTime: number;
  private nextShiftDelay: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.angle = 0; 
    this.targetAngle = 0;
    this.speed = 10;
    this.lastShiftTime = 0;
    this.nextShiftDelay = Phaser.Math.Between(
      PHYSICS_CONFIG.WIND_SHIFT_INTERVAL_MIN,
      PHYSICS_CONFIG.WIND_SHIFT_INTERVAL_MAX
    );

    // Create a texture for the wind particle (simple white dot)
    if (!scene.textures.exists('wind_particle')) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 0.4);
        graphics.fillCircle(2, 2, 2);
        graphics.generateTexture('wind_particle', 4, 4);
    }

    // Init Particle Emitter
    this.particles = scene.add.particles(0, 0, 'wind_particle', {
        x: { min: -100, max: scene.cameras.main.width + 100 },
        y: { min: -100, max: scene.cameras.main.height + 100 },
        quantity: 1,
        frequency: 50,
        lifespan: 4000,
        scale: { start: 1, end: 0 },
        alpha: { start: 0.3, end: 0 },
        blendMode: 'ADD',
    });
    this.particles.setScrollFactor(0); // Attach to camera view
  }

  update(time: number, _delta: number) {
    // Interpolate angle
    if (this.angle !== this.targetAngle) {
       const diff = this.targetAngle - this.angle;
       if (Math.abs(diff) < 0.1) {
         this.angle = this.targetAngle;
       } else {
         this.angle += diff * 0.01; 
       }
    }

    // Update particles
    const speedScale = this.speed * 20; // Scale factor for visuals
    const rad = Phaser.Math.DegToRad(this.angle - 90);
    this.particles.speedX = Math.cos(rad) * speedScale;
    this.particles.speedY = Math.sin(rad) * speedScale;

    if (time > this.lastShiftTime + this.nextShiftDelay) {
      this.scheduleShift(time);
    }
  }

  private scheduleShift(time: number) {
    this.lastShiftTime = time;
    this.nextShiftDelay = Phaser.Math.Between(
      PHYSICS_CONFIG.WIND_SHIFT_INTERVAL_MIN,
      PHYSICS_CONFIG.WIND_SHIFT_INTERVAL_MAX
    );
    
    const shift = Phaser.Math.Between(
      PHYSICS_CONFIG.WIND_SHIFT_AMOUNT_MIN,
      PHYSICS_CONFIG.WIND_SHIFT_AMOUNT_MAX
    );
    
    const dir = Math.random() < 0.5 ? 1 : -1;
    this.targetAngle = this.angle + (shift * dir);
  }
}

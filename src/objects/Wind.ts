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

    // Create a texture for the wind particle (fog puff)
    if (!scene.textures.exists('wind_particle')) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 0.2);
        graphics.fillCircle(10, 10, 10);
        graphics.fillStyle(0xffffff, 0.1);
        graphics.fillCircle(15, 15, 8);
        graphics.fillCircle(5, 15, 6);
        graphics.generateTexture('wind_particle', 30, 30);
    }

    // Init Particle Emitter - Fog Style
    this.particles = scene.add.particles(0, 0, 'wind_particle', {
        x: { min: -100, max: scene.cameras.main.width + 100 },
        y: { min: -100, max: scene.cameras.main.height + 100 },
        quantity: 1, 
        frequency: 200, // Less frequent
        lifespan: 10000, // Live longer to drift across
        scale: { min: 4, max: 8 }, // Very large clouds
        alpha: { start: 0, end: 0.15, ease: 'Sine.easeInOut' }, // Low opacity (was 0.5)
        blendMode: 'SCREEN',
        // Remove rotation to see if it helps 'jitter', or keep smooth rotation
        rotate: { min: 0, max: 360 },
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

    // Update particles - Drift with wind
    // We want them to move across the screen in the direction of the wind.
    const speedScale = 50; // Constant drift speed (pixels per sec approx)
    const rad = Phaser.Math.DegToRad(this.angle - 90);
    
    // In Phaser 3, setting particle speedX/Y directly on emitter might not affect *existing* particles 
    // depending on version, but usually does for *new* ones. 
    // To affect all, we might need a death zone or just let them spawn with correct velocity.
    // For now, let's try setting standard config values if speedX/Y isn't working as expected.
    // But since I'm using this property access, I'll stick to it but lower the value.
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

import Phaser from 'phaser';
import { SailPhysics } from '../physics/SailPhysics';
import { PHYSICS_CONFIG } from '../config';
import { Wind } from './Wind';

export class Boat extends Phaser.GameObjects.Container {
  public speed: number = 0;
  public heading: number = 0; // Degrees, 0=North
  public sailTrim: number = 50; // 0-100%

  private wake!: Phaser.GameObjects.Particles.ParticleEmitter;
  
  private hullGraphics!: Phaser.GameObjects.Graphics;
  private sailGraphics!: Phaser.GameObjects.Graphics;
  
  private swirls!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    // Swirl Emitter (Turbulence)
    if (!scene.textures.exists('swirl')) {
        const gfx = scene.make.graphics({x:0, y:0});
        gfx.lineStyle(2, 0xffffff, 1);
        gfx.beginPath();
        gfx.arc(10, 10, 8, 0, 1.5 * Math.PI, false);
        gfx.strokePath();
        gfx.generateTexture('swirl', 20, 20);
    }
    
    this.swirls = scene.add.particles(0, 0, 'swirl', {
        lifespan: 1000,
        scale: { start: 0.5, end: 1 },
        alpha: { start: 0.5, end: 0 },
        rotate: { start: 0, end: 360 },
        speed: { min: 20, max: 50 },
        emitting: false
    });

    // Create wake trail texture
    if (!scene.textures.exists('wake_particle')) {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('wake_particle', 8, 8);
    }

    // Wake attached to scene (world space), not the container
    this.wake = scene.add.particles(0, 0, 'wake_particle', {
        lifespan: 1000,
        scale: { start: 1, end: 0 },
        alpha: { start: 0.5, end: 0 },
        quantity: 1,
        frequency: 100,
        blendMode: 'ADD'
    });
    this.wake.stop(); // Start only when moving

    // Draw Hull
    this.hullGraphics = scene.add.graphics();
    this.add(this.hullGraphics);
    this.drawHull();

    // Draw Sail
    this.sailGraphics = scene.add.graphics();
    this.add(this.sailGraphics);
    this.drawSail();

    scene.add.existing(this);
  }

  update(wind: Wind, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    // Handle Input
    if (cursors.left.isDown) {
      this.heading -= PHYSICS_CONFIG.RUDDER_TURN_RATE;
    } else if (cursors.right.isDown) {
      this.heading += PHYSICS_CONFIG.RUDDER_TURN_RATE;
    }

    if (cursors.up.isDown) {
      this.sailTrim = Math.min(100, this.sailTrim + PHYSICS_CONFIG.SAIL_ADJUST_RATE);
    } else if (cursors.down.isDown) {
      this.sailTrim = Math.max(0, this.sailTrim - PHYSICS_CONFIG.SAIL_ADJUST_RATE); 
    }

    // Physics
    const targetSpeed = SailPhysics.calculateBoatSpeed(
      this.heading,
      wind.angle,
      wind.speed,
      this.sailTrim
    );
    
    // Inertia / Accel
    if (this.speed < targetSpeed) {
      this.speed += 0.05;
    } else {
      this.speed -= 0.1; 
      this.speed = Math.max(0, this.speed);
    }

    // Move
    // Heading 0 = North (-Y). Math 0 = East (+X).
    // Delta = Heading - 90.
    const rad = Phaser.Math.DegToRad(this.heading - 90);
    this.x += Math.cos(rad) * this.speed;
    this.y += Math.sin(rad) * this.speed;

    // Draw Sail Curve dynamically
    // Calculate apparent wind angle relative to boat
    const apparentWindAngle = wind.angle - this.heading;
    // Determine which side wind is filling from (Port or Starboard)
    // Normalize to -180 to 180
    let windDiff = Phaser.Math.Angle.WrapDegrees(apparentWindAngle);
    
    // Boom Angle: proportional to sail trim, but limited by wind.
    // If wind is from right, boom goes left.
    // Max boom angle is roughly trim value (0 to 90 degrees).
    const maxBoomAngle = (this.sailTrim / 100) * 90; 
    
    // Boom pushes away from wind
    let currentBoomAngle = 0;
    if (Math.abs(windDiff) > 5) { // Deadzone
        const side = windDiff > 0 ? -1 : 1; // Wind right -> Boom left
        currentBoomAngle = side * maxBoomAngle;
    }

    // Update Sail Graphics (Curve)
    this.sailGraphics.clear();
    
    // Boom
    this.sailGraphics.lineStyle(3, 0xcccccc);
    const boomLen = 40;
    const mastY = -15;
    
    // Calculate Boom End Point based on currentBoomAngle
    // -90 because 0 is right in Phaser math, we want 0 to be DOWN (aft) relative to boat? 
    // Actually, boat points UP (-90). So AFT is +90.
    // Let's stick to: Boat Forward is UP (screen Y negative).
    // So 0 deg relative to boat would be straight back (90 deg in screen space).
    const boomScreenRad = Phaser.Math.DegToRad(currentBoomAngle + 90);
    
    const boomX = Math.cos(boomScreenRad) * boomLen;
    const boomY = mastY + Math.sin(boomScreenRad) * boomLen;

    this.sailGraphics.beginPath();
    this.sailGraphics.moveTo(0, mastY);
    this.sailGraphics.lineTo(boomX, boomY);
    this.sailGraphics.strokePath();

    // Sail Cloth (Curve)
    // Bezier from Mast to Boom End, with control point blown out by wind
    // Actually simpler: Curve is just offset from the chord line.
    
    // Midpoint of boom
    const midX = (0 + boomX) / 2;
    const midY = (mastY + boomY) / 2;
    
    // Visual Hack: Just curve it slightly "downwind" of the boom line
    this.sailGraphics.lineStyle(2, 0xffffff);
    
    const sailPath = new Phaser.Curves.Path(0, mastY);
    sailPath.quadraticBezierTo(boomX, boomY, midX + (boomX * 0.2), midY + (boomY * 0.2));
    sailPath.draw(this.sailGraphics);
    
    // Apply Rotation to container (Movement)
    // The boat sprite rotates, so we just set rotation.
    this.setRotation(rad);
    this.rotation = Phaser.Math.DegToRad(this.heading);
    
    // Sail Rotation (Visual approximation)
    // In reality, wind pushes sail. Here we just visualize trim?
    // Let's just angle it based on trim for now to show it moving.

    // Wake Emitter
    if (this.speed > 0.5) {
        if (!this.wake.emitting) this.wake.start();
        // Emit from back of boat
        const wakeX = this.x - Math.cos(rad) * 30;
        const wakeY = this.y - Math.sin(rad) * 30;
        this.wake.setPosition(wakeX, wakeY);
        // Particle speed away from boat? Or just static trail?
        // Static trail is easier, just leaving them behind.
        this.wake.frequency = Math.max(20, 100 - (this.speed * 10)); // faster speed = more particles
        
        // Swirls at high speed or turn?
        if (this.speed > 5) {
            if (!this.swirls.emitting) this.swirls.start();
            this.swirls.setPosition(wakeX, wakeY);
            // Randomly offset swirl
            // this.swirls.emitParticleAt(wakeX, wakeY);
        } else {
            this.swirls.stop();
        }
    } else {
        if (this.wake.emitting) this.wake.stop();
        if (this.swirls.emitting) this.swirls.stop();
    }
    // We should account for wind side eventually.
    // this.sail.rotation = Phaser.Math.DegToRad(this.sailTrim * 0.9); 
  }

  private drawHull() {
    this.hullGraphics.clear();
    this.hullGraphics.lineStyle(2, 0xffffff);
    this.hullGraphics.fillStyle(0x333333);
    
    // Draw Hull Shape using Path
    // Bow (0, -30)
    // Port Curve: to (-10, 30) via (-15, 0)
    // Stern: to (10, 30)
    // Starboard Curve: to (0, -30) via (15, 0)
    
    const path = new Phaser.Curves.Path(0, -30);
    path.quadraticBezierTo(-10, 30, -15, 0);
    path.lineTo(10, 30);
    path.quadraticBezierTo(0, -30, 15, 0);
    path.closePath();
    
    path.draw(this.hullGraphics);
    this.hullGraphics.fillPoints(path.getPoints());

    // Deck Detail
    this.hullGraphics.fillStyle(0x555555);
    this.hullGraphics.fillCircle(0, 10, 5); // Cockpit/Mast base area
    this.hullGraphics.fillStyle(0xaaaaaa);
    this.hullGraphics.fillCircle(0, -15, 2); // Mast step
  }

  private drawSail() {
    this.sailGraphics.clear();
    this.sailGraphics.lineStyle(3, 0xffffff);
    
    // Check if we need to draw curve (from update) or static
    // Just draw static straight line for now, dynamic curve is in update()
    // but update() calls clear() and redraws.
    // Let's make sure the base drawSail does something valid if called.
    
    this.sailGraphics.beginPath();
    this.sailGraphics.moveTo(0, -15); // Mast position
    this.sailGraphics.lineTo(0, 25);  // Boom end
    this.sailGraphics.strokePath();
  }
}

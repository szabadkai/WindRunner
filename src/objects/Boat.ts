import Phaser from 'phaser';
import { SailPhysics } from '../physics/SailPhysics';
import { PHYSICS_CONFIG, COURIER_CONFIG } from '../config';
import { Wind } from './Wind';
import { Cargo } from './Cargo';

export class Boat extends Phaser.GameObjects.Container {
  public speed: number = 0;
  public heading: number = 0; // Degrees, 0=North
  public sailTrim: number = 50; // 0-100%
  public heelAngle: number = 0; // Degrees, 0-45
  
  public cargo: Cargo[] = []; // Cargo Hold

  private wake!: Phaser.GameObjects.Particles.ParticleEmitter;

  private hullGraphics!: Phaser.GameObjects.Graphics;
  private sailGraphics!: Phaser.GameObjects.Graphics;
  private heelText!: Phaser.GameObjects.Text;
  private sailCamber: number = 0.25;
  private sailFill: number = 0;
  private sailFlailTime: number = 0;
  
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
    
    // Heel Text on Boat (initially hidden or empty)
    this.heelText = scene.add.text(25, 0, '', { fontSize: '12px', color: '#ffffff' }).setOrigin(0, 0.5);
    this.add(this.heelText);

    // Initial Draw
    this.drawHull();

    // Draw Sail
    this.sailGraphics = scene.add.graphics();
    this.add(this.sailGraphics);
    this.drawSail();

    scene.add.existing(this);
  }

  update(wind: Wind, cursors: Phaser.Types.Input.Keyboard.CursorKeys, touchInput?: { steerInput: number, trimDelta: number }) {
    // Handle Keyboard Input
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

    // Handle Touch Input (additive with keyboard)
    if (touchInput) {
      // Steer Input is Position-Based (Joystick): acts as Rudder Angle
      this.heading += touchInput.steerInput * PHYSICS_CONFIG.RUDDER_TURN_RATE;
      
      // Trim Input is Delta-Based (Motion): acts as direct adjustment
      // Unlike keyboard which is rate-based (hold key = change), touch is motion-based (move finger = change)
      // Accumulate the delta
      this.sailTrim = Math.max(0, Math.min(100, this.sailTrim + touchInput.trimDelta));
    }

    // Physics
    const baseSpeed = SailPhysics.calculateBoatSpeed(
      this.heading,
      wind.angle,
      wind.speed,
      this.sailTrim
    );
    
    // Calculate wind force for heel (wind speed * angle efficiency approximation)
    let relativeAngle = Math.abs(this.heading - wind.angle) % 360;
    if (relativeAngle > 180) relativeAngle = 360 - relativeAngle;
    const angleEfficiency = relativeAngle >= 45 ? Math.min(1, (relativeAngle - 45) / 45) : 0;
    const windForce = wind.speed * angleEfficiency;
    
    // Calculate heel angle and speed multiplier
    this.heelAngle = SailPhysics.calculateHeelAngle(windForce, this.sailTrim, this.speed);
    const heelMultiplier = SailPhysics.getHeelSpeedMultiplier(this.heelAngle);
    
    // Weight Penalty
    // Each cargo item adds 20% weight penalty (example) logic from config
    // Actually CONFIG says multiplier 1.2 per item.
    // So if 1 item, weight factor = 1.2
    // If 2 items, weight factor = 1.44? Or additive 1.4? 
    // Let's stick to simple mass = 1 + (count * 0.2)
    // Acceleration = Force / Mass.
    // So target speed (terminal velocity) should be divided by Mass? Or sqrt(Mass)? 
    // Simplified: Speed penalty = 1 / Mass.
    const mass = 1 + (this.cargo.length * (COURIER_CONFIG.CARGO_WEIGHT_MULTIPLIER - 1));
    const weightPenalty = 1 / mass;

    const targetSpeed = baseSpeed * heelMultiplier * weightPenalty;
    
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
    const absWindDiff = Math.abs(windDiff);
    
    // Boom Angle: proportional to sail trim, but limited by wind.
    // If wind is from right, boom goes left.
    // Max boom angle is roughly trim value (0 to 90 degrees).
    const maxBoomAngle = (this.sailTrim / 100) * 90;

    // Trim efficiency to drive visuals (also lets us detect stalls)
    const trimRelativeAngle = Phaser.Math.Clamp(absWindDiff, PHYSICS_CONFIG.NO_GO_ZONE_ANGLE, 180);
    const optimalTrim = ((trimRelativeAngle - PHYSICS_CONFIG.NO_GO_ZONE_ANGLE) / (180 - PHYSICS_CONFIG.NO_GO_ZONE_ANGLE)) * 100;
    const trimDeviation = Math.abs(this.sailTrim - optimalTrim);
    const trimEfficiency = Phaser.Math.Clamp(1 - (trimDeviation / 60), 0, 1);

    // Stall / luff when too close to no-go or badly trimmed
    const stallSeverity = Phaser.Math.Clamp(
      (absWindDiff < PHYSICS_CONFIG.NO_GO_ZONE_ANGLE ? 0.6 : 0) + (1 - trimEfficiency),
      0,
      1
    );
    this.sailFlailTime += this.scene.game.loop.delta;
    const flailOsc = Math.sin(this.sailFlailTime * 0.02) + Math.cos(this.sailFlailTime * 0.017);
    const flailStrengthRaw = stallSeverity * Phaser.Math.Linear(0.5, 4, wind.speed / PHYSICS_CONFIG.WIND_SPEED_MAX);
    
    // Boom pushes away from wind
    let currentBoomAngle = 0;
    if (Math.abs(windDiff) > 5) { // Deadzone
        const side = windDiff > 0 ? -1 : 1; // Wind right -> Boom left
        currentBoomAngle = side * maxBoomAngle;
    }
    const jitterTaper = Phaser.Math.Clamp(maxBoomAngle / 90, 0, 1); // tight trim reduces flutter
    const flailStrength = flailStrengthRaw * jitterTaper;
    const boomShake = flailStrength * flailOsc;
    const baseSign = Math.sign(currentBoomAngle || (windDiff >= 0 ? -1 : 1));
    currentBoomAngle += boomShake;
    if (currentBoomAngle * baseSign <= 0) {
      currentBoomAngle = baseSign * Math.max(2, Math.abs(currentBoomAngle) * 0.3);
    }
    currentBoomAngle = Phaser.Math.Clamp(currentBoomAngle, -maxBoomAngle - 8, maxBoomAngle + 8);

    // Visual shaping: puff more downwind, keep some camber while tacking
    const sailPower = Phaser.Math.Clamp(baseSpeed / PHYSICS_CONFIG.MAX_BOAT_SPEED, 0, 1);
    this.sailFill = Phaser.Math.Linear(this.sailFill, sailPower, 0.12);
    const downwindPuff = Phaser.Math.Easing.Sine.InOut(Math.max(0, (absWindDiff - 110) / 70));
    const tackPresence = Phaser.Math.Easing.Sine.Out(1 - Phaser.Math.Clamp((absWindDiff - PHYSICS_CONFIG.NO_GO_ZONE_ANGLE) / 135, 0, 1));
    const camberTarget = Phaser.Math.Clamp(
      0.18 + (this.sailFill * 0.45) + (downwindPuff * 0.4) + (tackPresence * 0.18),
      0,
      1
    );
    this.sailCamber = Phaser.Math.Linear(this.sailCamber, camberTarget, 0.18);
    const camberJitter = flailStrength * 0.05 * Math.sin(this.sailFlailTime * 0.025);
    const camberAmount = Phaser.Math.Clamp(this.sailCamber + camberJitter, 0.12, 1);

    // Update Sail Graphics (Curve)
    this.sailGraphics.clear();
    
    // Boom
    this.sailGraphics.lineStyle(3, 0xcccccc);
    const boomLen = 55;
    const mastY = -18;
    
    // Calculate Boom End Point based on currentBoomAngle
    // -90 because 0 is right in Phaser math, we want 0 to be DOWN (aft) relative to boat? 
    // Actually, boat points UP (-90). So AFT is +90.
    // Let's stick to: Boat Forward is UP (screen Y negative).
    // So 0 deg relative to boat would be straight back (90 deg in screen space).
    const boomScreenRad = Phaser.Math.DegToRad(currentBoomAngle + 90);
    
    const boomX = Math.cos(boomScreenRad) * boomLen;
    const boomY = mastY + Math.sin(boomScreenRad) * boomLen;

    // Boom line (thinner)
    this.sailGraphics.lineStyle(3, 0xcccccc);
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
    const sailVecX = boomX;
    const sailVecY = boomY - mastY;
    const sailLen = Math.max(1, Math.sqrt((sailVecX * sailVecX) + (sailVecY * sailVecY)));
    const normalSide = currentBoomAngle >= 0 ? 1 : -1; // keep camber on leeward/boom side
    const normalX = (-sailVecY / sailLen) * normalSide;
    const normalY = (sailVecX / sailLen) * normalSide;
    const belly = sailLen * (0.12 + (camberAmount * 0.45) + (downwindPuff * 0.15));
    const controlX = midX + (normalX * belly);
    const controlY = midY + (normalY * belly);
    const clewOvershoot = 1.5 + (this.sailFill * 5) + (downwindPuff * 2);
    const sailEndX = boomX + (normalX * clewOvershoot);
    const sailEndY = boomY + (normalY * clewOvershoot);
    const leechAnchorX = Phaser.Math.Linear(0, sailEndX, 0.65) + (normalX * belly * 0.35);
    const leechAnchorY = Phaser.Math.Linear(mastY, sailEndY, 0.65) + (normalY * belly * 0.35);
    const trailingFlap = flailStrength * 2.5 * Math.sin(this.sailFlailTime * 0.035);
    const leechX = sailEndX + (normalX * trailingFlap);
    const leechY = sailEndY + (normalY * trailingFlap);
    
    // Curved leech, straight luff on the mast, foot fills along boom
    this.sailGraphics.lineStyle(2, 0xffffff, 0.9);
    const leechPath = new Phaser.Curves.Path(sailEndX, sailEndY);
    leechPath.quadraticBezierTo(controlX, controlY, leechAnchorX, leechAnchorY);

    const leechPoints = leechPath.getPoints(18);

    // Foot points follow the boom chord with a tiny sag for depth (fill only, no stroke)
    const footSag = boomLen * 0.025;
    const footPoints: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, mastY)];
    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      const fx = Phaser.Math.Linear(0, sailEndX, t);
      const fy = Phaser.Math.Linear(mastY, sailEndY, t) - (normalY * footSag * (1 - t) * 0.5);
      footPoints.push(new Phaser.Math.Vector2(fx, fy));
    }

    // Fill adds volume with straight luff on the mast and curved leech/foot
    const fillPoints = footPoints.concat(leechPoints);
    this.sailGraphics.fillStyle(0xffffff, 0.25 + (0.4 * this.sailFill));
    this.sailGraphics.fillPoints(fillPoints, true);
    leechPath.draw(this.sailGraphics);

    // Small trailing flick when stalled
    if (flailStrength > 0.2) {
      this.sailGraphics.lineStyle(1, 0xffffff, 0.6);
      this.sailGraphics.beginPath();
      this.sailGraphics.moveTo(sailEndX, sailEndY);
      this.sailGraphics.lineTo(leechX, leechY);
      this.sailGraphics.strokePath();
    }
    
    // Apply Rotation to container (Movement)
    // The boat sprite rotates, so we just set rotation.
    this.setRotation(rad);
    this.rotation = Phaser.Math.DegToRad(this.heading);
    
    // Sail Rotation (Visual approximation)
    // In reality, wind pushes sail. Here we just visualize trim?
    // Let's just angle it based on trim for now to show it moving.

    // Update hull graphics for heel effect
    this.drawHull(this.heelAngle);

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

  private drawHull(heelAmount: number = 0) {
    this.hullGraphics.clear();
    
    // Calculate visual heel: scale hull width based on heel angle
    // At 0° heel: full width (1.0), at 45° heel: half width (0.5)
    const heelScale = 1 - (heelAmount / 90);
    
    // Shade windward side darker when heeled
    const heelTint = heelAmount > 5 ? 0x222222 : 0x333333;
    
    this.hullGraphics.lineStyle(2, 0xffffff);
    this.hullGraphics.fillStyle(heelTint);
    
    // Draw Hull Shape using Path (scaled horizontally for heel effect)
    const hullWidth = 15 * heelScale;
    const sternWidth = 10 * heelScale;
    
    const path = new Phaser.Curves.Path(0, -30);
    path.quadraticBezierTo(-sternWidth, 30, -hullWidth, 0);
    path.lineTo(sternWidth, 30);
    path.quadraticBezierTo(0, -30, hullWidth, 0);
    path.closePath();
    
    path.draw(this.hullGraphics);
    this.hullGraphics.fillPoints(path.getPoints());

    // Deck Detail (also scaled)
    this.hullGraphics.fillStyle(0x555555);
    this.hullGraphics.fillCircle(0, 10, 5 * heelScale); // Cockpit/Mast base area
    this.hullGraphics.fillStyle(0xaaaaaa);
    this.hullGraphics.fillCircle(0, -15, 2); // Mast step (Base)
    
    // Mast Tilt Visualization
    // Draw a line from Mast Step to "Mast Top", offset by heel angle
    // simulates looking top-down at a leaning mast
    if (heelAmount > 1) {
        // Height of mast in pixels (virtual)
        const mastHeight = 40;
        // Offset = sin(heel) * height
        // Heeling to Starboard (Right)? Wind pushes sail.
        // If wind from left, boat heels right.
        // Let's assume heel is always pushed sideways relative to boat.
        // For visual simplicity, let's say it always heels "Downwind" relative to hull?
        // Or just always to one side for now since heelAngle is absolute in our physics?
        // Let's alternate side based on tack? But we don't track tack side easily here yet.
        // Let's just always heel to Right for visualization if positive?
        // Physics calc gives positive angle.
        // Let's assume standard heel is to Right (Starboard) for now, or check wind?
        // Simple: Just offset X positive.
        
        const tipOffset = Math.sin(Phaser.Math.DegToRad(heelAmount)) * mastHeight;
        const tipX = tipOffset;
        const tipY = -15; // Same Y as step, just leaning out
        
        this.hullGraphics.lineStyle(2, 0xffff00, 0.7);
        this.hullGraphics.moveTo(0, -15);
        this.hullGraphics.lineTo(tipX, tipY);
        this.hullGraphics.strokePath();
        
        this.hullGraphics.fillStyle(0xffff00, 1);
        this.hullGraphics.fillCircle(tipX, tipY, 3); // Mast Tip
        
        // Update Text
        this.heelText.setText(`${Math.round(heelAmount)}°`);
        this.heelText.setVisible(true);
    } else {
        this.heelText.setVisible(false);
    }
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

  addCargo(item: Cargo): boolean {
    if (this.cargo.length < COURIER_CONFIG.MAX_CARGO) {
      this.cargo.push(item);
      this.updateAppearance(); // Maybe show cargo on deck?
      return true;
    }
    return false;
  }

  removeCargo(id: string): Cargo | undefined {
    const idx = this.cargo.findIndex(c => c.id === id);
    if (idx >= 0) {
      const removed = this.cargo.splice(idx, 1)[0];
      this.updateAppearance();
      return removed;
    }
    return undefined;
  }
  
  private updateAppearance() {
    // Optional: Add visuals for cargo
    // For now, just Log
    console.log(`Boat Cargo: ${this.cargo.length}/${COURIER_CONFIG.MAX_CARGO}`);
  }
}

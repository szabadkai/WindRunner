import Phaser from 'phaser';
import { PHYSICS_CONFIG, WIND_ALERT_CONFIG } from '../config';

export class Wind {
  public angle: number; // Degrees, 0 = North
  public speed: number; // Knots
  private targetAngle: number;
  
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

    if (time > this.lastShiftTime + this.nextShiftDelay) {
      this.scheduleShift(time);
    }
  }

  private scheduleShift(time: number) {
    const previousAngle = this.angle;

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

    if (shift >= WIND_ALERT_CONFIG.SHIFT_THRESHOLD) {
      this.scene.events.emit('windShift', {
        from: previousAngle,
        to: this.targetAngle,
        degrees: shift,
        direction: dir > 0 ? 'veering' : 'backing',
      });
    }
  }
}

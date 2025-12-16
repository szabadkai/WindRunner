import { PHYSICS_CONFIG } from '../config';

export enum PointOfSail {
  NO_GO,
  CLOSE_HAULED,
  BEAM_REACH,
  BROAD_REACH,
  RUNNING
}

export class SailPhysics {
  /**
   * Calculates the boat's target speed based on its state and the wind.
   * Angles are in degrees (0 = North, clockwise).
   * SailTrim: 0 (tight) to 100 (loose).
   */
  static calculateBoatSpeed(
    boatHeading: number,
    windAngle: number,
    windSpeed: number,
    sailTrim: number
  ): number {
    // 1. Compute relative wind angle (0-180)
    let relativeAngle = Math.abs(boatHeading - windAngle) % 360;
    if (relativeAngle > 180) relativeAngle = 360 - relativeAngle;

    // 2. No-go zone
    if (relativeAngle < PHYSICS_CONFIG.NO_GO_ZONE_ANGLE) {
      return 0;
    }

    // 3. Efficiency based on point of sail (interpolated or verified against specs)
    // Spec efficiency: 45->0.5, 90->1.0, 135->0.85, 180->0.6
    let angleEfficiency = 0;
    if (relativeAngle <= 90) {
      // Linear interop from 45deg (0.5) to 90deg (1.0)
      const t = (relativeAngle - 45) / 45;
      angleEfficiency = 0.5 + 0.5 * t;
    } else if (relativeAngle <= 135) {
      // 90deg (1.0) to 135deg (0.85)
      const t = (relativeAngle - 90) / 45;
      angleEfficiency = 1.0 - 0.15 * t;
    } else {
      // 135deg (0.85) to 180deg (0.6)
      const t = (relativeAngle - 135) / 45;
      angleEfficiency = 0.85 - 0.25 * t;
    }

    // 4. Sail trim penalty
    // Optimal trim depends on angle.
    // 45deg -> 0% (tight) or 20%? Spec says 20-40% for Close hauled (45-90)
    // Let's simplified: 0% at 45deg, 50% at 90deg, 100% at 180deg.
    // Spec:
    // 45-90: 20-40%
    // 90-135: 50-70%
    // 135-180: 80-100%
    
    // Let's define optimal trim linearly from 0% at 45deg to 100% at 180deg?
    // Map relative angle 45..180 to 0..100 trim
    const optimalTrim = ((relativeAngle - 45) / (180 - 45)) * 100;
    
    // Deviation penalty
    const trimDev = Math.abs(sailTrim - optimalTrim);
    // If deviation is huge, efficiency drops.
    // Let's say if off by 50%, efficiency is halved.
    const trimEfficiency = Math.max(0, 1 - (trimDev / 50));

    // 5. Calculate final speed
    // Base speed from wind
    let speed = windSpeed * angleEfficiency * trimEfficiency;
    
    // Clamp to max
    return Math.min(speed, PHYSICS_CONFIG.MAX_BOAT_SPEED);
  }

  static getPointOfSail(boatHeading: number, windAngle: number): PointOfSail {
    let relativeAngle = Math.abs(boatHeading - windAngle) % 360;
    if (relativeAngle > 180) relativeAngle = 360 - relativeAngle;

    if (relativeAngle < 45) return PointOfSail.NO_GO;
    if (relativeAngle < 90) return PointOfSail.CLOSE_HAULED;
    if (relativeAngle < 135) return PointOfSail.BEAM_REACH; // Actually BEAM is exactly 90, but let's say "Beam Reach Zone"
    if (relativeAngle < 160) return PointOfSail.BROAD_REACH;
    return PointOfSail.RUNNING;
  }
}

import { COURSES } from '../data/courses';

export interface GhostData {
  courseIndex: number;
  time: number; // Total time
  inputData: { t: number, x: number, y: number, h: number, s: number }[]; // Time, X, Y, Heading, SailTrim
  // Compress: t relative to start? 
  // For now simple 10Hz sampling.
}

export class ProgressionSystem {
  static getBestTime(courseIndex: number): number | null {
    const raw = localStorage.getItem(`best_time_${courseIndex}`);
    return raw ? parseInt(raw) : null;
  }

  static getStarsForCourse(courseIndex: number): number {
    const time = this.getBestTime(courseIndex);
    if (!time) return 0;
    
    // Check targets from Config
    // We need access to COURSES. Assuming COURSES is imported.
    const course = COURSES[courseIndex];
    if (!course) return 0;

    // Defined in course: goldTime, silverTime, bronzeTime
    // @ts-ignore - Assuming we added these props
    if (time <= course.goldTime) return 3;
    // @ts-ignore
    if (time <= course.silverTime) return 2;
    // @ts-ignore
    if (time <= course.bronzeTime) return 1;
    
    return 0;
  }

  static getTotalStars(): number {
    let total = 0;
    for (let i = 0; i < COURSES.length; i++) {
      total += this.getStarsForCourse(i);
    }
    return total;
  }

  static isCourseUnlocked(courseIndex: number): boolean {
    const course = COURSES[courseIndex];
    if (!course) return false;
    // @ts-ignore
    const required = course.unlockStars || 0;
    return this.getTotalStars() >= required;
  }

  static saveRaceResult(courseIndex: number, time: number): { isNewBest: boolean, stars: number } {
    const currentBest = this.getBestTime(courseIndex);
    let isNewBest = false;

    if (!currentBest || time < currentBest) {
      localStorage.setItem(`best_time_${courseIndex}`, time.toString());
      isNewBest = true;
    }

    return {
      isNewBest,
      stars: this.getStarsForCourse(courseIndex)
    };
  }

  static saveGhost(courseIndex: number, recording: GhostData) {
    // Only save if it's the best time or if no ghost exists
    // Ideally we only save ghost for BEST run.
    // Check if this run is better than stored ghost?
    // Actually simplicity: If we just set a High Score, we save this ghost.
    
    // Compress/Stringify
    // To save space, maybe limit resolution or length? 
    // LocalStorage has 5MB limit. 
    // 3 mins at 10Hz = 180 * 10 = 1800 samples. 
    // Each sample: ~40 bytes stringified? 
    // 1800 * 40 = 72KB. Fine.
    
    try {
        localStorage.setItem(`ghost_${courseIndex}`, JSON.stringify(recording));
    } catch (e) {
        console.warn('Failed to save ghost data (quota exceeded?)', e);
    }
  }

  static loadGhost(courseIndex: number): GhostData | null {
      const raw = localStorage.getItem(`ghost_${courseIndex}`);
      if (!raw) return null;
      try {
          return JSON.parse(raw) as GhostData;
      } catch (e) {
          console.error('Corrupt ghost data', e);
          return null;
      }
  }
}

export interface CourseObstacle {
  x: number;
  y: number;
  radius: number;
}

export interface CourseData {
  name: string;
  waypoints: { x: number; y: number }[];
  obstacles?: CourseObstacle[];
  startLine: { x1: number; y1: number; x2: number; y2: number };
  startPos: { x: number; y: number; heading?: number };
  goldTime: number;
  silverTime: number;
  bronzeTime: number;
  unlockStars: number;
}

export const COURSES: CourseData[] = [
  {
    name: 'Triangle Course (Beginner)',
    waypoints: [
      { x: 300, y: 500 },
      { x: 900, y: 200 },
      { x: 900, y: 600 }
    ],
    obstacles: [],

    startLine: { x1: 200, y1: 650, x2: 400, y2: 650 },
    startPos: { x: 300, y: 680, heading: 0 },
    
    // Progression Data
    goldTime: 45000,   // 45s
    silverTime: 60000, // 60s
    bronzeTime: 90000, // 90s
    unlockStars: 0     // Unlocked by default
  },
  {
    name: 'Windward-Leeward (Intermediate)',
    waypoints: [
      { x: 640, y: 100 }, // Top Mark
      { x: 640, y: 600 }, // Bottom Mark
      { x: 640, y: 100 },
      { x: 640, y: 600 }
    ],
    obstacles: [],
    startLine: { x1: 500, y1: 650, x2: 780, y2: 650 },
    startPos: { x: 640, y: 680, heading: 0 },

    // Progression Data
    goldTime: 120000,  // 2m
    silverTime: 150000, // 2m30s
    bronzeTime: 200000, // 3m20s
    unlockStars: 2      // Requires earning 2 stars total
  },
  {
    name: 'Olympic (Advanced)',
    waypoints: [
      { x: 640, y: 150 }, // Windward
      { x: 1000, y: 350 }, // Reaching
      { x: 280, y: 350 },  // Reaching
      { x: 640, y: 150 },
      { x: 640, y: 600 }   // Finish
    ],
    obstacles: [],
    startLine: { x1: 500, y1: 650, x2: 780, y2: 650 },
    startPos: { x: 640, y: 680, heading: 0 },

    // Progression Data
    goldTime: 180000,  // 3m
    silverTime: 220000, // 3m40s
    bronzeTime: 300000, // 5m
    unlockStars: 5      // Requires earning 5 stars total
  },
  {
    name: 'Reef Slalom (Technical)',
    waypoints: [
      { x: 300, y: 540 },
      { x: 980, y: 460 },
      { x: 320, y: 320 },
      { x: 960, y: 220 },
      { x: 640, y: 120 }
    ],
    obstacles: [
      { x: 640, y: 420, radius: 80 },
      { x: 420, y: 260, radius: 60 },
      { x: 860, y: 260, radius: 60 }
    ],
    startLine: { x1: 520, y1: 700, x2: 760, y2: 700 },
    startPos: { x: 640, y: 730, heading: 0 },

    // Progression Data
    goldTime: 240000,  // 4m
    silverTime: 300000, // 5m
    bronzeTime: 380000, // 6m20s
    unlockStars: 6      // Pushes for solid stars on earlier maps
  },
  {
    name: 'Island Chain Circuit (Advanced)',
    waypoints: [
      { x: 200, y: 500 },
      { x: 200, y: 240 },
      { x: 640, y: 150 },
      { x: 1080, y: 240 },
      { x: 1080, y: 520 },
      { x: 640, y: 680 }
    ],
    obstacles: [
      { x: 420, y: 400, radius: 90 },
      { x: 640, y: 330, radius: 110 },
      { x: 860, y: 400, radius: 90 },
      { x: 640, y: 580, radius: 80 }
    ],
    startLine: { x1: 520, y1: 700, x2: 760, y2: 700 },
    startPos: { x: 640, y: 730, heading: 0 },

    // Progression Data
    goldTime: 300000,  // 5m
    silverTime: 360000, // 6m
    bronzeTime: 450000, // 7m30s
    unlockStars: 9      // Demands consistency across earlier races
  },
  {
    name: 'Long Haul Gauntlet (Endurance)',
    waypoints: [
      { x: 200, y: 560 },
      { x: 640, y: 620 },
      { x: 1100, y: 560 },
      { x: 1100, y: 280 },
      { x: 640, y: 140 },
      { x: 180, y: 280 },
      { x: 640, y: 500 },
      { x: 640, y: 700 }
    ],
    obstacles: [
      { x: 480, y: 520, radius: 90 },
      { x: 800, y: 520, radius: 90 },
      { x: 640, y: 320, radius: 110 },
      { x: 320, y: 260, radius: 80 },
      { x: 960, y: 260, radius: 80 }
    ],
    startLine: { x1: 520, y1: 700, x2: 760, y2: 700 },
    startPos: { x: 640, y: 730, heading: 0 },

    // Progression Data
    goldTime: 420000,  // 7m
    silverTime: 480000, // 8m
    bronzeTime: 570000, // 9m30s
    unlockStars: 12     // Final test before perfecting all tracks
  }
];

// Keep legacy export for now if needed, but we should switch
export const COURSE_TRIANGLE = COURSES[0].waypoints;

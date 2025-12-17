export const COURSES = [
  {
    name: 'Triangle Course (Beginner)',
    waypoints: [
      { x: 300, y: 500 },
      { x: 900, y: 200 },
      { x: 900, y: 600 }
    ],

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
    startLine: { x1: 500, y1: 650, x2: 780, y2: 650 },
    startPos: { x: 640, y: 680, heading: 0 },

    // Progression Data
    goldTime: 180000,  // 3m
    silverTime: 220000, // 3m40s
    bronzeTime: 300000, // 5m
    unlockStars: 5      // Requires earning 5 stars total
  }
];

// Keep legacy export for now if needed, but we should switch
export const COURSE_TRIANGLE = COURSES[0].waypoints;

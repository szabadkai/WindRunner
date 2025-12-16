export const COURSES = [
  {
    name: 'Triangle Course (Beginner)',
    waypoints: [
      { x: 300, y: 500 },
      { x: 900, y: 200 },
      { x: 900, y: 600 }
    ],

    startLine: { x1: 200, y1: 650, x2: 400, y2: 650 },
    startPos: { x: 300, y: 680, heading: 0 }
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
    startPos: { x: 640, y: 680, heading: 0 }
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
    startPos: { x: 640, y: 680, heading: 0 }
  }
];

// Keep legacy export for now if needed, but we should switch
export const COURSE_TRIANGLE = COURSES[0].waypoints;

export const COURSES = [
  {
    name: 'Triangle Course (Beginner)',
    waypoints: [
      { x: 300, y: 500 },
      { x: 900, y: 200 },
      { x: 900, y: 600 }
    ],
    startPos: { x: 100, y: 500 }
  },
  {
    name: 'Windward-Leeward (Intermediate)',
    waypoints: [
      { x: 640, y: 100 }, // Top Mark
      { x: 640, y: 600 }, // Bottom Mark
      { x: 640, y: 100 },
      { x: 640, y: 600 }
    ],
    startPos: { x: 640, y: 650 }
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
    startPos: { x: 640, y: 650 }
  }
];

// Keep legacy export for now if needed, but we should switch
export const COURSE_TRIANGLE = COURSES[0].waypoints;

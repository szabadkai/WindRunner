import Phaser from 'phaser';
import { Boat } from '../objects/Boat';
import { Wind } from '../objects/Wind';
import { Course } from '../objects/Course';
import { COURSES } from '../data/courses';

export class RaceScene extends Phaser.Scene {
  private boat!: Boat;
  private wind!: Wind;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private water!: Phaser.GameObjects.TileSprite;
  private course!: Course;
  
  private isRaceActive: boolean = false;
  private isPreStart: boolean = false;
  private courseIndex: number = 0;
  private startTime: number = 0;

  constructor() {
    super('RaceScene');
  }

  create(data: { courseIndex: number }) {
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky Blue
    
    this.courseIndex = data.courseIndex || 0;
    const courseData = COURSES[this.courseIndex];

    this.scene.launch('UIScene', { waypoints: courseData.waypoints });

    // Background
    this.water = this.add.tileSprite(
        0, 0, 
        this.cameras.main.width, 
        this.cameras.main.height, 
        'water'
    ).setOrigin(0, 0).setScrollFactor(0);

    // Init Course
    this.course = new Course(this, {
        waypoints: courseData.waypoints, 
        startLine: courseData.startLine
    });

    // Init Wind
    this.wind = new Wind(this);

    // Init Boat at Start Pos
    this.boat = new Boat(this, courseData.startPos.x, courseData.startPos.y);
    if (courseData.startPos.heading !== undefined) {
        this.boat.heading = courseData.startPos.heading;
    }
    
    // Start Sequence
    this.isRaceActive = false;
    this.startCountdown();

    // Camera
    this.cameras.main.startFollow(this.boat);
    
    // Input
    if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Pause
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.pause();
            this.scene.launch('PauseScene');
        });

        // Restart
        this.input.keyboard.on('keydown-R', () => {
            this.scene.restart();
        });
    }
  }

  private startCountdown() {
      let count = 5; // Increase to 5 for sailing start
      // Emit initial count
      this.events.emit('countdown', count);
      
      // Allow boat update but mark race as Inactive so timer doesn't count up?
      // Actually, distinct phases: PRE_START, RACING, FINISHED.
      // 'isRaceActive' used to mean "Game is running".
      // Now we want "Game is running" but "Race time hasn't started".
      
      // Quick fix: Set isRaceActive = true immediately to allow physics.
      // Use a new flag `isPreStart` for OCS checking.
      this.isRaceActive = true; 
      this.isPreStart = true;

      this.time.addEvent({
          delay: 1000,
          repeat: 5,
          callback: () => {
              count--;
              if (count > 0) {
                  this.events.emit('countdown', count);
              } else if (count === 0) {
                  this.events.emit('countdown', 'GO!');
                  this.isPreStart = false; // Race officially starts
                  this.startTime = this.time.now;
                  
                  // Check OCS
                  if (this.course.checkOCS(this.boat.y)) {
                      // Penalty!
                      this.events.emit('countdown', 'OCS!');
                      // For now, no hard penalty, just shame.
                  } else {
                      this.course.hideStartLine();
                  }
              } else {
                  this.events.emit('countdown', ''); // Clear
              }
          }
      });
  }

  update(time: number, delta: number) {
    this.wind.update(time, delta);
    
    if (this.isRaceActive && this.cursors) {
        this.boat.update(this.wind, this.cursors);
        
        // Update Course Logic
        this.course.update(this.boat.x, this.boat.y);
        
        // Check for finish
        if (!this.isPreStart && this.course.getCurrentTarget() === null) {
            this.finishRace(time);
        }
    }
    
    // Update water scroll based on camera position
    this.water.tilePositionX = this.cameras.main.scrollX;
    this.water.tilePositionY = this.cameras.main.scrollY;

    // Emit HUD update
  let elapsed = 0;
  if (this.isRaceActive && !this.isPreStart) {
      elapsed = time - this.startTime;
  }
  
  this.events.emit('updateHUD', {
        windAngle: this.wind.angle,
        windSpeed: this.wind.speed,
        boatSpeed: this.boat.speed,
        boatHeading: this.boat.heading,
        boatX: this.boat.x,
        boatY: this.boat.y,
        sailTrim: this.boat.sailTrim,
        time: elapsed,
        waypointIndex: this.course.getCurrentIndex(),
        totalWaypoints: this.course.getTotalWaypoints()
    });
  }

  private finishRace(time: number) {
      this.isRaceActive = false;
      const elapsed = time - this.startTime;
      
      // Save Score
      const currentBest = localStorage.getItem(`best_time_${this.courseIndex}`);
      if (!currentBest || elapsed < parseInt(currentBest)) {
          localStorage.setItem(`best_time_${this.courseIndex}`, elapsed.toString());
      }

      this.events.emit('raceFinished', elapsed);
      
      // Stop boat
      this.boat.speed = 0;
  }
}

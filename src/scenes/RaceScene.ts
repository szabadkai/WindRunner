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
  private courseIndex: number = 0;
  private startTime: number = 0;

  constructor() {
    super('RaceScene');
  }

  create(data: { courseIndex: number }) {
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
    this.course = new Course(this, courseData.waypoints);

    // Init Wind
    this.wind = new Wind(this);

    // Init Boat at Start Pos
    this.boat = new Boat(this, courseData.startPos.x, courseData.startPos.y);
    
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
      let count = 3;
      // Emit initial count
      this.events.emit('countdown', count);
      
      this.time.addEvent({
          delay: 1000,
          repeat: 3,
          callback: () => {
              count--;
              if (count > 0) {
                  this.events.emit('countdown', count);
              } else if (count === 0) {
                  this.events.emit('countdown', 'GO!');
                  this.isRaceActive = true;
                  this.startTime = this.time.now;
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
        if (this.course.getCurrentTarget() === null) {
            this.finishRace(time);
        }
    }
    
    // Update water scroll based on camera position
    this.water.tilePositionX = this.cameras.main.scrollX;
    this.water.tilePositionY = this.cameras.main.scrollY;

    // Emit HUD update
    const elapsed = this.isRaceActive ? (time - this.startTime) : 0;
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

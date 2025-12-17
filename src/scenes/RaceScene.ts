import Phaser from 'phaser';
import { Boat } from '../objects/Boat';
import { Wind } from '../objects/Wind';
import { Course } from '../objects/Course';
import { COURSES } from '../data/courses';
import { GhostBoat } from '../objects/GhostBoat';
import { ProgressionSystem, GhostData } from '../systems/ProgressionSystem';

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
  
  // Ghost Vars
  private ghostBoat: GhostBoat | null = null;
  private ghostData: GhostData | null = null;
  private currentGhostIndex: number = 0;
  private recording: { t: number, x: number, y: number, h: number, s: number }[] = [];
  private lastRecordTime: number = 0;

  private isOCS: boolean = false;

  constructor() {
    super('RaceScene');
  }

  create(data: { courseIndex: number }) {
    // ... no changes to create ...
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky Blue
    
    this.courseIndex = data.courseIndex || 0;
    const courseData = COURSES[this.courseIndex];
    // ...
    // Init Boat at Start Pos
    this.boat = new Boat(this, courseData.startPos.x, courseData.startPos.y);
    if (courseData.startPos.heading !== undefined) {
        this.boat.heading = courseData.startPos.heading;
    }

    // Reset OCS Flag
    this.isOCS = false;
    
    // ... (rest of create) ...
    // Init Ghost
    this.ghostData = ProgressionSystem.loadGhost(this.courseIndex);
    if (this.ghostData) {
        // Find ghost start pos (first frame)
        const frame = this.ghostData.inputData[0];
        if (frame) {
            this.ghostBoat = new GhostBoat(this, frame.x, frame.y);
        }
    }
    
    // Start Sequence
    this.isRaceActive = false;
    this.startCountdown();
    // ...
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
            this.scene.stop('UIScene');
            this.scene.start('RaceScene', { courseIndex: this.courseIndex });
        });
    }
  }

  private startCountdown() {
      let count = 5; // Increase to 5 for sailing start
      // Emit initial count
      this.events.emit('countdown', count);
      
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
                  
                  // Reset Recording
                  this.recording = [];
                  this.lastRecordTime = 0;
                  
                  // Check OCS
                  if (this.course.checkOCS(this.boat.y)) {
                      // Penalty!
                      this.events.emit('countdown', 'OCS!');
                      this.isOCS = true; // Flag for DQ
                  } else {
                      this.course.hideStartLine();
                  }
              } else {
                  this.events.emit('countdown', ''); // Clear
              }
          }
      });
  }

  // ... (update) ...

  private finishRace(time: number) {
      this.isRaceActive = false;
      const elapsed = time - this.startTime;
      
      if (this.isOCS) {
          // Disqualified
          console.log("Race Finished but DSQ (OCS)");
          this.events.emit('raceFinished', { time: elapsed, stars: 0, isNewBest: false, dsq: true });
          this.boat.speed = 0;
          return;
      }

      // Save Score & Progression
      const result = ProgressionSystem.saveRaceResult(this.courseIndex, elapsed);

      // Save Ghost if new best
      if (result.isNewBest) {
          ProgressionSystem.saveGhost(this.courseIndex, {
              courseIndex: this.courseIndex,
              time: elapsed,
              inputData: this.recording
          });
      }
      
      // Notify UI of stars/result
      // raceFinished event can pass extra data
      this.events.emit('raceFinished', { time: elapsed, stars: result.stars, isNewBest: result.isNewBest });
      
      // Stop boat
      this.boat.speed = 0;
  }
}

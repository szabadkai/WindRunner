import Phaser from 'phaser';
import { Boat } from '../objects/Boat';
import { Wind } from '../objects/Wind';
import { Course } from '../objects/Course';
import { COURSES, CourseObstacle } from '../data/courses';
import { GhostBoat } from '../objects/GhostBoat';
import { ProgressionSystem, GhostData } from '../systems/ProgressionSystem';
import { AudioSettings } from '../systems/AudioSettings';
import { SoundManager } from '../systems/SoundManager';
import { SailPhysics } from '../physics/SailPhysics';

export class RaceScene extends Phaser.Scene {
  private boat!: Boat;
  private wind!: Wind;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private water!: Phaser.GameObjects.TileSprite;
  private course!: Course;
  private obstacles: (CourseObstacle & { graphic: Phaser.GameObjects.Graphics })[] = [];
  private bgm: Phaser.Sound.BaseSound | undefined;
  private keepBgmOnShutdown: boolean = false;
  
  private isRaceActive: boolean = false;
  private isPreStart: boolean = false;
  private courseIndex: number = 0;
  private startTime: number = 0;
  private lastObstacleHitTime: number = 0;
  private obstacleCollisionBuffer: number = 26;
  
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
    this.cameras.main.setBackgroundColor('#87CEEB'); // Sky Blue
    AudioSettings.apply(this);
    
    this.courseIndex = data.courseIndex || 0;
    const courseData = COURSES[this.courseIndex];
    this.lastObstacleHitTime = 0;

    this.scene.launch('UIScene', { waypoints: courseData.waypoints, obstacles: courseData.obstacles });

    const existingBgm = this.sound.get('bgm_race') as Phaser.Sound.BaseSound | null;
    this.bgm = existingBgm ?? this.sound.add('bgm_race', { loop: true, volume: 0.5 });

    if (!this.bgm.isPlaying) {
        if (this.sound.locked) {
            this.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.bgm?.play());
            this.sound.unlock();
        } else {
            this.bgm.play();
        }
    }

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        if (this.keepBgmOnShutdown) {
            this.keepBgmOnShutdown = false;
            return; // Persist BGM across restart
        }
        this.bgm?.stop();
    });

    // Background
    this.water = this.add.tileSprite(
        0, 0, 
        this.cameras.main.width, 
        this.cameras.main.height, 
        'water'
    ).setOrigin(0, 0).setScrollFactor(0);

    this.buildObstacles(courseData.obstacles);

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

    // Reset OCS Flag
    this.isOCS = false;
    this.currentGhostIndex = 0;
    
    // ... (rest of create) ...
    // Init Ghost
    this.ghostData = ProgressionSystem.loadGhost(this.courseIndex);
    if (this.ghostData && this.ghostData.inputData.length > 0) {
        // Find ghost start pos (first frame)
        const frame = this.ghostData.inputData[0];
        if (frame) {
            this.ghostBoat = new GhostBoat(this, frame.x, frame.y);
        }
    } else {
        this.ghostData = null;
    }
    
    // Start Sequence
    this.isRaceActive = false;
    this.startCountdown();

    // Forward wind shift events to UIScene
    this.events.on('windShift', (data: { from: number; to: number; degrees: number; direction: string }) => {
      this.events.emit('windShiftAlert', data);
    });

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

        // Mute toggle
        this.input.keyboard.on('keydown-M', () => {
            AudioSettings.toggle(this);
            SoundManager.getInstance().playSelect();
        });

        // Restart
        this.input.keyboard.on('keydown-R', () => {
            this.keepBgmOnShutdown = true;
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

  update(time: number, delta: number) {
    this.wind.update(time, delta);
    
    if (this.isRaceActive && this.cursors) {
        // Get touch input from UIScene if available
        const uiScene = this.scene.get('UIScene') as { touchInput?: { steerInput: number, trimDelta: number } };
        const touchInput = uiScene?.touchInput;
        
        
        this.boat.update(this.wind, this.cursors, touchInput);
        this.handleObstacleCollisions(time);
        
        // Record Ghost (10Hz = every 100ms)
        if (!this.isPreStart && time > this.lastRecordTime + 100) {
            this.lastRecordTime = time;
            this.recording.push({
                t: time - this.startTime,
                x: this.boat.x,
                y: this.boat.y,
                h: this.boat.heading,
                s: this.boat.sailTrim
            });
        }
        
        // Play Ghost
        if (this.ghostBoat && this.ghostData && !this.isPreStart) {
            const elapsed = time - this.startTime;
            
            // Catch up index
            let frame = this.ghostData.inputData[this.currentGhostIndex];
            while (frame && frame.t < elapsed) {
                this.currentGhostIndex++;
                frame = this.ghostData.inputData[this.currentGhostIndex];
            }

            // If we've gone past the recording, hold the last frame.
            if (this.currentGhostIndex >= this.ghostData.inputData.length) {
                const last = this.ghostData.inputData[this.ghostData.inputData.length - 1];
                if (last) {
                    this.ghostBoat.updateState(last.x, last.y, last.h, last.s);
                }
            } else if (this.currentGhostIndex > 0) {
                // Interpolate? For now just snap to nearest previous frame or linear interp
                const prev = this.ghostData.inputData[this.currentGhostIndex - 1];
                const next = this.ghostData.inputData[this.currentGhostIndex];
                if (prev && next) {
                    const ratio = (elapsed - prev.t) / (next.t - prev.t);
                    const x = Phaser.Math.Linear(prev.x, next.x, ratio);
                    const y = Phaser.Math.Linear(prev.y, next.y, ratio);
                    // Angle lerp
                    // Just simple linear for heading (wrap check needed but simple usually ok)
                    const hDeg = Phaser.Math.Linear(prev.h, next.h, ratio);
                    
                    this.ghostBoat.updateState(x, y, hDeg, prev.s);
                }
            } else if (frame) {
                this.ghostBoat.updateState(frame.x, frame.y, frame.h, frame.s);
            }
        }
        
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
        heelAngle: this.boat.heelAngle,
        sailEfficiency: SailPhysics.calculateSailEfficiency(
            this.boat.heading, this.wind.angle, this.boat.sailTrim
        ),
        pointOfSail: SailPhysics.getPointOfSailLabel(
            this.boat.heading, this.wind.angle
        ),
        time: elapsed,
        waypointIndex: this.course.getCurrentIndex(),
        totalWaypoints: this.course.getTotalWaypoints()
    });
  }

  private buildObstacles(obstacles: CourseObstacle[] | undefined) {
      this.obstacles.forEach(ob => ob.graphic.destroy());
      this.obstacles = [];
      if (!obstacles || obstacles.length === 0) return;

      this.obstacles = obstacles.map(obstacle => {
          const graphic = this.add.graphics({ x: obstacle.x, y: obstacle.y });
          graphic.fillStyle(0x2f2f2f, 0.95);
          graphic.fillCircle(0, 0, obstacle.radius);
          graphic.lineStyle(4, 0x0d0d0d, 0.8);
          graphic.strokeCircle(0, 0, obstacle.radius + 6);
          graphic.lineStyle(1, 0xffffff, 0.12);
          graphic.strokeCircle(0, 0, obstacle.radius + 14);

          return { ...obstacle, graphic };
      });
  }

  private handleObstacleCollisions(time: number) {
      if (this.obstacles.length === 0) return;

      this.obstacles.forEach(obstacle => {
          const distance = Phaser.Math.Distance.Between(this.boat.x, this.boat.y, obstacle.x, obstacle.y);
          const minimum = obstacle.radius + this.obstacleCollisionBuffer;

          if (distance < minimum) {
              const separationAngle = Phaser.Math.Angle.Between(obstacle.x, obstacle.y, this.boat.x, this.boat.y);
              const safeX = obstacle.x + Math.cos(separationAngle) * (minimum + 2);
              const safeY = obstacle.y + Math.sin(separationAngle) * (minimum + 2);

              this.boat.setPosition(safeX, safeY);
              this.boat.speed = Math.max(0, this.boat.speed * 0.35);

              if (time - this.lastObstacleHitTime > 250) {
                  this.cameras.main.shake(120, 0.002);
                  this.lastObstacleHitTime = time;
              }
          }
      });
  }

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

  // Allow other scenes (UI) to persist race BGM across a restart.
  public keepBgmForRestart() {
      this.keepBgmOnShutdown = true;
  }
}

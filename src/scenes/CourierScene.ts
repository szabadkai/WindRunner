import Phaser from 'phaser';
import { Boat } from '../objects/Boat';
import { Wind } from '../objects/Wind';
import { Island } from '../objects/Island';
import { DeliveryBoard } from '../objects/DeliveryBoard';
import { IslandGenerator } from '../systems/IslandGenerator';
import { COURIER_CONFIG } from '../config';
import { CourierUIScene } from './CourierUIScene';

export class CourierScene extends Phaser.Scene {
  private boat!: Boat;
  private wind!: Wind;
  private islands: Island[] = [];
  private deliveryBoard!: DeliveryBoard;
  private water!: Phaser.GameObjects.TileSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private sessionTime: number = 0;
  private isSessionActive: boolean = false;
  private earnings: number = 0;
  
  // State for interaction
  private dockedIsland: Island | null = null;

  constructor() {
    super('CourierScene');
  }

  create() {
    // 1. World Setup
    // 10x Scale: 12800 x 7200
    this.physics.world.setBounds(0, 0, 12800, 7200);
    this.cameras.main.setBounds(0, 0, 12800, 7200);
    this.cameras.main.setBackgroundColor('#87CEEB');
    
    this.water = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'water')
      .setOrigin(0, 0).setScrollFactor(0);

    // 2. Islands
    this.islands = IslandGenerator.generateIslands(this);

    // 3. Wind
    this.wind = new Wind(this);

    // 4. Boat (Start at Home Island)
    const home = this.islands.find(i => i.id.includes('island_0')) || this.islands[0]; // fallback
    // Actually generator ensures first is home.
    this.boat = new Boat(this, home.x + 60, home.y + 60);

    // 5. Systems
    this.deliveryBoard = new DeliveryBoard(this, this.islands);
    this.deliveryBoard.generateJobs(4, 0);

    // 6. UI
    this.scene.launch('CourierUIScene');
    
    // Camera
    this.cameras.main.startFollow(this.boat);

    // Input
    if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        
        this.input.keyboard.on('keydown-E', () => {
            this.handleInteraction();
        });
        
        // Pause
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.pause();
            this.scene.launch('PauseScene');
        });
    }

    // Start Session
    this.startSession();
  }

  startSession() {
      this.earnings = 0;
      this.sessionTime = COURIER_CONFIG.SESSION_DURATION;
      this.isSessionActive = true;
      // UI will be updated in the main loop
      // this.updateUI();
  }

  update(time: number, delta: number) {
    if (!this.isSessionActive) return;

    // Timer
    this.sessionTime -= delta;
    if (this.sessionTime <= 0) {
        this.endSession();
        return;
    }

    // Process Update
    this.wind.update(time, delta);
    this.boat.update(this.wind, this.cursors); // Touch input passed if added
    this.deliveryBoard.update(COURIER_CONFIG.SESSION_DURATION - this.sessionTime);

    // Water Scroll
    this.water.tilePositionX = this.cameras.main.scrollX;
    this.water.tilePositionY = this.cameras.main.scrollY;

    // Check Docking Status
    this.checkDocking();

    // UI Updates (throttled ideally, but every frame ok for now)
    this.updateUI();
  }

  private checkDocking() {
      // Find nearest island
      let nearest: Island | null = null;
      for (const island of this.islands) {
          if (island.isWithinRange(this.boat.x, this.boat.y, COURIER_CONFIG.DELIVERY_RADIUS)) {
              nearest = island;
              break;
          }
      }

      const ui = this.scene.get('CourierUIScene') as CourierUIScene;

      if (nearest !== this.dockedIsland) {
          this.dockedIsland = nearest;
          if (this.dockedIsland) {
              console.log('Docked at ' + this.dockedIsland.islandName);
              if (ui) ui.showInteractionPrompt(true, `Press E to Dock at ${this.dockedIsland.islandName}`);
          } else {
              if (ui) ui.showInteractionPrompt(false);
          }
      }
  }

  private handleInteraction() {
      if (!this.dockedIsland) return;
      
      // Attempt Delivery First
      this.handleDelivery(this.dockedIsland);

      // Startup Job Pickup logic
      const jobs = this.deliveryBoard.getJobsAtIsland(this.dockedIsland.id);
      if (jobs.length > 0) {
          // Try to pick up as many as possible
          // Currently just one per interaction press for feedback clarity, or fill up.
          let pickedUp = false;
          // Simple loop to fill cargo
          for (const job of jobs) {
              if (this.boat.addCargo(job)) {
                  this.deliveryBoard.removeJob(job.id);
                  console.log('Picked up job: ' + job.description);
                  pickedUp = true;
                  // Don't break, try to get more if space allows (but array might be modified? No, separate list from board)
                  // The board.removeJob modifies the source? getJobsAtIsland returns copy?
                  // Let's assume getJobsAtIsland returns references from a list.
                  // Safer to pick one at a time or handle carefully.
                  break; // Let's pick one per press to be safe and simple for now.
              } else {
                  console.log('Cargo full!');
                  const ui = this.scene.get('CourierUIScene') as CourierUIScene;
                  if (ui) ui.showToast('Cargo Full!', 'error');
                  break;
              }
          }
          
          if (pickedUp) {
               const ui = this.scene.get('CourierUIScene') as CourierUIScene;
               if (ui) ui.showToast('Job Accepted!');
          }
      } else {
          const ui = this.scene.get('CourierUIScene') as CourierUIScene;
          if (ui) ui.showToast('No jobs here.', 'info');
      }
  }

  private handleDelivery(island: Island) {
      // Check boat cargo for items destined here
      const toRemove: string[] = [];
      
      for (const item of this.boat.cargo) {
          if (item.destinationId === island.id) {
              // Delivered!
              this.earnings += item.payout;
              toRemove.push(item.id);
              console.log(`Delivered ${item.description} for $${item.payout}`);
          }
      }

      toRemove.forEach(id => this.boat.removeCargo(id));
  }

  private updateUI() {
      const ui = this.scene.get('CourierUIScene') as CourierUIScene;
      if (ui) {
          ui.updateTimer(this.sessionTime);
          ui.updateEarnings(this.earnings);
          ui.updateCargo(this.boat.cargo);
          ui.updateJobs(this.deliveryBoard.getAllJobs());
      }
  }

  private endSession() {
      this.isSessionActive = false;
      this.boat.speed = 0;
      
      // High Score
      const highScoreStr = localStorage.getItem('courier_highscore');
      let highScore = highScoreStr ? parseInt(highScoreStr) : 0;
      if (this.earnings > highScore) {
          localStorage.setItem('courier_highscore', this.earnings.toString());
          highScore = this.earnings;
      }
      
      // Simple Alert/End Screen in UI
      // Ideally call a method on UIScene to show overlay
      alert(`Session Over!\nEarnings: $${this.earnings}\nHigh Score: $${highScore}`);
      this.scene.start('MenuScene');
  }
}

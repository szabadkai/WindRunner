import Phaser from 'phaser';
import { Cargo } from '../objects/Cargo';
import { Minimap } from '../objects/Minimap';
import { SoundManager } from '../systems/SoundManager';

export class CourierUIScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private earningsText!: Phaser.GameObjects.Text;
  private cargoContainer!: Phaser.GameObjects.Container;
  private jobBoardContainer!: Phaser.GameObjects.Container;
  private jobsList!: Phaser.GameObjects.Container;

  private windShiftText!: Phaser.GameObjects.Text;
  private interactionPrompt!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private windArrow!: Phaser.GameObjects.Graphics;
  private windSpeedText!: Phaser.GameObjects.Text;
  private onboardContainer!: Phaser.GameObjects.Container | null; // Allow null
  private minimap!: Minimap;

  // Onboarding
  private currentOnboardingStep: number = 0;
  private onboardingDescText!: Phaser.GameObjects.Text;
  private onboardingSteps: string[] = [
      "Welcome, Captain! Your goal is to deliver cargo between islands.",
      "Use Arrow Keys to steer. Watch the WIND direction!",
      "Sail to islands to pick up jobs. Press 'E' to dock.",
      "Deliver within the time limit to earn cash!",
      "Good luck!"
  ];

  constructor() {
    super('CourierUIScene');
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Timer (Top Center - Offset Left)
    this.timerText = this.add.text(w / 2 - 100, 20, '06:00', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0);

    // Earnings (Top Center - Offset Right)
    this.earningsText = this.add.text(w / 2 + 100, 20, '$0', {
      fontSize: '32px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5, 0);



    // Cargo Hold (Bottom Left)
    this.createCargoUI();

    // Job Board (Right Side)
    this.createJobBoardUI();

    // Wind Shift Warning
    this.windShiftText = this.add.text(w / 2, 100, 'WIND SHIFT IN 30s!', {
      fontSize: '24px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setVisible(false);

    // Interaction Prompt
    this.interactionPrompt = this.add.text(w / 2, h - 150, '', {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setVisible(false);

    // Toast Notification
    this.toastText = this.add.text(w / 2, h / 2 - 50, '', {
        fontSize: '28px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5).setVisible(false);

    // Wind Indicator (Top Left) - Matching Race Mode
    this.add.text(10, 10, 'WIND', { fontSize: '12px', color: '#aaaaaa' });
    this.windSpeedText = this.add.text(10, 60, '00 kn', { fontSize: '16px', color: '#ffffff' });
    
    // Wind Arrow Graphic
    this.windArrow = this.add.graphics({ x: 30, y: 40 });
    this.drawArrow(this.windArrow, 0xffffff);

    // Minimap (Top Right)
    this.minimap = new Minimap(this, w - 110, 110);
    // Initialize with Islands from CourierScene
    const gameScene = this.scene.get('CourierScene') as any;
    if (gameScene && gameScene.islands) {
        // Need bounds. We know them from scale: 12800x7200
        this.minimap.setupIslands(gameScene.islands, 12800, 7200);
    }

    // Onboarding
    const seen = localStorage.getItem('onboarding_seen');
    if (!seen) {
        this.createOnboarding();
    }
  }

  update() {
     const gameScene = this.scene.get('CourierScene') as any; // Quick cast
     if (gameScene) {
         if (gameScene.wind) {
             this.updateWindIndicator(gameScene.wind.angle, gameScene.wind.speed);
         }
         if (gameScene.boat && this.minimap) {
             this.minimap.updateBoat(gameScene.boat.x, gameScene.boat.y, gameScene.boat.rotation); // rotation is rad or deg? boat.rotation in Phaser is Rad. Minimap wants deg?
             // Let's check Minimap.ts: "Phaser.Math.DegToRad(heading)". 
             // IF inputs heading as Deg, then DegToRad is correct.
             // Boat.ts usually uses `rotation` (radians) or `angle` (degrees).
             // Let's check Boat.ts or assume. Standard Phaser.Sprite.rotation is Rad.
             // If Minimap expects Deg, we convert.
             // Wait, Minimap.ts: "this.boatMarker.setRotation(Phaser.Math.DegToRad(heading));" -> Implies input 'heading' is DEG.
             // Boat.ts rotation is likely Rad. So RadToDeg(boat.rotation).
             this.minimap.updateBoat(gameScene.boat.x, gameScene.boat.y, Phaser.Math.RadToDeg(gameScene.boat.rotation));
         }
     }
  }

  private drawArrow(graphics: Phaser.GameObjects.Graphics, color: number) {
    graphics.clear();
    graphics.lineStyle(2, color);
    graphics.beginPath();
    graphics.moveTo(0, -15);
    graphics.lineTo(0, 15);
    graphics.moveTo(0, 15);
    graphics.lineTo(-5, 10);
    graphics.moveTo(0, 15);
    graphics.lineTo(5, 10);
    graphics.strokePath();
  }

  updateWindIndicator(windAngle: number, windSpeed: number) {
      if (this.windArrow) {
          this.windArrow.setRotation(Phaser.Math.DegToRad(windAngle));
          this.windSpeedText.setText(`${windSpeed.toFixed(1)} kn`);
      }
  }

  private createCargoUI() {
    this.cargoContainer = this.add.container(20, this.cameras.main.height - 100);
    
    const bg = this.add.rectangle(0, 0, 200, 80, 0x000000, 0.5).setOrigin(0, 0);
    this.cargoContainer.add(bg);
    
    const title = this.add.text(10, 5, 'CARGO HOLD', { fontSize: '14px', color: '#aaaaaa' });
    this.cargoContainer.add(title);
    
    // Slots will be populated dynamically
  }

  private createJobBoardUI() {
    const w = this.cameras.main.width;
    // Move down to avoid Minimap overlap (Minimap is at 110, height ~200 -> roughly ends at 210 + margin)
    this.jobBoardContainer = this.add.container(w - 220, 300);
    
    const bg = this.add.rectangle(0, 0, 200, 400, 0x000000, 0.5).setOrigin(0, 0);
    this.jobBoardContainer.add(bg);
    
    const title = this.add.text(10, 5, 'DELIVERIES', { fontSize: '14px', color: '#aaaaaa' });
    this.jobBoardContainer.add(title);
    
    this.jobsList = this.add.container(0, 30);
    this.jobBoardContainer.add(this.jobsList);
  }

  // API called by CourierScene
  updateTimer(timeRemainingMs: number) {
    if (!this.timerText) return;
    const totalSeconds = Math.max(0, Math.floor(timeRemainingMs / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
    
    if (totalSeconds < 30) {
      this.timerText.setColor('#ff0000');
    } else {
      this.timerText.setColor('#ffffff');
    }
  }

  updateEarnings(amount: number) {
    if (this.earningsText) this.earningsText.setText(`$${amount.toLocaleString()}`);
  }

  updateCargo(items: Cargo[]) {
    if (!this.cargoContainer) return;
    // Clear old cargo UI
    // Note: In a real optimized scenario, we'd reuse objects.
    this.cargoContainer.each((child: Phaser.GameObjects.GameObject) => {
        if (child.name === 'cargoItem') child.destroy();
    });

    items.forEach((item, index) => {
        const y = 30 + (index * 25);
        const text = this.add.text(10, y, `📦 ${item.description}`, { fontSize: '12px', color: '#ffffff' });
        text.setName('cargoItem');
        this.cargoContainer.add(text);
    });
  }

  updateJobs(jobs: Cargo[]) {
    if (!this.jobsList) return;
    this.jobsList.removeAll(true);
    
    jobs.forEach((job, index) => {
        const y = index * 60;
        
        // Job Card
        const bg = this.add.rectangle(100, y + 25, 180, 50, 0x333333).setOrigin(0.5);
        this.jobsList.add(bg);
        
        const desc = this.add.text(20, y + 5, job.description, { fontSize: '12px', color: '#ffffff', wordWrap: { width: 170 } });
        this.jobsList.add(desc);
        
        const payout = this.add.text(20, y + 35, `$${job.payout}`, { fontSize: '14px', color: '#00ff00', fontStyle: 'bold' });
        this.jobsList.add(payout);
    });
  }

  showWindWarning(show: boolean) {
    if (!this.windShiftText) return;
    this.windShiftText.setVisible(show);
    if (show) {
        this.tweens.add({
            targets: this.windShiftText,
            alpha: { from: 1, to: 0.5 },
            yoyo: true,
            repeat: -1,
            duration: 500
        });
    } else {
        this.tweens.killTweensOf(this.windShiftText);
    }
  }

  // --- New Methods ---

  showInteractionPrompt(show: boolean, text: string = '') {
      if (!this.interactionPrompt) return;
      this.interactionPrompt.setVisible(show);
      if (show) {
          this.interactionPrompt.setText(text);
      }
  }

  showToast(message: string, type: 'info' | 'error' | 'success' = 'success') {
      if (!this.toastText) return;
      
      const color = type === 'error' ? '#ff0000' : (type === 'success' ? '#00ff00' : '#ffffff');
      this.toastText.setText(message);
      this.toastText.setColor(color);
      this.toastText.setVisible(true);
      this.toastText.setAlpha(1);
      
      this.tweens.killTweensOf(this.toastText);
      this.tweens.add({
          targets: this.toastText,
          alpha: 0,
          duration: 1000,
          delay: 2000,
          onComplete: () => {
              this.toastText.setVisible(false);
          }
      });
  }

  createOnboarding() {
      const w = this.cameras.main.width;
      const h = this.cameras.main.height;
      
      this.onboardContainer = this.add.container(0, 0);
      
      // Blocker
      const blocker = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.8);
      blocker.setInteractive(); // Block clicks
      this.onboardContainer.add(blocker);
      
      const panel = this.add.rectangle(w/2, h/2, 600, 400, 0x222222).setStrokeStyle(4, 0xffffff);
      this.onboardContainer.add(panel);
      
      const title = this.add.text(w/2, h/2 - 150, 'COURIER TRAINING', { fontSize: '32px', color: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);
      this.onboardContainer.add(title);
      
      this.currentOnboardingStep = 0;
      this.onboardingDescText = this.add.text(w/2, h/2, '', { 
          fontSize: '20px', 
          color: '#ffffff', 
          wordWrap: { width: 500 },
          align: 'center'
      }).setOrigin(0.5);
      this.onboardContainer.add(this.onboardingDescText);
      
      const nextBtn = this.add.text(w/2, h/2 + 150, 'NEXT >', {
            fontSize: '24px',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 20, y: 10 },
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        nextBtn.on('pointerover', () => {
             SoundManager.getInstance().playHover();
        });

        nextBtn.on('pointerdown', () => {
            SoundManager.getInstance().playSelect();
            if (this.currentOnboardingStep < this.onboardingSteps.length - 1) {
                this.currentOnboardingStep++;
                this.showOnboardingStep(this.currentOnboardingStep);
            } else {
                this.endOnboarding();
            }
        });
        
        this.onboardContainer.add(nextBtn);

        this.showOnboardingStep(this.currentOnboardingStep);
  }

  private showOnboardingStep(stepIndex: number) {
    if (this.onboardingDescText && this.onboardingSteps && stepIndex < this.onboardingSteps.length) {
        this.onboardingDescText.setText(this.onboardingSteps[stepIndex]);
    }
  }

  private endOnboarding() {
    if (this.onboardContainer) {
        this.onboardContainer.destroy();
        this.onboardContainer = null;
    }
    
    // Save complete
    localStorage.setItem('windrunner_courier_onboarding', 'true');
    
    // Show "Let's Sail!" toast
    this.showToast("You're ready! Check the map for jobs.", 'success');
    // Play success sound? Reuse Select for now.
    SoundManager.getInstance().playSelect();
  }
}

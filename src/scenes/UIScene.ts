import Phaser from 'phaser';
import { Minimap } from '../objects/Minimap';

export class UIScene extends Phaser.Scene {
  private windArrow!: Phaser.GameObjects.Graphics;
  private windSpeedText!: Phaser.GameObjects.Text;
  private boatSpeedText!: Phaser.GameObjects.Text;
  private sailTrimBar!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private waypointText!: Phaser.GameObjects.Text;

  private countdownText!: Phaser.GameObjects.Text;
  private finishContainer!: Phaser.GameObjects.Container;
  private minimap!: Minimap;
  private heelGauge!: Phaser.GameObjects.Graphics;
  private heelText!: Phaser.GameObjects.Text;
  
  private tutorialContainer!: Phaser.GameObjects.Container;

  // Mobile touch control state - analog values from swipe gesture
  // steerInput: -1 (left) to 1 (right) - POSITION based
  // trimDelta: change in trim since last frame - DELTA based
  public touchInput = { steerInput: 0, trimDelta: 0 };
  private touchStartPos: { x: number, y: number } | null = null;

  constructor() {
    super('UIScene');
  }

  create(data: { waypoints?: { x: number, y: number }[] }) {
    // ... existing UI creation ...
    // Wind Indicator (Top Left)
    this.add.text(10, 10, 'WIND', { fontSize: '12px', color: '#aaaaaa' });
    this.windSpeedText = this.add.text(10, 60, '00 kn', { fontSize: '16px', color: '#ffffff' });
    
    // Wind Arrow Graphic
    this.windArrow = this.add.graphics({ x: 30, y: 40 });
    this.drawArrow(this.windArrow, 0xffffff);

    // Timer (Top Center)
    this.timerText = this.add.text(this.cameras.main.width / 2, 20, '00:00', { 
        fontSize: '24px', 
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Speedometer (Bottom Right)
    this.boatSpeedText = this.add.text(
        this.cameras.main.width - 20, 
        this.cameras.main.height - 20, 
        '0.0 kn', 
        { fontSize: '32px', color: '#ffffff' }
    ).setOrigin(1, 1);
    this.add.text(
        this.cameras.main.width - 20, 
        this.cameras.main.height - 55, 
        'SPEED', 
        { fontSize: '12px', color: '#aaaaaa' }
    ).setOrigin(1, 1);

    // Sail Trim (Bottom Left)
    this.add.text(20, this.cameras.main.height - 40, 'SAIL TRIM', { fontSize: '12px', color: '#aaaaaa' });
    // Background bar
    this.add.rectangle(20, this.cameras.main.height - 20, 100, 10, 0x333333).setOrigin(0, 0.5);
    // Foreground bar
    this.sailTrimBar = this.add.graphics({ x: 20, y: this.cameras.main.height - 20 });
    
    // Waypoint Info (Bottom Center)
    this.waypointText = this.add.text(
        this.cameras.main.width / 2, 
        this.cameras.main.height - 20, 
        'Waypoint 1/3', 
        { fontSize: '20px', color: '#ffaa00', fontStyle: 'bold' }
    ).setOrigin(0.5, 1);

    // Heel Indicator (Above Sail Trim)
    this.add.text(20, this.cameras.main.height - 120, 'HEEL', { fontSize: '12px', color: '#aaaaaa' });
    this.heelGauge = this.add.graphics({ x: 60, y: this.cameras.main.height - 85 });
    this.heelText = this.add.text(105, this.cameras.main.height - 85, '0°', { fontSize: '14px', color: '#ffffff' }).setOrigin(0, 0.5);
    this.drawHeelGauge(0);

    // Countdown Text
    this.countdownText = this.add.text(
        this.cameras.main.width / 2, 
        this.cameras.main.height / 2, 
        '', 
        { fontSize: '128px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8 }
    ).setOrigin(0.5);

    // Finish Screen (Hidden)
    this.createFinishScreen();

    // Minimap (Top Right)
    if (data && data.waypoints) {
        this.minimap = new Minimap(this, this.cameras.main.width - 110, 110, data.waypoints);
    }

    // Listen for updates from RaceScene
    const raceScene = this.scene.get('RaceScene');
    raceScene.events.on('updateHUD', this.updateHUD, this);
    raceScene.events.on('raceFinished', this.onRaceFinished, this);
    raceScene.events.on('countdown', this.updateCountdown, this);
    
    // Clean up
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        raceScene.events.off('updateHUD', this.updateHUD, this);
        raceScene.events.off('raceFinished', this.onRaceFinished, this);
        raceScene.events.off('countdown', this.updateCountdown, this);
    });

    // Mobile Touch Controls (only on touch devices)
    if (this.sys.game.device.input.touch) {
        this.createTouchControls();
    }
  }

  private createFinishScreen() {
      this.finishContainer = this.add.container(0, 0).setVisible(false);
      const w = this.cameras.main.width;
      const h = this.cameras.main.height;

      // BG
      const bg = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.8);
      this.finishContainer.add(bg);

      // Text
      const title = this.add.text(w/2, h/2 - 50, 'FINISHED!', { fontSize: '64px', color: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);
      this.finishContainer.add(title);
      
      const timeLabel = this.add.text(w/2, h/2 + 20, 'Time: 00:00.00', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
      timeLabel.setName('timeLabel'); // Tag for update
      this.finishContainer.add(timeLabel);

      // Restart Button
      const btn = this.add.text(w/2, h/2 + 100, 'BACK TO MENU', { 
          fontSize: '24px', 
          backgroundColor: '#ffffff', 
          color: '#000000', 
          padding: { x: 20, y: 10 } 
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      btn.on('pointerdown', () => {
          this.scene.stop('RaceScene');
          this.scene.start('MenuScene');
      });
      this.finishContainer.add(btn);
  }

  private updateCountdown(value: string | number) {
      if (typeof value === 'number') {
          this.countdownText.setText(value.toString());
      } else {
          this.countdownText.setText(value);
      }
      
      this.tweens.add({
          targets: this.countdownText,
          scale: { from: 1.5, to: 1 },
          alpha: { from: 1, to: 0.8 },
          duration: 500,
          ease: 'Back.out'
      });
      
      if (value === '') this.countdownText.setVisible(false);
    else {
        this.countdownText.setVisible(true).setAlpha(1).setScale(1);
        if (value === 'OCS!') {
            this.countdownText.setColor('#ff0000');
            this.tweens.add({
                targets: this.countdownText,
                scale: { from: 1, to: 1.2 },
                yoyo: true,
                repeat: 3,
                duration: 200
            });
        } else {
             this.countdownText.setColor('#ffffff');
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

  private updateHUD(data: { 
      windAngle: number; 
      windSpeed: number; 
      boatSpeed: number; 
      boatHeading: number;
      boatX: number;
      boatY: number;
      sailTrim: number;
      heelAngle: number;
      time: number;
      waypointIndex: number;
      totalWaypoints: number;
  }) {
    // Update Wind
    this.windArrow.setRotation(Phaser.Math.DegToRad(data.windAngle));
    this.windSpeedText.setText(`${data.windSpeed.toFixed(1)} kn`);

    // Update Boat Speed
    this.boatSpeedText.setText(`${data.boatSpeed.toFixed(1)} kn`);
    
    // Update Minimap
    if (this.minimap) {
        this.minimap.updateBoat(data.boatX, data.boatY, data.boatHeading);
    }

    // Update Sail Trim
    this.sailTrimBar.clear();
    this.sailTrimBar.fillStyle(0xffffff);
    this.sailTrimBar.fillRect(0, -5, data.sailTrim, 10); 

    // Update Timer
    const minutes = Math.floor(data.time / 60000);
    const seconds = Math.floor((data.time % 60000) / 1000);
    this.timerText.setText(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );

    // Update Waypoint Text
    if (data.waypointIndex < data.totalWaypoints) {
        this.waypointText.setText(`Waypoint ${data.waypointIndex + 1}/${data.totalWaypoints}`);
    } else {
        this.waypointText.setText('Finished!');
    }

    // Update Heel Gauge
    this.drawHeelGauge(data.heelAngle);
    this.heelText.setText(`${Math.round(data.heelAngle)}°`);
  }

  private onRaceFinished(time: number) {
      this.finishContainer.setVisible(true);
      this.finishContainer.setDepth(100); // Ensure on top
      
      const timeLabel = this.finishContainer.getByName('timeLabel') as Phaser.GameObjects.Text;
      if (timeLabel) {
          const minutes = Math.floor(time / 60000);
          const seconds = Math.floor((time % 60000) / 1000);
          const ms = Math.floor((time % 1000) / 10);
          timeLabel.setText(`Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`);
      }
  }

  /**
   * Draws a color-coded heel gauge showing current heel angle.
   * Green: 15-25° (optimal), Yellow: 10-15° and 25-30° (marginal), Red: <10° and >30° (danger)
   */
  private drawHeelGauge(heelAngle: number) {
    const g = this.heelGauge;
    g.clear();
    
    const radius = 30;
    const startAngle = Math.PI; // Left (180°)
    const maxHeel = 45;
    
    // Helper to convert heel angle to arc position
    const heelToRad = (heel: number) => startAngle - (heel / maxHeel) * Math.PI;
    
    // Draw background arc segments with color coding
    const segments = [
      { start: 0, end: 10, color: 0xff4444 },    // Under-heel (red)
      { start: 10, end: 15, color: 0xffaa00 },   // Marginal low (yellow)
      { start: 15, end: 25, color: 0x44ff44 },   // Optimal (green)
      { start: 25, end: 30, color: 0xffaa00 },   // Marginal high (yellow)
      { start: 30, end: 45, color: 0xff4444 }    // Over-heel (red)
    ];
    
    for (const seg of segments) {
      g.lineStyle(6, seg.color, 0.4);
      g.beginPath();
      g.arc(0, 0, radius, heelToRad(seg.end), heelToRad(seg.start), false);
      g.strokePath();
    }
    
    // Draw needle
    const needleAngle = heelToRad(Math.min(heelAngle, maxHeel));
    g.lineStyle(3, 0xffffff);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(needleAngle) * (radius - 5), -Math.sin(needleAngle) * (radius - 5));
    g.strokePath();
    
    // Center dot
    g.fillStyle(0xffffff);
    g.fillCircle(0, 0, 4);
  }

  /**
   * Creates swipe-based touch controls.
   * Horizontal swipe = rudder (left/right) - resets to 0 on release
   * Vertical swipe = sail trim (up to ease out, down to trim in) - stays on release
   */
  private createTouchControls() {
    const sensitivity = 80; // pixels of movement for full input
    const deadzone = 15; // pixels before input registers
    
    // Create Tutorial Overlay
    this.createTouchTutorial();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchStartPos = { x: pointer.x, y: pointer.y };
      
      // Hide tutorial on first touch
      if (this.tutorialContainer && this.tutorialContainer.visible) {
          this.tweens.add({
              targets: this.tutorialContainer,
              alpha: 0,
              duration: 500,
              onComplete: () => this.tutorialContainer.setVisible(false)
          });
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.touchStartPos || !pointer.isDown) return;
      
      const dx = pointer.x - this.touchStartPos.x;
      
      // Horizontal = steering: positive dx = right
      // Position based (Virtual Joystick) - reset to center on release
      const steerRaw = Math.abs(dx) > deadzone ? (dx - Math.sign(dx) * deadzone) : 0;
      this.touchInput.steerInput = Math.max(-1, Math.min(1, steerRaw / sensitivity));
      
      // Vertical = trim: positive dy (down) = trim in, negative (up) = ease out
      // Delta based (Relative Motion) - motion triggers change, stop holds
      // We use pointer.position - pointer.prevPosition
      const deltaY = pointer.y - pointer.prevPosition.y;
      
      // Trim deadzone: ignore small frame-to-frame movements (jitter)
      const trimDeadzone = 2; 
      const trimSensitivity = 0.2; // Reduced sensitivity (was 0.5)
      
      if (Math.abs(deltaY) > trimDeadzone) {
          // Invert so Up (negative Y) = Ease Out (positive trim)
          this.touchInput.trimDelta = -deltaY * trimSensitivity;
      } else {
          this.touchInput.trimDelta = 0;
      } 
    });

    this.input.on('pointerup', () => {
      this.touchStartPos = null;
      // Rudder returns to center
      this.touchInput.steerInput = 0;
      // trimDelta becomes 0 (no motion = no change)
      this.touchInput.trimDelta = 0;
    });
  }

  private createTouchTutorial() {
      const w = this.cameras.main.width;
      const h = this.cameras.main.height;
      
      this.tutorialContainer = this.add.container(0, 0);
      
      // Dim background
      const bg = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.4);
      this.tutorialContainer.add(bg);
      
      // Icons and Text
      const centerX = w / 2;
      const centerY = h / 2;
      
      // Vertical Swipe Icon (Trim)
      const arrowV = this.add.graphics();
      arrowV.lineStyle(4, 0xffffff);
      arrowV.beginPath();
      arrowV.moveTo(centerX - 100, centerY - 40);
      arrowV.lineTo(centerX - 100, centerY + 40);
      arrowV.moveTo(centerX - 110, centerY - 30);
      arrowV.lineTo(centerX - 100, centerY - 40);
      arrowV.lineTo(centerX - 90, centerY - 30);
      arrowV.moveTo(centerX - 110, centerY + 30);
      arrowV.lineTo(centerX - 100, centerY + 40);
      arrowV.lineTo(centerX - 90, centerY + 30);
      arrowV.strokePath();
      this.tutorialContainer.add(arrowV);
      
      const textTrim = this.add.text(centerX - 100, centerY + 60, 'Swipe Vertical\nSAIL TRIM', { 
          fontSize: '18px', align: 'center', color: '#ffffff', fontStyle: 'bold' 
      }).setOrigin(0.5, 0);
      this.tutorialContainer.add(textTrim);

      // Horizontal Swipe Icon (Steer)
      const arrowH = this.add.graphics();
      arrowH.lineStyle(4, 0xffffff);
      arrowH.beginPath();
      arrowH.moveTo(centerX + 60, centerY);
      arrowH.lineTo(centerX + 140, centerY);
      arrowH.moveTo(centerX + 70, centerY - 10);
      arrowH.lineTo(centerX + 60, centerY);
      arrowH.lineTo(centerX + 70, centerY + 10);
      arrowH.moveTo(centerX + 130, centerY - 10);
      arrowH.lineTo(centerX + 140, centerY);
      arrowH.lineTo(centerX + 130, centerY + 10);
      arrowH.strokePath();
      this.tutorialContainer.add(arrowH);

      const textSteer = this.add.text(centerX + 100, centerY + 60, 'Swipe Horizontal\nRUDDER', { 
          fontSize: '18px', align: 'center', color: '#ffffff', fontStyle: 'bold' 
      }).setOrigin(0.5, 0);
      this.tutorialContainer.add(textSteer);
      
      // General instructions
      const instructions = this.add.text(centerX, h - 100, 'Touch & Drag to Control', {
          fontSize: '24px', color: '#ffff00', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.tutorialContainer.add(instructions);
  }
}



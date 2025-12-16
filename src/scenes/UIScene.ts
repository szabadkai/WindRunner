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
      else this.countdownText.setVisible(true).setAlpha(1).setScale(1);
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
}

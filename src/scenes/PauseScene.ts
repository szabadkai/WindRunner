import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Semi-transparent background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Title
    this.add.text(width / 2, height / 3, 'PAUSED', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Resume Button
    const resumeBtn = this.add.text(width / 2, height / 2, 'RESUME', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerdown', () => {
      this.resumeGame();
    });

    resumeBtn.on('pointerover', () => resumeBtn.setStyle({ fill: '#ffff00' }));
    resumeBtn.on('pointerout', () => resumeBtn.setStyle({ fill: '#ffffff' }));

    // Quit Button
    const quitBtn = this.add.text(width / 2, height / 2 + 80, 'QUIT TO MENU', {
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    quitBtn.on('pointerdown', () => {
      this.scene.stop('RaceScene');
      this.scene.stop('UIScene');
      this.scene.stop('PauseScene');
      this.scene.start('MenuScene');
    });

    quitBtn.on('pointerover', () => quitBtn.setStyle({ fill: '#ff0000' }));
    quitBtn.on('pointerout', () => quitBtn.setStyle({ fill: '#ffffff' }));

    // Input to resume
    this.input.keyboard?.on('keydown-ESC', () => {
        this.resumeGame();
    });
  }

  private resumeGame() {
      this.scene.resume('RaceScene');
      this.scene.stop();
  }
}

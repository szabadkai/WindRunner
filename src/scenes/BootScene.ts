import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load assets here
  }

  create() {
    console.log('BootScene started');

    // Create a simple procedural water texture
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x1a5f7a); // Base water color
    graphics.fillRect(0, 0, 512, 512);
    
    // Add some noise/ripples
    graphics.lineStyle(2, 0x227391, 0.5);
    for (let i = 0; i < 50; i++) {
        const x = Phaser.Math.Between(0, 512);
        const y = Phaser.Math.Between(0, 512);
        const len = Phaser.Math.Between(10, 30);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x + len, y);
        graphics.strokePath();
    }
    
    graphics.generateTexture('water', 512, 512);

    this.scene.start('MenuScene');
  }
}

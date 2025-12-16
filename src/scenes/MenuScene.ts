import Phaser from 'phaser'; // Import Phaser to use types in JSDoc if needed, or just for the class.
import { COURSES } from '../data/courses';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a192f'); // Dark Navy
    
    const { width } = this.cameras.main;

    // Title
    this.add.text(width / 2, 100, 'WINDRUNNER', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
    }).setOrigin(0.5);

    this.add.text(width / 2, 160, 'Sailing Simulator', {
      fontSize: '24px',
      color: '#aaaaff'
    }).setOrigin(0.5);

    // Course Selection
    this.add.text(width / 2, 230, 'SELECT COURSE', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    let yPos = 290;
    COURSES.forEach((course, index) => {
        const btn = this.add.text(width / 2, yPos, course.name.toUpperCase(), {
            fontSize: '28px',
            color: '#aaaaaa',
            backgroundColor: '#00000080',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setColor('#ffffff').setBackgroundColor('#000000aa'));
        btn.on('pointerout', () => btn.setColor('#aaaaaa').setBackgroundColor('#00000080'));
        btn.on('pointerdown', () => this.startGame(index));

        // Display High Score
        const bestTime = localStorage.getItem(`best_time_${index}`);
        if (bestTime) {
            this.add.text(width / 2, yPos + 35, `Best: ${this.formatTime(parseInt(bestTime))}`, {
                fontSize: '16px',
                color: '#00ff00'
            }).setOrigin(0.5);
        }

        yPos += 100;
    });
  }

  startGame(courseIndex: number) {
    this.scene.start('RaceScene', { courseIndex });
  }

  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }
}

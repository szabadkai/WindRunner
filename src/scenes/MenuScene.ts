import { COURSES } from '../data/courses';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SoundManager } from '../systems/SoundManager';
import { AudioSettings } from '../systems/AudioSettings';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a192f'); // Keep Dark Navy
    
    const { width, height } = this.cameras.main;

    AudioSettings.apply(this);

    // Ensure audio contexts unlock on first user input
    const unlockAudio = () => {
        if (this.sound.locked) {
            this.sound.unlock();
        }
        SoundManager.getInstance().unlock();
    };
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);

    const getAudioLabel = () => AudioSettings.isMuted() ? 'Unmute Audio (M)' : 'Mute Audio (M)';
    const toggleAudio = () => {
        AudioSettings.toggle(this);
        audioToggle.setText(getAudioLabel());
    };

    const audioToggle = this.add.text(width - 20, 30, getAudioLabel(), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#64ffda'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    audioToggle.on('pointerover', () => {
        SoundManager.getInstance().playHover();
        audioToggle.setColor('#ffffff');
    });
    audioToggle.on('pointerout', () => audioToggle.setColor('#64ffda'));
    audioToggle.on('pointerdown', () => {
        SoundManager.getInstance().playSelect();
        toggleAudio();
    });

    this.input.keyboard?.on('keydown-M', toggleAudio);

    // Title - Minimal Sans-Serif
    this.add.text(width / 2, 100, 'WINDRUNNER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '72px',
      color: '#ffffff',
      fontStyle: 'bold'
      // No shadow
    }).setOrigin(0.5);

    this.add.text(width / 2, 160, 'Sailing Simulator', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#8899ac',
      letterSpacing: 2
    }).setOrigin(0.5);

    // --- Regatta Mode (Courses) ---
    this.add.text(width / 2, 240, 'REGATTA MODE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#64ffda', // Cyan/Mint
      letterSpacing: 1
    }).setOrigin(0.5);

    let yPos = 280;
    COURSES.forEach((course, index) => {
        const isUnlocked = ProgressionSystem.isCourseUnlocked(index);
        const stars = ProgressionSystem.getStarsForCourse(index);
        
        let color = '#8899ac';
        let text = course.name;
        
        if (!isUnlocked) {
            color = '#445566';
            text = `🔒 ${text}`;
        }

        const btn = this.add.text(width / 2, yPos, text, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: color
        }).setOrigin(0.5);
        
        if (isUnlocked) {
            btn.setInteractive({ useHandCursor: true });
            btn.on('pointerover', () => {
                SoundManager.getInstance().playHover(); // Play Hover
                btn.setColor('#64ffda'); // Highlight
            });
            btn.on('pointerout', () => btn.setColor('#8899ac')); // Normal
            btn.on('pointerdown', () => {
                SoundManager.getInstance().playSelect(); // Play Select
                this.startGame(index);
            });
        }

        // Stars & Score (Subtle)
        if (isUnlocked) {
             // Stars
             if (stars > 0) {
                 const starsText = '★'.repeat(stars); // Solid star
                 this.add.text(width / 2 + btn.width/2 + 15, yPos, starsText, {
                     fontFamily: 'Arial, sans-serif',
                     fontSize: '18px',
                     color: '#ffd700'
                 }).setOrigin(0, 0.5);
             }
             
             // Best Time
            const bestTime = ProgressionSystem.getBestTime(index);
            if (bestTime) {
                this.add.text(width / 2, yPos + 25, `${this.formatTime(bestTime)}`, {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: '#64ffda'
                }).setOrigin(0.5);
                yPos += 30; 
            }
        } else {
             this.add.text(width / 2, yPos + 25, `Requires ${course.unlockStars} ★`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                color: '#445566'
            }).setOrigin(0.5);
             yPos += 30;
        }

        yPos += 50;
    });

    // --- Courier Mode ---
    const courierY = Math.max(yPos + 50, height - 80);
    
    // Minimal Separator
    // Simple line is fine, or just spacing. Let's use spacing.

    this.add.text(width / 2, courierY - 30, 'FREE ROAM', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#64ffda',
      letterSpacing: 1
    }).setOrigin(0.5);

    const courierBtn = this.add.text(width / 2, courierY, 'Courier Mode', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
    
    courierBtn.on('pointerover', () => {
        SoundManager.getInstance().playHover(); // Play Hover
        courierBtn.setColor('#64ffda');
    });
    courierBtn.on('pointerout', () => courierBtn.setColor('#ffffff'));
    courierBtn.on('pointerdown', () => {
        SoundManager.getInstance().playSelect(); // Play Select
        this.scene.start('CourierScene');
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

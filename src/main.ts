import './style.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { RaceScene } from './scenes/RaceScene';
import { UIScene } from './scenes/UIScene';
import { MenuScene } from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';
import { CourierScene } from './scenes/CourierScene';
import { CourierUIScene } from './scenes/CourierUIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'app',
  backgroundColor: '#87CEEB',
  scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false
    }
  },
  audio: {
    disableWebAudio: false,
    noAudio: false
  },
  scene: [BootScene, MenuScene, RaceScene, UIScene, PauseScene, CourierScene, CourierUIScene]
};

new Phaser.Game(config);

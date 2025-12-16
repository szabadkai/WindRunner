import './style.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { RaceScene } from './scenes/RaceScene';
import { UIScene } from './scenes/UIScene';
import { MenuScene } from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';

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
  scene: [BootScene, MenuScene, RaceScene, UIScene, PauseScene] // Order matters for update loop? Not really for scenes.
};

new Phaser.Game(config);

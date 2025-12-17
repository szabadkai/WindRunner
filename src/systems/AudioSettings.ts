import Phaser from 'phaser';
import { SoundManager } from './SoundManager';

/**
 * Centralizes mute state and persistence.
 */
export class AudioSettings {
  private static storageKey = 'audioMuted';

  public static isMuted(): boolean {
    try {
      return localStorage.getItem(AudioSettings.storageKey) === 'true';
    } catch {
      return false;
    }
  }

  public static setMuted(muted: boolean, scene?: Phaser.Scene) {
    try {
      localStorage.setItem(AudioSettings.storageKey, String(muted));
    } catch {
      // Ignore storage failures (private browsing, etc.)
    }
    if (scene) {
      scene.sound.mute = muted;
    }
    SoundManager.getInstance().setMuted(muted);
  }

  public static apply(scene: Phaser.Scene) {
    const muted = AudioSettings.isMuted();
    scene.sound.mute = muted;
    SoundManager.getInstance().setMuted(muted);
  }

  public static toggle(scene: Phaser.Scene) {
    AudioSettings.setMuted(!AudioSettings.isMuted(), scene);
  }
}

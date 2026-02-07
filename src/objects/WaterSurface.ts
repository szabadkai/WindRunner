import Phaser from 'phaser';
import { WaterPipeline } from '../shaders/WaterPipeline';
import { PHYSICS_CONFIG } from '../config';
import { Wind } from './Wind';
import { Boat } from './Boat';
import { WaterFlowMap } from '../systems/WaterFlowMap';

export class WaterSurface {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.TileSprite;
  private pipeline: WaterPipeline | null = null;
  private flowMap: WaterFlowMap;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cam = scene.cameras.main;

    this.sprite = scene.add.tileSprite(0, 0, cam.width, cam.height, 'water')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-10);

    this.flowMap = new WaterFlowMap(scene, 128, 128, `${scene.scene.key}_flow`);
    this.initPipeline();
  }

  private initPipeline() {
    const renderer = this.scene.game.renderer;
    if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;

    if (!renderer.pipelines.has('WaterPipeline')) {
      renderer.pipelines.add('WaterPipeline', new WaterPipeline(this.scene.game));
    }

    const pipe = renderer.pipelines.get('WaterPipeline');
    if (pipe instanceof WaterPipeline) {
      this.pipeline = pipe;
      this.sprite.setPipeline('WaterPipeline');
    }
  }

  update(time: number, delta: number, wind: Wind, boat?: Boat) {
    const camera = this.scene.cameras.main;
    this.sprite.tilePositionX = camera.scrollX;
    this.sprite.tilePositionY = camera.scrollY;
    this.flowMap.update(delta, wind, boat);

    if (!this.pipeline) return;

    this.pipeline
      .setWaveTime(time / 1000)
      .setWind(wind.angle, wind.speed, PHYSICS_CONFIG.WIND_SPEED_MAX)
      .setBoatState(boat ? boat.heading : 0, boat ? boat.speed : 0, PHYSICS_CONFIG.MAX_BOAT_SPEED)
      .setFlowTexture(this.flowMap.getTexture())
      .setFlowIntensity(this.flowMap.getIntensity());
  }

  destroy() {
    this.flowMap.destroy();
    this.sprite.destroy();
  }
}

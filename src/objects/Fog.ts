import Phaser from 'phaser';
import { FogPipeline } from '../shaders/FogPipeline';
import { Wind } from './Wind';
import { FOG_CONFIG } from '../config';

/**
 * Fog wrapper that manages the fog shader pipeline
 * and updates it based on wind state.
 */
export class Fog {
    private scene: Phaser.Scene;
    private pipeline: FogPipeline | null = null;
    private currentOpacity: number;
    private targetOpacity: number;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.currentOpacity = FOG_CONFIG.OPACITY;
        this.targetOpacity = FOG_CONFIG.OPACITY;
        
        this.initPipeline();
    }

    private initPipeline(): void {
        const renderer = this.scene.game.renderer;
        
        // Only works with WebGL renderer
        if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) {
            console.warn('Fog shader requires WebGL renderer');
            return;
        }

        // Register the pipeline class if not already registered
        if (!renderer.pipelines.getPostPipeline('FogPipeline')) {
            renderer.pipelines.addPostPipeline('FogPipeline', FogPipeline);
        }

        // Apply pipeline to camera
        this.scene.cameras.main.setPostPipeline('FogPipeline');
        
        // Get the pipeline instance from the camera
        const pipelines = this.scene.cameras.main.getPostPipeline('FogPipeline');
        if (Array.isArray(pipelines) && pipelines.length > 0) {
            this.pipeline = pipelines[0] as FogPipeline;
        } else if (pipelines && !Array.isArray(pipelines)) {
            this.pipeline = pipelines as FogPipeline;
        }
    }

    /**
     * Update fog state - call each frame
     */
    update(time: number, wind: Wind): void {
        if (!this.pipeline) return;

        // Smooth opacity transitions
        const opacityDiff = this.targetOpacity - this.currentOpacity;
        if (Math.abs(opacityDiff) > 0.001) {
            this.currentOpacity += opacityDiff * 0.02;
        }

        // Update shader uniforms
        this.pipeline.setFogTime(time / 1000); // Convert to seconds
        this.pipeline.setWindAngle(wind.angle);
        this.pipeline.setWindSpeed(wind.speed);
        this.pipeline.setOpacity(this.currentOpacity);
        this.pipeline.setDriftMultiplier(FOG_CONFIG.DRIFT_MULTIPLIER);
    }

    /**
     * Set target opacity (for smooth transitions)
     */
    setOpacity(value: number): void {
        this.targetOpacity = Phaser.Math.Clamp(value, 0, 1);
    }

    /**
     * Remove fog effect
     */
    destroy(): void {
        this.scene.cameras.main.removePostPipeline('FogPipeline');
    }
}


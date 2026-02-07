/**
 * Interactive Element System
 *
 * Provides base interactive components with consistent hover, active, and focus states.
 * Implements animation configuration and easing functions for professional menu interactions.
 */

import { designTokens } from "./designTokens";
import { colorPalette } from "./designUtils";

/**
 * Interactive element state definitions
 */
export interface InteractiveState {
    color?: string;
    scale?: number;
    alpha?: number;
    rotation?: number;
}

/**
 * Animation configuration for interactive elements
 */
export interface InteractiveAnimation {
    duration: number;
    easing: string;
    delay?: number;
}

/**
 * Complete interactive element configuration
 */
export interface InteractiveElementConfig {
    defaultState: InteractiveState;
    hoverState: InteractiveState;
    activeState: InteractiveState;
    disabledState: InteractiveState;
    focusState?: InteractiveState;
    animation: InteractiveAnimation;
}

/**
 * Easing functions for smooth animations
 */
export const easingFunctions = {
    // Standard easing curves
    linear: "Linear",
    easeOut: "Cubic.easeOut",
    easeIn: "Cubic.easeIn",
    easeInOut: "Cubic.easeInOut",

    // Bounce and elastic effects
    bounceOut: "Bounce.easeOut",
    elasticOut: "Elastic.easeOut",

    // Back easing for subtle overshoot
    backOut: "Back.easeOut",
    backInOut: "Back.easeInOut",

    // Sine easing for smooth, natural motion
    sineOut: "Sine.easeOut",
    sineInOut: "Sine.easeInOut",
} as const;

/**
 * Animation duration presets
 */
export const animationDurations = {
    instant: 0,
    fast: designTokens.animation.durations.fast,
    normal: designTokens.animation.durations.normal,
    slow: designTokens.animation.durations.slow,
} as const;

/**
 * Base interactive element class that provides consistent interaction patterns
 */
export class BaseInteractiveElement {
    protected gameObject:
        | Phaser.GameObjects.Text
        | Phaser.GameObjects.Image
        | Phaser.GameObjects.Container;
    protected config: InteractiveElementConfig;
    protected isEnabled: boolean = true;
    protected currentTween?: Phaser.Tweens.Tween;

    constructor(
        gameObject:
            | Phaser.GameObjects.Text
            | Phaser.GameObjects.Image
            | Phaser.GameObjects.Container,
        config: InteractiveElementConfig
    ) {
        this.gameObject = gameObject;
        this.config = config;
        this.setupInteractivity();
        this.applyState(config.defaultState);
    }

    /**
     * Set up interactive event handlers
     */
    private setupInteractivity(): void {
        this.gameObject.setInteractive({ useHandCursor: true });

        // Hover events
        this.gameObject.on("pointerover", this.onHover, this);
        this.gameObject.on("pointerout", this.onHoverEnd, this);

        // Active/click events
        this.gameObject.on("pointerdown", this.onActive, this);
        this.gameObject.on("pointerup", this.onActiveEnd, this);

        // Focus events (for keyboard navigation)
        if (this.config.focusState) {
            this.gameObject.on("focus", this.onFocus, this);
            this.gameObject.on("blur", this.onBlur, this);
        }
    }

    /**
     * Handle hover start
     */
    protected onHover(): void {
        if (!this.isEnabled) return;
        this.animateToState(this.config.hoverState);
    }

    /**
     * Handle hover end
     */
    protected onHoverEnd(): void {
        if (!this.isEnabled) return;
        this.animateToState(this.config.defaultState);
    }

    /**
     * Handle active/press start
     */
    protected onActive(): void {
        if (!this.isEnabled) return;
        this.animateToState(this.config.activeState);
    }

    /**
     * Handle active/press end
     */
    protected onActiveEnd(): void {
        if (!this.isEnabled) return;
        // Return to hover state if still hovering, otherwise default
        const isHovering =
            this.gameObject.input && "pointerOver" in this.gameObject.input
                ? (this.gameObject.input as any).pointerOver()
                : false;
        const targetState = isHovering
            ? this.config.hoverState
            : this.config.defaultState;
        this.animateToState(targetState);
    }

    /**
     * Handle focus (keyboard navigation)
     */
    protected onFocus(): void {
        if (!this.isEnabled || !this.config.focusState) return;
        this.animateToState(this.config.focusState);
    }

    /**
     * Handle blur (lose focus)
     */
    protected onBlur(): void {
        if (!this.isEnabled) return;
        this.animateToState(this.config.defaultState);
    }

    /**
     * Animate to a specific state
     */
    protected animateToState(state: InteractiveState): void {
        // Stop any existing tween
        if (this.currentTween) {
            this.currentTween.stop();
        }

        const targets: any = {};

        // Build tween targets based on state properties
        if (state.color !== undefined && "setColor" in this.gameObject) {
            // For text objects, we need to handle color differently
            (this.gameObject as Phaser.GameObjects.Text).setColor(state.color);
        }

        if (state.scale !== undefined) {
            targets.scaleX = state.scale;
            targets.scaleY = state.scale;
        }

        if (state.alpha !== undefined) {
            targets.alpha = state.alpha;
        }

        if (state.rotation !== undefined) {
            targets.rotation = state.rotation;
        }

        // Only create tween if we have properties to animate
        if (Object.keys(targets).length > 0) {
            this.currentTween = this.gameObject.scene.tweens.add({
                targets: this.gameObject,
                ...targets,
                duration: this.config.animation.duration,
                ease: this.config.animation.easing,
                delay: this.config.animation.delay || 0,
            });
        }
    }

    /**
     * Apply state immediately without animation
     */
    protected applyState(state: InteractiveState): void {
        if (state.color !== undefined && "setColor" in this.gameObject) {
            (this.gameObject as Phaser.GameObjects.Text).setColor(state.color);
        }

        if (state.scale !== undefined) {
            this.gameObject.setScale(state.scale);
        }

        if (state.alpha !== undefined) {
            this.gameObject.setAlpha(state.alpha);
        }

        if (state.rotation !== undefined) {
            this.gameObject.setRotation(state.rotation);
        }
    }

    /**
     * Enable or disable the interactive element
     */
    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;

        if (enabled) {
            this.gameObject.setInteractive({ useHandCursor: true });
            this.animateToState(this.config.defaultState);
        } else {
            this.gameObject.disableInteractive();
            this.animateToState(this.config.disabledState);
        }
    }

    /**
     * Check if the element is currently enabled
     */
    public getEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Update the configuration
     */
    public updateConfig(newConfig: Partial<InteractiveElementConfig>): void {
        this.config = { ...this.config, ...newConfig };

        // Apply current appropriate state
        if (!this.isEnabled) {
            this.applyState(this.config.disabledState);
        } else {
            this.applyState(this.config.defaultState);
        }
    }

    /**
     * Destroy the interactive element and clean up resources
     */
    public destroy(): void {
        if (this.currentTween) {
            this.currentTween.stop();
        }

        // Remove event listeners
        this.gameObject.off("pointerover", this.onHover, this);
        this.gameObject.off("pointerout", this.onHoverEnd, this);
        this.gameObject.off("pointerdown", this.onActive, this);
        this.gameObject.off("pointerup", this.onActiveEnd, this);

        if (this.config.focusState) {
            this.gameObject.off("focus", this.onFocus, this);
            this.gameObject.off("blur", this.onBlur, this);
        }
    }
}

/**
 * Predefined interactive element configurations for common use cases
 */
export const interactivePresets = {
    /**
     * Standard menu button configuration
     */
    menuButton: (): InteractiveElementConfig => ({
        defaultState: {
            color: colorPalette.text.primary,
            scale: 1.0,
            alpha: 1.0,
        },
        hoverState: {
            color: colorPalette.interactive.hover,
            scale: 1.05,
            alpha: 1.0,
        },
        activeState: {
            color: colorPalette.interactive.active,
            scale: 0.98,
            alpha: 1.0,
        },
        disabledState: {
            color: colorPalette.interactive.disabled,
            scale: 1.0,
            alpha: 0.6,
        },
        focusState: {
            color: colorPalette.interactive.focus,
            scale: 1.02,
            alpha: 1.0,
        },
        animation: {
            duration: animationDurations.normal,
            easing: easingFunctions.easeOut,
        },
    }),

    /**
     * Subtle text link configuration
     */
    textLink: (): InteractiveElementConfig => ({
        defaultState: {
            color: colorPalette.text.secondary,
            scale: 1.0,
            alpha: 1.0,
        },
        hoverState: {
            color: colorPalette.interactive.hover,
            scale: 1.0,
            alpha: 1.0,
        },
        activeState: {
            color: colorPalette.interactive.active,
            scale: 1.0,
            alpha: 0.8,
        },
        disabledState: {
            color: colorPalette.interactive.disabled,
            scale: 1.0,
            alpha: 0.5,
        },
        animation: {
            duration: animationDurations.fast,
            easing: easingFunctions.easeOut,
        },
    }),

    /**
     * Accent button configuration (for primary actions)
     */
    accentButton: (): InteractiveElementConfig => ({
        defaultState: {
            color: colorPalette.text.accent,
            scale: 1.0,
            alpha: 1.0,
        },
        hoverState: {
            color: colorPalette.interactive.hover,
            scale: 1.08,
            alpha: 1.0,
        },
        activeState: {
            color: colorPalette.interactive.active,
            scale: 0.95,
            alpha: 1.0,
        },
        disabledState: {
            color: colorPalette.interactive.disabled,
            scale: 1.0,
            alpha: 0.4,
        },
        focusState: {
            color: colorPalette.interactive.focus,
            scale: 1.05,
            alpha: 1.0,
        },
        animation: {
            duration: animationDurations.normal,
            easing: easingFunctions.backOut,
        },
    }),

    /**
     * Course card configuration (for course selection)
     */
    courseCard: (): InteractiveElementConfig => ({
        defaultState: {
            color: colorPalette.text.primary,
            scale: 1.0,
            alpha: 0.9,
        },
        hoverState: {
            color: colorPalette.interactive.hover,
            scale: 1.02,
            alpha: 1.0,
        },
        activeState: {
            color: colorPalette.interactive.active,
            scale: 0.99,
            alpha: 1.0,
        },
        disabledState: {
            color: colorPalette.interactive.disabled,
            scale: 1.0,
            alpha: 0.5,
        },
        animation: {
            duration: animationDurations.normal,
            easing: easingFunctions.sineOut,
        },
    }),
};

/**
 * Factory function to create interactive elements with consistent patterns
 */
export function createInteractiveElement(
    gameObject:
        | Phaser.GameObjects.Text
        | Phaser.GameObjects.Image
        | Phaser.GameObjects.Container,
    preset: keyof typeof interactivePresets | InteractiveElementConfig,
    customConfig?: Partial<InteractiveElementConfig>
): BaseInteractiveElement {
    let config: InteractiveElementConfig;

    if (typeof preset === "string") {
        config = interactivePresets[preset]();
    } else {
        config = preset;
    }

    // Apply any custom configuration overrides
    if (customConfig) {
        config = {
            ...config,
            ...customConfig,
            defaultState: {
                ...config.defaultState,
                ...customConfig.defaultState,
            },
            hoverState: { ...config.hoverState, ...customConfig.hoverState },
            activeState: { ...config.activeState, ...customConfig.activeState },
            disabledState: {
                ...config.disabledState,
                ...customConfig.disabledState,
            },
            animation: { ...config.animation, ...customConfig.animation },
        };
    }

    return new BaseInteractiveElement(gameObject, config);
}

/**
 * Utility function to create a consistent hover effect for any game object
 */
export function addHoverEffect(
    gameObject: Phaser.GameObjects.GameObject,
    hoverColor: string = colorPalette.interactive.hover,
    defaultColor: string = colorPalette.text.primary,
    duration: number = animationDurations.fast
): void {
    gameObject.setInteractive({ useHandCursor: true });

    gameObject.on("pointerover", () => {
        if ("setColor" in gameObject) {
            (gameObject as any).setColor(hoverColor);
        }

        gameObject.scene.tweens.add({
            targets: gameObject,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: duration,
            ease: easingFunctions.easeOut,
        });
    });

    gameObject.on("pointerout", () => {
        if ("setColor" in gameObject) {
            (gameObject as any).setColor(defaultColor);
        }

        gameObject.scene.tweens.add({
            targets: gameObject,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: duration,
            ease: easingFunctions.easeOut,
        });
    });
}

/**
 * Utility function to validate that interactive elements follow consistent patterns
 */
export function validateInteractivePattern(
    element: BaseInteractiveElement
): boolean {
    // Check if the element has proper states defined
    const config = (element as any).config as InteractiveElementConfig;

    return !!(
        config.defaultState &&
        config.hoverState &&
        config.activeState &&
        config.disabledState &&
        config.animation &&
        config.animation.duration > 0
    );
}

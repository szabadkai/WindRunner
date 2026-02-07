/**
 * Design System Interfaces and Types
 *
 * TypeScript interfaces for design system components used throughout the menu redesign.
 * Provides type safety and consistency for styling and component configuration.
 */

import { designTokens } from "./designTokens";

/**
 * Font definition interface for typography system
 */
export interface FontDefinition {
    family: string;
    weight?: string | number;
    style?: string;
    fallback?: string[];
}

/**
 * Typography configuration interface
 */
export interface TypographyConfig {
    titleFont: FontDefinition;
    subtitleFont: FontDefinition;
    navigationFont: FontDefinition;
    bodyFont: FontDefinition;
    monoFont: FontDefinition;
}

/**
 * Interactive color states for buttons and other interactive elements
 */
export interface InteractiveColors {
    default: string;
    hover: string;
    active: string;
    disabled: string;
    focus: string;
}

/**
 * Text color variations for different contexts
 */
export interface TextColors {
    primary: string;
    secondary: string;
    accent: string;
    disabled: string;
    inverse: string;
}

/**
 * Complete color palette interface
 */
export interface ColorPalette {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    interactive: InteractiveColors;
    text: TextColors;
}

/**
 * Animation configuration interface
 */
export interface AnimationConfig {
    durations: {
        fast: number;
        normal: number;
        slow: number;
    };
    easing: {
        easeOut: string;
        easeInOut: string;
        bounce: string;
    };
}

/**
 * Complete menu design configuration
 */
export interface MenuDesignConfig {
    typography: TypographyConfig;
    colors: ColorPalette;
    spacing: typeof designTokens.spacing;
    animations: AnimationConfig;
}

/**
 * Phaser text style configuration that extends Phaser's built-in text style
 */
export interface PhaserTextStyle
    extends Phaser.Types.GameObjects.Text.TextStyle {
    fontFamily: string;
    fontSize: string | number;
    color: string;
    fontStyle?: string;
    letterSpacing?: number;
    lineSpacing?: number;
}

/**
 * Interactive element state definition
 */
export interface InteractiveState {
    color?: string;
    scale?: number;
    alpha?: number;
    rotation?: number;
}

/**
 * Interactive element animation configuration
 */
export interface InteractiveAnimation {
    duration: number;
    easing: string;
    delay?: number;
}

/**
 * Interactive element configuration for consistent behavior
 */
export interface InteractiveElementConfig {
    style: PhaserTextStyle;
    hoverStyle: Partial<PhaserTextStyle>;
    activeStyle?: Partial<PhaserTextStyle>;
    disabledStyle?: Partial<PhaserTextStyle>;
    animation?: {
        duration: number;
        easing: string;
    };
}

/**
 * Enhanced interactive element configuration with full state support
 */
export interface EnhancedInteractiveElementConfig {
    defaultState: InteractiveState;
    hoverState: InteractiveState;
    activeState: InteractiveState;
    disabledState: InteractiveState;
    focusState?: InteractiveState;
    animation: InteractiveAnimation;
}

/**
 * Layout configuration for consistent spacing and alignment
 */
export interface LayoutConfig {
    padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    alignment: {
        horizontal: "left" | "center" | "right";
        vertical: "top" | "center" | "bottom";
    };
}

/**
 * Course card styling configuration
 */
export interface CourseCardConfig {
    background: string;
    border: {
        color: string;
        width: number;
        radius: number;
    };
    padding: number;
    spacing: number;
    states: {
        unlocked: InteractiveElementConfig;
        locked: PhaserTextStyle;
    };
}

/**
 * Progress indicator styling configuration
 */
export interface ProgressIndicatorConfig {
    stars: {
        color: string;
        size: number;
        spacing: number;
    };
    time: {
        style: PhaserTextStyle;
        format: "mm:ss.ms" | "mm:ss" | "ss.ms";
    };
}

/**
 * Audio control styling configuration
 */
export interface AudioControlConfig {
    position: {
        x: number | "left" | "center" | "right";
        y: number | "top" | "center" | "bottom";
    };
    style: InteractiveElementConfig;
}

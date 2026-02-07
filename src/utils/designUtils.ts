/**
 * Design System Utility Functions
 *
 * Utility functions for consistently applying design tokens throughout the menu system.
 * Provides helpers for typography, colors, spacing, and interactive elements.
 */

import { designTokens } from "./designTokens";
import {
    PhaserTextStyle,
    InteractiveElementConfig,
    ColorPalette,
    TypographyConfig,
    MenuDesignConfig,
} from "./designSystem";
import { FontLoader } from "./fontLoader";
import { meetsWCAGAA } from "./accessibility";

/**
 * Professional typography configuration using web fonts with system fallbacks
 */
export const typography: TypographyConfig = {
    titleFont: {
        family: "Playfair Display",
        weight: "700",
        style: "normal",
        fallback: ["Georgia", "Times New Roman", "Times", "serif"],
    },
    subtitleFont: {
        family: "Inter",
        weight: "300",
        style: "normal",
        fallback: [
            "system-ui",
            "-apple-system",
            "BlinkMacSystemFont",
            "Segoe UI",
            "Roboto",
            "Helvetica Neue",
            "Arial",
            "sans-serif",
        ],
    },
    navigationFont: {
        family: "Inter",
        weight: "400",
        style: "normal",
        fallback: [
            "system-ui",
            "-apple-system",
            "BlinkMacSystemFont",
            "Segoe UI",
            "Roboto",
            "Helvetica Neue",
            "Arial",
            "sans-serif",
        ],
    },
    bodyFont: {
        family: "Inter",
        weight: "400",
        style: "normal",
        fallback: [
            "system-ui",
            "-apple-system",
            "BlinkMacSystemFont",
            "Segoe UI",
            "Roboto",
            "Helvetica Neue",
            "Arial",
            "sans-serif",
        ],
    },
    monoFont: {
        family: "SF Mono",
        weight: "400",
        style: "normal",
        fallback: [
            "Monaco",
            "Inconsolata",
            "Roboto Mono",
            "Consolas",
            "Courier New",
            "monospace",
        ],
    },
};

/**
 * Professional color palette derived from design tokens
 */
export const colorPalette: ColorPalette = {
    background: designTokens.colors.navy[900], // Dark navy background
    primary: designTokens.colors.navy[500], // Base navy for primary elements
    secondary: designTokens.colors.gray[400], // Medium gray for secondary elements
    accent: designTokens.colors.gold[500], // Gold for accents and highlights
    interactive: {
        default: designTokens.colors.gray[300], // Light gray for default interactive state
        hover: designTokens.colors.gold[400], // Gold hover state
        active: designTokens.colors.gold[600], // Darker gold for active state
        disabled: designTokens.colors.gray[600], // Dark gray for disabled state
        focus: designTokens.colors.gold[300], // Light gold for focus state
    },
    text: {
        primary: designTokens.colors.gray[50], // Almost white for primary text
        secondary: designTokens.colors.gray[400], // Medium gray for secondary text
        accent: designTokens.colors.gold[400], // Gold for accent text
        disabled: designTokens.colors.gray[600], // Dark gray for disabled text
        inverse: designTokens.colors.navy[900], // Dark navy for text on light backgrounds
    },
};

/**
 * Complete menu design configuration
 */
export const menuDesignConfig: MenuDesignConfig = {
    typography,
    colors: colorPalette,
    spacing: designTokens.spacing,
    animations: designTokens.animation,
};

/**
 * Creates a Phaser text style object from design system tokens
 */
export function createTextStyle(
    fontSize: keyof typeof designTokens.typography.scale,
    color: string,
    fontDefinition?: TypographyConfig[keyof TypographyConfig],
    options?: Partial<PhaserTextStyle>
): PhaserTextStyle {
    const fontDef = fontDefinition || typography.bodyFont;
    const fontLoader = FontLoader.getInstance();

    const baseStyle: PhaserTextStyle = {
        fontFamily: fontLoader.createFontFamilyString(fontDef),
        fontSize: `${designTokens.typography.scale[fontSize]}px`,
        color: color,
        ...options,
    };

    return baseStyle;
}

/**
 * Creates a title text style with proper typography hierarchy
 */
export function createTitleStyle(
    options?: Partial<PhaserTextStyle>
): PhaserTextStyle {
    return createTextStyle(
        "display",
        colorPalette.text.primary,
        typography.titleFont,
        {
            letterSpacing: designTokens.typography.letterSpacing.wide,
            ...options,
        }
    );
}

/**
 * Creates a subtitle text style that complements the title
 */
export function createSubtitleStyle(
    options?: Partial<PhaserTextStyle>
): PhaserTextStyle {
    return createTextStyle(
        "xl",
        colorPalette.text.secondary,
        typography.subtitleFont,
        {
            letterSpacing: designTokens.typography.letterSpacing.wider,
            ...options,
        }
    );
}

/**
 * Creates a navigation text style for menu buttons
 */
export function createNavigationStyle(
    options?: Partial<PhaserTextStyle>
): PhaserTextStyle {
    return createTextStyle(
        "xxl",
        colorPalette.text.primary,
        typography.navigationFont,
        options
    );
}

/**
 * Creates a body text style for general content
 */
export function createBodyStyle(
    size: keyof typeof designTokens.typography.scale = "base",
    options?: Partial<PhaserTextStyle>
): PhaserTextStyle {
    return createTextStyle(
        size,
        colorPalette.text.secondary,
        typography.bodyFont,
        options
    );
}

/**
 * Creates a monospace text style for time displays
 */
export function createMonospaceStyle(
    size: keyof typeof designTokens.typography.scale = "sm",
    options?: Partial<PhaserTextStyle>
): PhaserTextStyle {
    return createTextStyle(
        size,
        colorPalette.text.accent,
        typography.monoFont,
        options
    );
}

/**
 * Creates an interactive element configuration with consistent hover states
 */
export function createInteractiveConfig(
    baseStyle: PhaserTextStyle,
    options?: {
        hoverColor?: string;
        activeColor?: string;
        disabledColor?: string;
        animationDuration?: keyof typeof designTokens.animation.durations;
    }
): InteractiveElementConfig {
    const config: InteractiveElementConfig = {
        style: baseStyle,
        hoverStyle: {
            color: options?.hoverColor || colorPalette.interactive.hover,
        },
        activeStyle: {
            color: options?.activeColor || colorPalette.interactive.active,
        },
        disabledStyle: {
            color: options?.disabledColor || colorPalette.interactive.disabled,
        },
        animation: {
            duration:
                designTokens.animation.durations[
                    options?.animationDuration || "normal"
                ],
            easing: designTokens.animation.easing.easeOut,
        },
    };

    return config;
}

/**
 * Applies consistent spacing using design tokens
 */
export function getSpacing(size: keyof typeof designTokens.spacing): number {
    return designTokens.spacing[size];
}

/**
 * Gets a color from the design token palette
 */
export function getColor(
    palette: keyof typeof designTokens.colors,
    shade: keyof typeof designTokens.colors.navy
): string {
    return designTokens.colors[palette][shade];
}

/**
 * Creates a section header style for menu categories
 */
export function createSectionHeaderStyle(
    options?: Partial<PhaserTextStyle>
): PhaserTextStyle {
    return createTextStyle(
        "sm",
        colorPalette.text.accent,
        typography.navigationFont,
        {
            letterSpacing: designTokens.typography.letterSpacing.widest,
            ...options,
        }
    );
}

/**
 * Validates that a color meets WCAG AA contrast requirements
 */
export function validateContrast(
    foreground: string,
    background: string,
    isLargeText: boolean = false
): boolean {
    return meetsWCAGAA(foreground, background, isLargeText);
}

/**
 * Creates consistent button styling for different button types
 */
export function createButtonStyle(
    type: "primary" | "secondary" | "accent" | "disabled" = "primary",
    size: keyof typeof designTokens.typography.scale = "xxl"
): InteractiveElementConfig {
    let baseColor: string;
    let hoverColor: string;
    let activeColor: string;

    switch (type) {
        case "primary":
            baseColor = colorPalette.text.primary;
            hoverColor = colorPalette.interactive.hover;
            activeColor = colorPalette.interactive.active;
            break;
        case "secondary":
            baseColor = colorPalette.text.secondary;
            hoverColor = colorPalette.interactive.hover;
            activeColor = colorPalette.interactive.active;
            break;
        case "accent":
            baseColor = colorPalette.text.accent;
            hoverColor = colorPalette.interactive.hover;
            activeColor = colorPalette.interactive.active;
            break;
        case "disabled":
            baseColor = colorPalette.text.disabled;
            hoverColor = colorPalette.text.disabled;
            activeColor = colorPalette.text.disabled;
            break;
    }

    const baseStyle = createTextStyle(
        size,
        baseColor,
        typography.navigationFont
    );

    return createInteractiveConfig(baseStyle, {
        hoverColor,
        activeColor,
        disabledColor: colorPalette.text.disabled,
    });
}

/**
 * Initialize the typography system by loading all web fonts
 */
export async function initializeTypography(): Promise<void> {
    const fontLoader = FontLoader.getInstance();

    try {
        const results = await fontLoader.loadAllWebFonts();

        // Log font loading results for debugging
        results.forEach((result) => {
            if (result.success) {
                console.log(`✓ Font loaded: ${result.family}`);
            } else {
                console.warn(
                    `✗ Font failed to load: ${result.family} - ${result.error}`
                );
            }
        });
    } catch (error) {
        console.warn("Typography initialization failed:", error);
        // Continue with system fonts as fallback
    }
}

/**
 * Check if the typography system is ready (fonts loaded)
 */
export function isTypographyReady(): boolean {
    const fontLoader = FontLoader.getInstance();

    // Check if at least the primary fonts are available
    return (
        fontLoader.isFontAvailable(typography.titleFont.family) ||
        fontLoader.isFontAvailable(typography.navigationFont.family)
    );
}

/**
 * Creates a professional audio control button with consistent design system styling
 */
export function createAudioControlStyle(
    options?: Partial<PhaserTextStyle>
): PhaserTextStyle {
    return createTextStyle(
        "base",
        colorPalette.text.secondary,
        typography.bodyFont,
        {
            letterSpacing: designTokens.typography.letterSpacing.normal,
            ...options,
        }
    );
}

/**
 * Creates an interactive configuration specifically for audio controls
 */
export function createAudioControlConfig() {
    return {
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
            duration: designTokens.animation.durations.fast,
            easing: designTokens.animation.easing.easeOut,
        },
    };
}

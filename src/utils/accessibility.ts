/**
 * Accessibility Utilities
 *
 * Utilities for ensuring WCAG AA compliance, keyboard navigation,
 * and proper touch target sizes for mobile devices.
 */

import { designTokens } from "./designTokens";

/**
 * Minimum touch target size for mobile devices (in pixels)
 * Based on WCAG 2.1 Level AAA guidelines (44x44px minimum)
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Minimum contrast ratio for WCAG AA compliance
 * - 4.5:1 for normal text (< 18pt or < 14pt bold)
 * - 3:1 for large text (>= 18pt or >= 14pt bold)
 */
export const WCAG_AA_NORMAL_TEXT_RATIO = 4.5;
export const WCAG_AA_LARGE_TEXT_RATIO = 3.0;

/**
 * Focus indicator configuration for keyboard navigation
 */
export interface FocusIndicatorConfig {
    color: string;
    width: number;
    offset: number;
    style: "solid" | "dashed" | "dotted";
}

/**
 * Default focus indicator configuration
 */
export const defaultFocusIndicator: FocusIndicatorConfig = {
    color: designTokens.colors.gold[300], // Light gold for visibility
    width: 2,
    offset: 4,
    style: "solid",
};

/**
 * Converts hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

/**
 * Calculates relative luminance of a color
 * Based on WCAG 2.1 formula
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        const sRGB = c / 255;
        return sRGB <= 0.03928
            ? sRGB / 12.92
            : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function calculateContrastRatio(
    foreground: string,
    background: string
): number {
    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);

    if (!fgRgb || !bgRgb) {
        console.warn(
            `Invalid color format: ${foreground} or ${background}. Expected hex format.`
        );
        return 1; // Worst case contrast
    }

    const fgLuminance = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if a color combination meets WCAG AA standards
 */
export function meetsWCAGAA(
    foreground: string,
    background: string,
    isLargeText: boolean = false
): boolean {
    const ratio = calculateContrastRatio(foreground, background);
    const requiredRatio = isLargeText
        ? WCAG_AA_LARGE_TEXT_RATIO
        : WCAG_AA_NORMAL_TEXT_RATIO;

    return ratio >= requiredRatio;
}

/**
 * Validates that text meets WCAG AA contrast requirements
 */
export function validateTextContrast(
    textColor: string,
    backgroundColor: string,
    fontSize: number,
    isBold: boolean = false
): {
    passes: boolean;
    ratio: number;
    required: number;
    isLargeText: boolean;
} {
    // Large text is >= 18pt (24px) or >= 14pt (18.66px) bold
    const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && isBold);

    const ratio = calculateContrastRatio(textColor, backgroundColor);
    const required = isLargeText
        ? WCAG_AA_LARGE_TEXT_RATIO
        : WCAG_AA_NORMAL_TEXT_RATIO;

    return {
        passes: ratio >= required,
        ratio,
        required,
        isLargeText,
    };
}

/**
 * Ensures a touch target meets minimum size requirements
 */
export function validateTouchTargetSize(
    width: number,
    height: number
): boolean {
    return width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE;
}

/**
 * Calculates the padding needed to meet minimum touch target size
 */
export function calculateTouchTargetPadding(
    currentWidth: number,
    currentHeight: number
): { horizontal: number; vertical: number } {
    const horizontalPadding = Math.max(
        0,
        (MIN_TOUCH_TARGET_SIZE - currentWidth) / 2
    );
    const verticalPadding = Math.max(
        0,
        (MIN_TOUCH_TARGET_SIZE - currentHeight) / 2
    );

    return {
        horizontal: Math.ceil(horizontalPadding),
        vertical: Math.ceil(verticalPadding),
    };
}

/**
 * Adds a focus indicator to a Phaser game object for keyboard navigation
 */
export function addFocusIndicator(
    scene: Phaser.Scene,
    gameObject: Phaser.GameObjects.GameObject & {
        x: number;
        y: number;
        width?: number;
        height?: number;
        displayWidth?: number;
        displayHeight?: number;
    },
    config: Partial<FocusIndicatorConfig> = {}
): Phaser.GameObjects.Graphics {
    const focusConfig = { ...defaultFocusIndicator, ...config };

    // Create a graphics object for the focus indicator
    const focusIndicator = scene.add.graphics();
    focusIndicator.setDepth(1000); // Ensure it's on top
    focusIndicator.setVisible(false);

    // Calculate bounds
    const width = gameObject.width || gameObject.displayWidth || 100;
    const height = gameObject.height || gameObject.displayHeight || 30;

    // Draw focus indicator
    focusIndicator.lineStyle(
        focusConfig.width,
        parseInt(focusConfig.color.replace("#", ""), 16),
        1
    );

    const x = gameObject.x - width / 2 - focusConfig.offset;
    const y = gameObject.y - height / 2 - focusConfig.offset;
    const w = width + focusConfig.offset * 2;
    const h = height + focusConfig.offset * 2;

    focusIndicator.strokeRect(x, y, w, h);

    return focusIndicator;
}

/**
 * Validates all accessibility requirements for a text element
 */
export function validateAccessibility(
    textColor: string,
    backgroundColor: string,
    fontSize: number,
    touchTargetWidth: number,
    touchTargetHeight: number,
    isBold: boolean = false
): {
    contrast: ReturnType<typeof validateTextContrast>;
    touchTarget: boolean;
    allPassed: boolean;
} {
    const contrast = validateTextContrast(
        textColor,
        backgroundColor,
        fontSize,
        isBold
    );
    const touchTarget = validateTouchTargetSize(
        touchTargetWidth,
        touchTargetHeight
    );

    return {
        contrast,
        touchTarget,
        allPassed: contrast.passes && touchTarget,
    };
}

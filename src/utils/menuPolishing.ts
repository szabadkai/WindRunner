/**
 * Menu Polishing Utilities
 *
 * Advanced polishing utilities for fine-tuning spacing, proportions,
 * animation performance, and responsive behavior in the menu system.
 */

import { designTokens } from "./designTokens";
import { colorPalette } from "./designUtils";

/**
 * Performance monitoring for animations
 */
export class AnimationPerformanceMonitor {
    private static instance: AnimationPerformanceMonitor;
    private frameRate: number = 60;
    private isLowPerformance: boolean = false;
    private frameCount: number = 0;
    private lastTime: number = 0;

    static getInstance(): AnimationPerformanceMonitor {
        if (!AnimationPerformanceMonitor.instance) {
            AnimationPerformanceMonitor.instance =
                new AnimationPerformanceMonitor();
        }
        return AnimationPerformanceMonitor.instance;
    }

    /**
     * Monitor frame rate and detect low performance devices
     */
    updateFrameRate(currentTime: number): void {
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
            return;
        }

        const deltaTime = currentTime - this.lastTime;
        this.frameRate = 1000 / deltaTime;
        this.frameCount++;

        // Check performance every 60 frames
        if (this.frameCount >= 60) {
            this.isLowPerformance = this.frameRate < 30;
            this.frameCount = 0;
        }

        this.lastTime = currentTime;
    }

    /**
     * Get optimized animation duration based on performance
     */
    getOptimizedDuration(baseDuration: number): number {
        if (this.isLowPerformance) {
            return Math.max(baseDuration * 0.5, 100); // Reduce duration for low-performance devices
        }
        return baseDuration;
    }

    /**
     * Check if complex animations should be disabled
     */
    shouldUseReducedAnimations(): boolean {
        return this.isLowPerformance;
    }

    /**
     * Get performance-optimized easing function
     */
    getOptimizedEasing(): string {
        if (this.isLowPerformance) {
            return "Linear"; // Use linear easing for better performance
        }
        return designTokens.animation.easing.easeOut;
    }
}

/**
 * Responsive layout utilities for different screen sizes
 */
export class ResponsiveLayoutManager {
    private static instance: ResponsiveLayoutManager;
    private screenWidth: number = 0;
    private screenHeight: number = 0;
    private scaleFactor: number = 1;

    static getInstance(): ResponsiveLayoutManager {
        if (!ResponsiveLayoutManager.instance) {
            ResponsiveLayoutManager.instance = new ResponsiveLayoutManager();
        }
        return ResponsiveLayoutManager.instance;
    }

    /**
     * Update screen dimensions and calculate scale factor
     */
    updateScreenSize(width: number, height: number): void {
        this.screenWidth = width;
        this.screenHeight = height;

        // Calculate scale factor based on screen size
        // Base design is for 1920x1080
        const baseWidth = 1920;
        const baseHeight = 1080;

        const widthScale = width / baseWidth;
        const heightScale = height / baseHeight;

        // Use the smaller scale to ensure everything fits
        this.scaleFactor = Math.min(widthScale, heightScale, 1.2); // Cap at 120%
    }

    /**
     * Get responsive spacing value
     */
    getResponsiveSpacing(
        spacingKey: keyof typeof designTokens.spacing
    ): number {
        const baseSpacing = designTokens.spacing[spacingKey];
        return Math.round(baseSpacing * this.scaleFactor);
    }

    /**
     * Get responsive font size
     */
    getResponsiveFontSize(fontSize: number): number {
        return Math.round(fontSize * this.scaleFactor);
    }

    /**
     * Check if layout should use mobile-optimized spacing
     */
    isMobileLayout(): boolean {
        return this.screenWidth < 768 || this.screenHeight < 600;
    }

    /**
     * Get touch-optimized minimum target size
     */
    getTouchTargetSize(): number {
        if (this.isMobileLayout()) {
            return Math.max(44, 44 * this.scaleFactor); // Minimum 44px for touch
        }
        return 32; // Smaller targets for desktop
    }

    /**
     * Get responsive card width
     */
    getResponsiveCardWidth(baseWidth: number): number {
        const maxWidth = this.screenWidth * 0.9; // Never exceed 90% of screen width
        const scaledWidth = baseWidth * this.scaleFactor;
        return Math.min(scaledWidth, maxWidth);
    }
}

/**
 * Advanced spacing calculator for balanced compositions
 */
export class ProportionalSpacingCalculator {
    /**
     * Calculate optimal spacing between elements based on their sizes
     */
    static calculateOptimalSpacing(
        element1Height: number,
        element2Height: number,
        containerHeight: number
    ): number {
        // Calculate spacing based on element sizes and container
        const averageElementHeight = (element1Height + element2Height) / 2;
        const spacingRatio = averageElementHeight / containerHeight;

        // Select appropriate design token spacing
        if (spacingRatio > 0.3) {
            return designTokens.spacing.xl; // Large elements need more space
        } else if (spacingRatio > 0.2) {
            return designTokens.spacing.lg;
        } else if (spacingRatio > 0.1) {
            return designTokens.spacing.md;
        } else {
            return designTokens.spacing.sm;
        }
    }

    /**
     * Calculate vertical rhythm for text elements
     */
    static calculateVerticalRhythm(
        fontSize: number,
        lineHeight: number
    ): number {
        const baselineGrid = designTokens.spacing.xs; // 4px baseline grid
        const textHeight = fontSize * lineHeight;

        // Round to nearest baseline grid multiple
        return Math.ceil(textHeight / baselineGrid) * baselineGrid;
    }

    /**
     * Get balanced margins for centered layouts
     */
    static getBalancedMargins(
        containerWidth: number,
        contentWidth: number,
        minMargin: number = designTokens.spacing.md
    ): { left: number; right: number } {
        const availableSpace = containerWidth - contentWidth;
        const margin = Math.max(availableSpace / 2, minMargin);

        return {
            left: margin,
            right: margin,
        };
    }
}

/**
 * Animation fallback system for low-performance devices
 */
export class AnimationFallbackSystem {
    private static performanceMonitor =
        AnimationPerformanceMonitor.getInstance();

    /**
     * Create performance-optimized tween configuration
     */
    static createOptimizedTween(
        scene: Phaser.Scene,
        config: Phaser.Types.Tweens.TweenBuilderConfig
    ): Phaser.Tweens.Tween | null {
        const monitor = this.performanceMonitor;

        if (monitor.shouldUseReducedAnimations()) {
            // Skip complex animations on low-performance devices
            if (
                config.scale ||
                config.rotation ||
                config.scaleX ||
                config.scaleY
            ) {
                return null; // Skip scale/rotation animations
            }
        }

        // Optimize duration and easing
        const optimizedConfig = {
            ...config,
            duration: monitor.getOptimizedDuration(config.duration || 250),
            ease: monitor.getOptimizedEasing(),
        };

        return scene.tweens.add(optimizedConfig);
    }

    /**
     * Create fallback static state for animations
     */
    static applyStaticFallback(
        target: any,
        finalState: { [key: string]: any }
    ): void {
        Object.keys(finalState).forEach((key) => {
            if (target[key] !== undefined) {
                target[key] = finalState[key];
            }
        });
    }
}

/**
 * Cross-browser compatibility utilities
 */
export class CrossBrowserCompatibility {
    /**
     * Check if browser supports advanced CSS features
     */
    static supportsAdvancedCSS(): boolean {
        // Check for CSS custom properties support
        if (typeof CSS !== "undefined" && CSS.supports) {
            return CSS.supports("--custom-property", "value");
        }
        return false;
    }

    /**
     * Get browser-compatible font stack
     */
    static getBrowserCompatibleFontStack(primaryFont: string): string {
        const fallbacks = [
            "system-ui",
            "-apple-system",
            "BlinkMacSystemFont",
            "Segoe UI",
            "Roboto",
            "Helvetica Neue",
            "Arial",
            "sans-serif",
        ];

        return `"${primaryFont}", ${fallbacks.join(", ")}`;
    }

    /**
     * Apply browser-specific optimizations
     */
    static applyBrowserOptimizations(scene: Phaser.Scene): void {
        // Enable hardware acceleration where supported
        if (scene.renderer.type === Phaser.WEBGL) {
            // WebGL optimizations - renderer configuration handled by Phaser
            // Additional WebGL-specific optimizations can be added here
        }

        // Optimize for mobile browsers
        if (this.isMobileBrowser()) {
            // Reduce particle effects and complex animations
            scene.physics?.world?.setFPS(30); // Reduce physics FPS on mobile
        }
    }

    /**
     * Detect mobile browser
     */
    static isMobileBrowser(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }
}

/**
 * Design system consistency validator
 */
export class DesignSystemValidator {
    /**
     * Validate that all colors used are from the design system
     */
    static validateColorUsage(colors: string[]): boolean {
        const validColors = [
            ...Object.values(designTokens.colors.navy),
            ...Object.values(designTokens.colors.gold),
            ...Object.values(designTokens.colors.gray),
            ...Object.values(colorPalette.text),
            ...Object.values(colorPalette.interactive),
            colorPalette.background,
            colorPalette.primary,
            colorPalette.secondary,
            colorPalette.accent,
        ];

        return colors.every((color) => validColors.includes(color));
    }

    /**
     * Validate that all spacing values are from the design system
     */
    static validateSpacingUsage(spacingValues: number[]): boolean {
        const validSpacing = Object.values(designTokens.spacing);
        return spacingValues.every((spacing) => validSpacing.includes(spacing));
    }

    /**
     * Validate typography consistency
     */
    static validateTypographyUsage(fontSizes: number[]): boolean {
        const validSizes = Object.values(designTokens.typography.scale);
        return fontSizes.every((size) => validSizes.includes(size));
    }

    /**
     * Generate design system compliance report
     */
    static generateComplianceReport(elements: {
        colors: string[];
        spacing: number[];
        fontSizes: number[];
    }): {
        colorCompliance: boolean;
        spacingCompliance: boolean;
        typographyCompliance: boolean;
        overallCompliance: boolean;
    } {
        const colorCompliance = this.validateColorUsage(elements.colors);
        const spacingCompliance = this.validateSpacingUsage(elements.spacing);
        const typographyCompliance = this.validateTypographyUsage(
            elements.fontSizes
        );

        return {
            colorCompliance,
            spacingCompliance,
            typographyCompliance,
            overallCompliance:
                colorCompliance && spacingCompliance && typographyCompliance,
        };
    }
}

/**
 * Menu Polishing System Tests
 *
 * Tests for the polishing utilities including performance monitoring,
 * responsive layout, and animation fallbacks.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    AnimationPerformanceMonitor,
    ResponsiveLayoutManager,
    ProportionalSpacingCalculator,
    AnimationFallbackSystem,
    CrossBrowserCompatibility,
    DesignSystemValidator,
} from "../menuPolishing";
import { designTokens } from "../designTokens";
import { colorPalette } from "../designUtils";

describe("Menu Polishing System", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("AnimationPerformanceMonitor", () => {
        it("should detect low performance and optimize animations", () => {
            const monitor = AnimationPerformanceMonitor.getInstance();

            // Simulate low frame rate
            let currentTime = 0;
            for (let i = 0; i < 70; i++) {
                currentTime += 50; // 20 FPS (50ms per frame)
                monitor.updateFrameRate(currentTime);
            }

            expect(monitor.shouldUseReducedAnimations()).toBe(true);
            expect(monitor.getOptimizedDuration(250)).toBeLessThan(250);
            expect(monitor.getOptimizedEasing()).toBe("Linear");
        });

        it("should maintain normal performance for high frame rates", () => {
            const monitor = AnimationPerformanceMonitor.getInstance();

            // Simulate high frame rate
            let currentTime = 0;
            for (let i = 0; i < 70; i++) {
                currentTime += 16; // 60+ FPS (16ms per frame)
                monitor.updateFrameRate(currentTime);
            }

            expect(monitor.shouldUseReducedAnimations()).toBe(false);
            expect(monitor.getOptimizedDuration(250)).toBe(250);
            expect(monitor.getOptimizedEasing()).toBe(
                designTokens.animation.easing.easeOut
            );
        });
    });

    describe("ResponsiveLayoutManager", () => {
        it("should calculate responsive spacing correctly", () => {
            const manager = ResponsiveLayoutManager.getInstance();

            // Test desktop size
            manager.updateScreenSize(1920, 1080);
            expect(manager.getResponsiveSpacing("md")).toBe(
                designTokens.spacing.md
            );
            expect(manager.isMobileLayout()).toBe(false);

            // Test mobile size
            manager.updateScreenSize(375, 667);
            expect(manager.isMobileLayout()).toBe(true);
            expect(manager.getTouchTargetSize()).toBeGreaterThanOrEqual(44);
        });

        it("should scale font sizes appropriately", () => {
            const manager = ResponsiveLayoutManager.getInstance();

            manager.updateScreenSize(960, 540); // Half size
            const scaledFont = manager.getResponsiveFontSize(16);
            expect(scaledFont).toBeLessThanOrEqual(16);
        });

        it("should calculate responsive card widths", () => {
            const manager = ResponsiveLayoutManager.getInstance();

            manager.updateScreenSize(800, 600);
            const cardWidth = manager.getResponsiveCardWidth(600);
            expect(cardWidth).toBeLessThanOrEqual(800 * 0.9); // Never exceed 90% of screen
        });
    });

    describe("ProportionalSpacingCalculator", () => {
        it("should calculate optimal spacing based on element sizes", () => {
            const spacing1 =
                ProportionalSpacingCalculator.calculateOptimalSpacing(
                    100,
                    50,
                    500
                );
            const spacing2 =
                ProportionalSpacingCalculator.calculateOptimalSpacing(
                    200,
                    150,
                    500
                );

            // Larger elements should get more spacing
            expect(spacing2).toBeGreaterThanOrEqual(spacing1);

            // Should return valid design token values
            const validSpacing = Object.values(designTokens.spacing);
            expect(validSpacing).toContain(spacing1);
            expect(validSpacing).toContain(spacing2);
        });

        it("should calculate vertical rhythm correctly", () => {
            const rhythm =
                ProportionalSpacingCalculator.calculateVerticalRhythm(16, 1.5);

            // Should be a multiple of the baseline grid (4px)
            expect(rhythm % designTokens.spacing.xs).toBe(0);
            expect(rhythm).toBeGreaterThanOrEqual(16 * 1.5);
        });

        it("should calculate balanced margins", () => {
            const margins = ProportionalSpacingCalculator.getBalancedMargins(
                800,
                600,
                16
            );

            expect(margins.left).toBe(margins.right);
            expect(margins.left).toBeGreaterThanOrEqual(16);
            expect(margins.left + margins.right + 600).toBeLessThanOrEqual(800);
        });
    });

    describe("AnimationFallbackSystem", () => {
        it("should create optimized tweens", () => {
            const mockScene = {
                tweens: {
                    add: vi.fn().mockReturnValue({}),
                },
            } as any;

            const config = {
                targets: {},
                duration: 250,
                alpha: 1,
            };

            const tween = AnimationFallbackSystem.createOptimizedTween(
                mockScene,
                config
            );

            if (tween) {
                expect(mockScene.tweens.add).toHaveBeenCalled();
            }
        });

        it("should apply static fallbacks", () => {
            const target = { alpha: 0, scale: 0.5 };
            const finalState = { alpha: 1, scale: 1 };

            AnimationFallbackSystem.applyStaticFallback(target, finalState);

            expect(target.alpha).toBe(1);
            expect(target.scale).toBe(1);
        });
    });

    describe("CrossBrowserCompatibility", () => {
        it("should detect mobile browsers", () => {
            // Mock user agent for mobile
            Object.defineProperty(navigator, "userAgent", {
                value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
                configurable: true,
            });

            expect(CrossBrowserCompatibility.isMobileBrowser()).toBe(true);
        });

        it("should create browser-compatible font stacks", () => {
            const fontStack =
                CrossBrowserCompatibility.getBrowserCompatibleFontStack(
                    "Inter"
                );

            expect(fontStack).toContain("Inter");
            expect(fontStack).toContain("system-ui");
            expect(fontStack).toContain("sans-serif");
        });
    });

    describe("DesignSystemValidator", () => {
        it("should validate color usage", () => {
            const validColors = [
                colorPalette.text.primary,
                colorPalette.background,
                designTokens.colors.navy[500],
            ];

            const invalidColors = [
                "#ff0000", // Not in design system
                "rgb(255, 0, 0)", // Not in design system
            ];

            expect(DesignSystemValidator.validateColorUsage(validColors)).toBe(
                true
            );
            expect(
                DesignSystemValidator.validateColorUsage(invalidColors)
            ).toBe(false);
        });

        it("should validate spacing usage", () => {
            const validSpacing = [
                designTokens.spacing.xs,
                designTokens.spacing.md,
                designTokens.spacing.xl,
            ];

            const invalidSpacing = [7, 13, 99]; // Not in design system

            expect(
                DesignSystemValidator.validateSpacingUsage(validSpacing)
            ).toBe(true);
            expect(
                DesignSystemValidator.validateSpacingUsage(invalidSpacing)
            ).toBe(false);
        });

        it("should validate typography usage", () => {
            const validSizes = [
                designTokens.typography.scale.base,
                designTokens.typography.scale.lg,
                designTokens.typography.scale.display,
            ];

            const invalidSizes = [15, 17, 99]; // Not in design system

            expect(
                DesignSystemValidator.validateTypographyUsage(validSizes)
            ).toBe(true);
            expect(
                DesignSystemValidator.validateTypographyUsage(invalidSizes)
            ).toBe(false);
        });

        it("should generate compliance reports", () => {
            const elements = {
                colors: [colorPalette.text.primary, colorPalette.background],
                spacing: [designTokens.spacing.md, designTokens.spacing.lg],
                fontSizes: [
                    designTokens.typography.scale.base,
                    designTokens.typography.scale.xl,
                ],
            };

            const report =
                DesignSystemValidator.generateComplianceReport(elements);

            expect(report.colorCompliance).toBe(true);
            expect(report.spacingCompliance).toBe(true);
            expect(report.typographyCompliance).toBe(true);
            expect(report.overallCompliance).toBe(true);
        });

        it("should detect non-compliant elements in reports", () => {
            const elements = {
                colors: [colorPalette.text.primary, "#ff0000"], // One invalid color
                spacing: [designTokens.spacing.md, 99], // One invalid spacing
                fontSizes: [designTokens.typography.scale.base], // Valid
            };

            const report =
                DesignSystemValidator.generateComplianceReport(elements);

            expect(report.colorCompliance).toBe(false);
            expect(report.spacingCompliance).toBe(false);
            expect(report.typographyCompliance).toBe(true);
            expect(report.overallCompliance).toBe(false);
        });
    });
});

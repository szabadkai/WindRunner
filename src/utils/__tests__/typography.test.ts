/**
 * Typography System Property-Based Tests
 *
 * Property-based tests for the typography system to ensure consistency,
 * proper font application, and adherence to design system standards.
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import {
    createTitleStyle,
    createSubtitleStyle,
    createNavigationStyle,
    createBodyStyle,
    createMonospaceStyle,
    typography,
    colorPalette,
    initializeTypography,
} from "../designUtils";
import { designTokens } from "../designTokens";
import { FontLoader } from "../fontLoader";

describe("Typography System Property Tests", () => {
    beforeAll(async () => {
        // Initialize typography system before running tests
        await initializeTypography();
    });

    /**
     * **Feature: professional-menu-redesign, Property 1: Typography consistency**
     * **Validates: Requirements 1.1**
     *
     * For any text element in the menu, it should use fonts from the defined
     * typography system and meet minimum readability standards
     */
    it("Property 1: Typography consistency - all text elements use defined typography system", () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant("xs"),
                    fc.constant("sm"),
                    fc.constant("base"),
                    fc.constant("lg"),
                    fc.constant("xl"),
                    fc.constant("xxl"),
                    fc.constant("xxxl"),
                    fc.constant("display")
                ),
                fc
                    .string({ minLength: 6, maxLength: 6 })
                    .map((hex) => `#${hex}`),
                (fontSize, _color) => {
                    // Test with different typography configurations
                    const titleStyle = createTitleStyle();
                    const subtitleStyle = createSubtitleStyle();
                    const navigationStyle = createNavigationStyle();
                    const bodyStyle = createBodyStyle(fontSize);
                    const monoStyle = createMonospaceStyle(fontSize);

                    const styles = [
                        titleStyle,
                        subtitleStyle,
                        navigationStyle,
                        bodyStyle,
                        monoStyle,
                    ];

                    // All styles should have valid font families from our typography system
                    styles.forEach((style) => {
                        expect(style.fontFamily).toBeDefined();
                        expect(typeof style.fontFamily).toBe("string");
                        expect(style.fontFamily.length).toBeGreaterThan(0);

                        // Font family should contain at least one font from our typography system
                        const hasValidFont =
                            style.fontFamily.includes(
                                typography.titleFont.family
                            ) ||
                            style.fontFamily.includes(
                                typography.subtitleFont.family
                            ) ||
                            style.fontFamily.includes(
                                typography.navigationFont.family
                            ) ||
                            style.fontFamily.includes(
                                typography.bodyFont.family
                            ) ||
                            style.fontFamily.includes(
                                typography.monoFont.family
                            ) ||
                            // Or should have system fallbacks
                            style.fontFamily.includes("sans-serif") ||
                            style.fontFamily.includes("serif") ||
                            style.fontFamily.includes("monospace");

                        expect(hasValidFont).toBe(true);

                        // Should have valid font size
                        expect(style.fontSize).toBeDefined();
                        expect(typeof style.fontSize).toBe("string");
                        expect(style.fontSize).toMatch(/^\d+px$/);

                        // Should have valid color
                        expect(style.color).toBeDefined();
                        expect(typeof style.color).toBe("string");
                        expect(style.color.length).toBeGreaterThan(0);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: professional-menu-redesign, Property 9: Title typography distinction**
     * **Validates: Requirements 3.1**
     *
     * For any title element, it should use the designated title font and
     * styling properties from the design system
     */
    it("Property 9: Title typography distinction - title elements use distinctive typography", () => {
        fc.assert(
            fc.property(
                fc.record({
                    letterSpacing: fc
                        .option(
                            fc.float({
                                min: Math.fround(-2),
                                max: Math.fround(5),
                            })
                        )
                        .map((val) => val ?? undefined),
                    lineHeight: fc
                        .option(
                            fc.float({
                                min: Math.fround(0.8),
                                max: Math.fround(2.5),
                            })
                        )
                        .map((val) => val ?? undefined),
                    textAlign: fc
                        .option(
                            fc.oneof(
                                fc.constant("left"),
                                fc.constant("center"),
                                fc.constant("right")
                            )
                        )
                        .map((val) => val ?? undefined),
                }),
                (options) => {
                    const titleStyle = createTitleStyle(options);

                    // Title should use display font size (largest)
                    expect(titleStyle.fontSize).toBe(
                        `${designTokens.typography.scale.display}px`
                    );

                    // Title should use primary text color
                    expect(titleStyle.color).toBe(colorPalette.text.primary);

                    // Title should use title font family or fallback
                    const fontLoader = FontLoader.getInstance();
                    const expectedFontFamily =
                        fontLoader.createFontFamilyString(typography.titleFont);
                    expect(titleStyle.fontFamily).toBe(expectedFontFamily);

                    // Title should have distinctive letter spacing
                    if (titleStyle.letterSpacing !== undefined) {
                        expect(typeof titleStyle.letterSpacing).toBe("number");
                    }

                    // Title should be distinguishable from body text
                    const bodyStyle = createBodyStyle();
                    expect(titleStyle.fontSize).not.toBe(bodyStyle.fontSize);
                    expect(
                        parseInt(String(titleStyle.fontSize))
                    ).toBeGreaterThan(parseInt(String(bodyStyle.fontSize)));
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: professional-menu-redesign, Property 10: Subtitle complementary styling**
     * **Validates: Requirements 3.2**
     *
     * For any subtitle element, it should use styling that complements the title
     * according to the typography hierarchy
     */
    it("Property 10: Subtitle complementary styling - subtitles complement title typography", () => {
        fc.assert(
            fc.property(
                fc.record({
                    letterSpacing: fc
                        .option(
                            fc.float({
                                min: -1,
                                max: 3,
                                noNaN: true,
                            })
                        )
                        .map((val) => val ?? undefined),
                    lineHeight: fc
                        .option(
                            fc.float({
                                min: 1,
                                max: 2,
                                noNaN: true,
                            })
                        )
                        .map((val) => val ?? undefined),
                }),
                (options) => {
                    const titleStyle = createTitleStyle();
                    const subtitleStyle = createSubtitleStyle(options);

                    // Subtitle should be smaller than title
                    const titleSize = parseInt(String(titleStyle.fontSize));
                    const subtitleSize = parseInt(
                        String(subtitleStyle.fontSize)
                    );
                    expect(subtitleSize).toBeLessThan(titleSize);

                    // Subtitle should use secondary text color (different from title)
                    expect(subtitleStyle.color).toBe(
                        colorPalette.text.secondary
                    );
                    expect(subtitleStyle.color).not.toBe(titleStyle.color);

                    // Subtitle should use subtitle font family
                    const fontLoader = FontLoader.getInstance();
                    const expectedFontFamily =
                        fontLoader.createFontFamilyString(
                            typography.subtitleFont
                        );
                    expect(subtitleStyle.fontFamily).toBe(expectedFontFamily);

                    // Subtitle should have appropriate letter spacing for readability
                    if (subtitleStyle.letterSpacing !== undefined) {
                        expect(typeof subtitleStyle.letterSpacing).toBe(
                            "number"
                        );
                        // Letter spacing should be a reasonable value (can be negative for tight spacing)
                        expect(
                            subtitleStyle.letterSpacing
                        ).toBeGreaterThanOrEqual(-5);
                        expect(subtitleStyle.letterSpacing).toBeLessThanOrEqual(
                            10
                        );
                    }

                    // Both title and subtitle should be readable (non-empty, valid styles)
                    expect(titleStyle.fontFamily).toBeDefined();
                    expect(subtitleStyle.fontFamily).toBeDefined();
                    expect(titleStyle.color).toBeDefined();
                    expect(subtitleStyle.color).toBeDefined();
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit tests for edge cases and specific functionality
    describe("Typography System Unit Tests", () => {
        it("should handle font loading gracefully when fonts fail to load", async () => {
            const fontLoader = FontLoader.getInstance();

            // Test with a non-existent font
            const result = await fontLoader.loadFont({
                family: "NonExistentFont",
                weight: "400",
                timeout: 100, // Short timeout to force failure
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it("should provide system font fallbacks when web fonts are unavailable", () => {
            const bodyStyle = createBodyStyle();

            // Should always have a fallback font family
            expect(bodyStyle.fontFamily).toContain("sans-serif");
        });

        it("should maintain consistent font sizes across the typography scale", () => {
            const scales = Object.keys(designTokens.typography.scale) as Array<
                keyof typeof designTokens.typography.scale
            >;

            scales.forEach((scale) => {
                const style = createBodyStyle(scale);
                const expectedSize = `${designTokens.typography.scale[scale]}px`;
                expect(style.fontSize).toBe(expectedSize);
            });
        });

        it("should create valid monospace styles for time displays", () => {
            const monoStyle = createMonospaceStyle();

            expect(monoStyle.fontFamily).toContain("monospace");
            expect(monoStyle.color).toBe(colorPalette.text.accent);
        });
    });
});

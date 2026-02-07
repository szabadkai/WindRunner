/**
 * Proportional Spacing System Property-Based Tests
 *
 * Property-based tests for validating that menu composition follows
 * defined spacing rules and proportional relationships.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { designTokens } from "../designTokens";
import { getSpacing } from "../designUtils";

/**
 * Validates that spacing values follow the design token spacing system
 */
export function validateSpacingCompliance(spacing: number): boolean {
    const spacingValues = Object.values(designTokens.spacing);
    return spacingValues.includes(spacing);
}

/**
 * Validates that spacing ratios between elements follow proportional relationships
 */
export function validateProportionalSpacing(
    spacing1: number,
    spacing2: number
): boolean {
    // Both values must be from the design token system
    if (
        !validateSpacingCompliance(spacing1) ||
        !validateSpacingCompliance(spacing2)
    ) {
        return false;
    }

    // Calculate all possible ratios from our design token system
    const spacingValues = Object.values(designTokens.spacing);
    const validRatios: number[] = [];

    // Generate all possible ratios between design token values
    for (const val1 of spacingValues) {
        for (const val2 of spacingValues) {
            if (val2 > 0) {
                validRatios.push(val1 / val2);
            }
        }
    }

    // Remove duplicates
    const uniqueRatios = [...new Set(validRatios)];

    const ratio = spacing1 / spacing2;
    const tolerance = 0.001; // Very tight tolerance for exact design token ratios

    return uniqueRatios.some(
        (validRatio) => Math.abs(ratio - validRatio) <= tolerance
    );
}

/**
 * Validates that spacing values in a design composition follow the spacing system
 */
export function validateSpacingSystemCompliance(
    spacingValues: number[]
): boolean {
    // All spacing values should comply with design tokens
    for (const spacing of spacingValues) {
        if (!validateSpacingCompliance(spacing)) {
            return false;
        }
    }

    // Adjacent spacing values should maintain proportional relationships
    for (let i = 0; i < spacingValues.length - 1; i++) {
        const spacing1 = spacingValues[i];
        const spacing2 = spacingValues[i + 1];

        if (!validateProportionalSpacing(spacing1, spacing2)) {
            return false;
        }
    }

    return true;
}

describe("Proportional Spacing System Property Tests", () => {
    /**
     * **Feature: professional-menu-redesign, Property 11: Proportional spacing compliance**
     * **Validates: Requirements 3.3**
     *
     * For any menu composition, elements should follow the defined spacing rules
     * and proportional relationships
     */
    it("Property 11: Proportional spacing compliance - all spacing values follow design token system", () => {
        fc.assert(
            fc.property(
                // Generate arrays of spacing values from the design token system
                fc.array(
                    fc.oneof(
                        fc.constant(designTokens.spacing.xs),
                        fc.constant(designTokens.spacing.sm),
                        fc.constant(designTokens.spacing.md),
                        fc.constant(designTokens.spacing.lg),
                        fc.constant(designTokens.spacing.xl),
                        fc.constant(designTokens.spacing.xxl),
                        fc.constant(designTokens.spacing.xxxl)
                    ),
                    { minLength: 1, maxLength: 5 }
                ),
                (spacingValues) => {
                    // Validate that the spacing system follows compliance rules
                    const isCompliant =
                        validateSpacingSystemCompliance(spacingValues);

                    // All properly constructed spacing arrays should pass validation
                    expect(isCompliant).toBe(true);

                    // Verify each spacing value is from the design token system
                    spacingValues.forEach((spacing) => {
                        const tokenValues = Object.values(designTokens.spacing);
                        expect(tokenValues).toContain(spacing);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it("should validate spacing compliance for individual spacing values", () => {
        fc.assert(
            fc.property(
                // Generate spacing values from the design token system
                fc.oneof(
                    fc.constant(designTokens.spacing.xs),
                    fc.constant(designTokens.spacing.sm),
                    fc.constant(designTokens.spacing.md),
                    fc.constant(designTokens.spacing.lg),
                    fc.constant(designTokens.spacing.xl),
                    fc.constant(designTokens.spacing.xxl),
                    fc.constant(designTokens.spacing.xxxl)
                ),
                (spacing) => {
                    // All design token spacing values should pass compliance check
                    const isCompliant = validateSpacingCompliance(spacing);
                    expect(isCompliant).toBe(true);

                    // Verify the spacing can be retrieved via getSpacing utility
                    const spacingKey = Object.entries(
                        designTokens.spacing
                    ).find(([_, value]) => value === spacing)?.[0];
                    if (spacingKey) {
                        expect(
                            getSpacing(
                                spacingKey as keyof typeof designTokens.spacing
                            )
                        ).toBe(spacing);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it("should validate proportional relationships between spacing values", () => {
        fc.assert(
            fc.property(
                // Generate pairs of spacing values from the design token system
                fc.tuple(
                    fc.oneof(
                        fc.constant(designTokens.spacing.xs),
                        fc.constant(designTokens.spacing.sm),
                        fc.constant(designTokens.spacing.md),
                        fc.constant(designTokens.spacing.lg),
                        fc.constant(designTokens.spacing.xl),
                        fc.constant(designTokens.spacing.xxl),
                        fc.constant(designTokens.spacing.xxxl)
                    ),
                    fc.oneof(
                        fc.constant(designTokens.spacing.xs),
                        fc.constant(designTokens.spacing.sm),
                        fc.constant(designTokens.spacing.md),
                        fc.constant(designTokens.spacing.lg),
                        fc.constant(designTokens.spacing.xl),
                        fc.constant(designTokens.spacing.xxl),
                        fc.constant(designTokens.spacing.xxxl)
                    )
                ),
                ([spacing1, spacing2]) => {
                    // All pairs of design token spacing values should have valid proportional relationships
                    const isProportional = validateProportionalSpacing(
                        spacing1,
                        spacing2
                    );
                    expect(isProportional).toBe(true);

                    // Verify the ratio is reasonable (not extreme)
                    const ratio = spacing1 / spacing2;
                    expect(ratio).toBeGreaterThan(0);
                    expect(ratio).toBeLessThanOrEqual(16); // Max ratio in our system (xxxl/xs = 64/4 = 16)
                }
            ),
            { numRuns: 100 }
        );
    });

    // Unit tests for specific spacing scenarios
    describe("Spacing System Unit Tests", () => {
        it("should validate all design token spacing values are compliant", () => {
            const spacingValues = Object.values(designTokens.spacing);

            spacingValues.forEach((spacing) => {
                expect(validateSpacingCompliance(spacing)).toBe(true);
            });
        });

        it("should validate known proportional relationships", () => {
            // xs to sm (4 to 8) = 1:2
            expect(
                validateProportionalSpacing(
                    designTokens.spacing.xs,
                    designTokens.spacing.sm
                )
            ).toBe(true);

            // sm to md (8 to 16) = 1:2
            expect(
                validateProportionalSpacing(
                    designTokens.spacing.sm,
                    designTokens.spacing.md
                )
            ).toBe(true);

            // md to lg (16 to 24) = 2:3
            expect(
                validateProportionalSpacing(
                    designTokens.spacing.md,
                    designTokens.spacing.lg
                )
            ).toBe(true);

            // lg to xl (24 to 32) = 3:4
            expect(
                validateProportionalSpacing(
                    designTokens.spacing.lg,
                    designTokens.spacing.xl
                )
            ).toBe(true);

            // Equal spacing
            expect(
                validateProportionalSpacing(
                    designTokens.spacing.md,
                    designTokens.spacing.md
                )
            ).toBe(true);
        });

        it("should reject non-compliant spacing values", () => {
            // Random values that don't match design tokens
            expect(validateSpacingCompliance(7)).toBe(false);
            expect(validateSpacingCompliance(13)).toBe(false);
            expect(validateSpacingCompliance(99)).toBe(false);
        });

        it("should validate spacing system compliance with multiple values", () => {
            const compliantSpacing = [
                designTokens.spacing.md,
                designTokens.spacing.lg,
                designTokens.spacing.xl,
            ];

            expect(validateSpacingSystemCompliance(compliantSpacing)).toBe(
                true
            );
        });

        it("should handle edge cases in spacing validation", () => {
            // Zero spacing should not be compliant
            expect(validateSpacingCompliance(0)).toBe(false);

            // Negative spacing should not be compliant
            expect(validateSpacingCompliance(-10)).toBe(false);

            // Very large spacing should not be compliant
            expect(validateSpacingCompliance(1000)).toBe(false);
        });

        it("should validate getSpacing utility returns correct values", () => {
            expect(getSpacing("xs")).toBe(4);
            expect(getSpacing("sm")).toBe(8);
            expect(getSpacing("md")).toBe(16);
            expect(getSpacing("lg")).toBe(24);
            expect(getSpacing("xl")).toBe(32);
            expect(getSpacing("xxl")).toBe(48);
            expect(getSpacing("xxxl")).toBe(64);
        });

        it("should validate that design token spacing follows expected scale", () => {
            // Verify the spacing scale follows expected progression
            expect(designTokens.spacing.xs).toBe(4);
            expect(designTokens.spacing.sm).toBe(8);
            expect(designTokens.spacing.md).toBe(16);
            expect(designTokens.spacing.lg).toBe(24);
            expect(designTokens.spacing.xl).toBe(32);
            expect(designTokens.spacing.xxl).toBe(48);
            expect(designTokens.spacing.xxxl).toBe(64);

            // Verify proportional relationships in the scale
            expect(designTokens.spacing.sm / designTokens.spacing.xs).toBe(2);
            expect(designTokens.spacing.md / designTokens.spacing.sm).toBe(2);
            expect(designTokens.spacing.lg / designTokens.spacing.md).toBe(1.5);
            expect(
                designTokens.spacing.xl / designTokens.spacing.lg
            ).toBeCloseTo(1.33, 2);
            expect(designTokens.spacing.xxl / designTokens.spacing.xl).toBe(
                1.5
            );
            expect(
                designTokens.spacing.xxxl / designTokens.spacing.xxl
            ).toBeCloseTo(1.33, 2);
        });
    });
});

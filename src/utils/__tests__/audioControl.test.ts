/**
 * Audio Control Integration Tests
 *
 * Property-based tests for audio control integration with the design system.
 * Validates that audio controls use consistent styling patterns.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
    createAudioControlStyle,
    createAudioControlConfig,
    colorPalette,
} from "../designUtils";
import { createInteractiveElement } from "../interactiveElements";
import { designTokens } from "../designTokens";

// Mock Phaser text object
const createMockTextObject = () => ({
    setColor: vi.fn(),
    setScale: vi.fn(),
    setAlpha: vi.fn(),
    setRotation: vi.fn(),
    setInteractive: vi.fn(),
    disableInteractive: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    scene: {
        tweens: {
            add: vi.fn(() => ({
                stop: vi.fn(),
            })),
        },
    },
    input: null,
});

describe("Audio Control Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * **Feature: professional-menu-redesign, Property 7: Audio control integration**
     * **Validates: Requirements 2.4**
     *
     * For any audio control element, it should use the same styling patterns
     * and design tokens as other menu elements
     */
    it("should use consistent design system styling patterns for all audio control states", () => {
        fc.assert(
            fc.property(
                // Generate random audio control states
                fc.record({
                    isMuted: fc.boolean(),
                    isEnabled: fc.boolean(),
                    hasKeyboardShortcut: fc.boolean(),
                }),
                (audioState) => {
                    // Create audio control style
                    const audioStyle = createAudioControlStyle();

                    // Verify it uses design system tokens
                    expect(audioStyle.fontFamily).toBeDefined();
                    expect(audioStyle.fontSize).toBe(
                        `${designTokens.typography.scale.base}px`
                    );
                    expect(audioStyle.color).toBe(colorPalette.text.secondary);
                    expect(audioStyle.letterSpacing).toBe(
                        designTokens.typography.letterSpacing.normal
                    );

                    // Create interactive configuration
                    const interactiveConfig = createAudioControlConfig();

                    // Verify interactive states use design system colors
                    expect(interactiveConfig.defaultState.color).toBe(
                        colorPalette.text.secondary
                    );
                    expect(interactiveConfig.hoverState.color).toBe(
                        colorPalette.interactive.hover
                    );
                    expect(interactiveConfig.activeState.color).toBe(
                        colorPalette.interactive.active
                    );
                    expect(interactiveConfig.disabledState.color).toBe(
                        colorPalette.interactive.disabled
                    );

                    // Verify animation uses design system timing
                    expect(interactiveConfig.animation.duration).toBe(
                        designTokens.animation.durations.fast
                    );
                    expect(interactiveConfig.animation.easing).toBe(
                        designTokens.animation.easing.easeOut
                    );

                    // Create mock text object and apply interactive behavior
                    const mockText = createMockTextObject();
                    const interactiveElement = createInteractiveElement(
                        mockText as any,
                        interactiveConfig
                    );

                    // Verify interactive element was created successfully
                    expect(interactiveElement).toBeDefined();
                    expect(mockText.setInteractive).toHaveBeenCalledWith({
                        useHandCursor: true,
                    });

                    // Test state changes based on audio state
                    if (!audioState.isEnabled) {
                        interactiveElement.setEnabled(false);
                        expect(mockText.disableInteractive).toHaveBeenCalled();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it("should maintain design consistency across different audio control configurations", () => {
        fc.assert(
            fc.property(
                // Generate different style configurations
                fc.record({
                    customColor: fc.option(
                        fc
                            .string({ minLength: 6, maxLength: 6 })
                            .map((s) =>
                                s.replace(/[^0-9a-f]/gi, "0").substring(0, 6)
                            )
                    ),
                    customSize: fc.option(
                        fc.constantFrom("xs", "sm", "base", "lg", "xl")
                    ),
                }),
                (styleConfig) => {
                    // Create base audio control style
                    const baseStyle = createAudioControlStyle();

                    // Create custom style with overrides
                    const customOptions: any = {};
                    if (styleConfig.customColor) {
                        customOptions.color = `#${styleConfig.customColor}`;
                    }

                    const customStyle = createAudioControlStyle(customOptions);

                    // Both styles should use the same font family from design system
                    expect(baseStyle.fontFamily).toBe(customStyle.fontFamily);

                    // Both should use design system letter spacing
                    expect(baseStyle.letterSpacing).toBe(
                        customStyle.letterSpacing
                    );
                    expect(baseStyle.letterSpacing).toBe(
                        designTokens.typography.letterSpacing.normal
                    );

                    // Font size should be from design system scale
                    expect(baseStyle.fontSize).toBe(
                        `${designTokens.typography.scale.base}px`
                    );

                    // Custom color should override, but base should use design system color
                    if (styleConfig.customColor) {
                        expect(customStyle.color).toBe(
                            `#${styleConfig.customColor}`
                        );
                    } else {
                        expect(customStyle.color).toBe(
                            colorPalette.text.secondary
                        );
                    }
                    expect(baseStyle.color).toBe(colorPalette.text.secondary);
                }
            ),
            { numRuns: 100 }
        );
    });

    it("should integrate seamlessly with existing interactive element patterns", () => {
        fc.assert(
            fc.property(
                // Generate different interactive element types for comparison
                fc.constantFrom("menuButton", "textLink", "accentButton"),
                (presetType) => {
                    const mockText = createMockTextObject();

                    // Create audio control with design system
                    const audioConfig = createAudioControlConfig();
                    const audioElement = createInteractiveElement(
                        mockText as any,
                        audioConfig
                    );

                    // Create comparison element with preset
                    const mockText2 = createMockTextObject();
                    const presetElement = createInteractiveElement(
                        mockText2 as any,
                        presetType
                    );

                    // Both should use the same interaction setup
                    expect(mockText.setInteractive).toHaveBeenCalledWith({
                        useHandCursor: true,
                    });
                    expect(mockText2.setInteractive).toHaveBeenCalledWith({
                        useHandCursor: true,
                    });

                    // Both should have the same event handler setup
                    expect(mockText.on).toHaveBeenCalledWith(
                        "pointerover",
                        expect.any(Function),
                        expect.any(Object)
                    );
                    expect(mockText.on).toHaveBeenCalledWith(
                        "pointerout",
                        expect.any(Function),
                        expect.any(Object)
                    );
                    expect(mockText.on).toHaveBeenCalledWith(
                        "pointerdown",
                        expect.any(Function),
                        expect.any(Object)
                    );
                    expect(mockText.on).toHaveBeenCalledWith(
                        "pointerup",
                        expect.any(Function),
                        expect.any(Object)
                    );

                    expect(mockText2.on).toHaveBeenCalledWith(
                        "pointerover",
                        expect.any(Function),
                        expect.any(Object)
                    );
                    expect(mockText2.on).toHaveBeenCalledWith(
                        "pointerout",
                        expect.any(Function),
                        expect.any(Object)
                    );
                    expect(mockText2.on).toHaveBeenCalledWith(
                        "pointerdown",
                        expect.any(Function),
                        expect.any(Object)
                    );
                    expect(mockText2.on).toHaveBeenCalledWith(
                        "pointerup",
                        expect.any(Function),
                        expect.any(Object)
                    );

                    // Both elements should be valid
                    expect(audioElement).toBeDefined();
                    expect(presetElement).toBeDefined();
                }
            ),
            { numRuns: 50 }
        );
    });
});

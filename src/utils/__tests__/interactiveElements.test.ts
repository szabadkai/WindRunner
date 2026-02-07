/**
 * Interactive Elements System Property-Based Tests
 *
 * Property-based tests for the interactive element system to ensure consistent
 * feedback, animation timing, and interaction patterns across all menu elements.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
    BaseInteractiveElement,
    easingFunctions,
    animationDurations,
    interactivePresets,
    createInteractiveElement,
    validateInteractivePattern,
} from "../interactiveElements";
import { colorPalette } from "../designUtils";
import { designTokens } from "../designTokens";

// Mock Phaser objects for testing
class MockScene {
    tweens = {
        add: vi.fn().mockReturnValue({ stop: vi.fn() }),
    };
}

class MockGameObject {
    scene = new MockScene();
    input = { pointerOver: vi.fn().mockReturnValue(false) };

    setInteractive = vi.fn().mockReturnThis();
    disableInteractive = vi.fn().mockReturnThis();
    setColor = vi.fn().mockReturnThis();
    setScale = vi.fn().mockReturnThis();
    setAlpha = vi.fn().mockReturnThis();
    setRotation = vi.fn().mockReturnThis();
    on = vi.fn().mockReturnThis();
    off = vi.fn().mockReturnThis();

    // Mock event system
    private eventHandlers: Map<string, Function[]> = new Map();

    emit(event: string, ...args: any[]) {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.forEach((handler) => handler(...args));
    }

    // Override on method to actually store handlers for testing
    constructor() {
        this.on = vi
            .fn()
            .mockImplementation(
                (event: string, handler: Function, context?: any) => {
                    if (!this.eventHandlers.has(event)) {
                        this.eventHandlers.set(event, []);
                    }
                    // Bind the handler to the context if provided
                    const boundHandler = context
                        ? handler.bind(context)
                        : handler;
                    this.eventHandlers.get(event)!.push(boundHandler);
                    return this;
                }
            );
    }
}

describe("Interactive Elements System Property Tests", () => {
    let mockGameObject: MockGameObject;

    beforeEach(() => {
        mockGameObject = new MockGameObject();
        vi.clearAllMocks();
    });

    /**
     * **Feature: professional-menu-redesign, Property 4: Interactive feedback consistency**
     * **Validates: Requirements 1.4, 2.1**
     *
     * For any interactive element, hover and active states should provide consistent
     * visual feedback within defined timing parameters
     */
    it("Property 4: Interactive feedback consistency - all interactive elements provide consistent feedback", () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant("menuButton"),
                    fc.constant("textLink"),
                    fc.constant("accentButton"),
                    fc.constant("courseCard")
                ),
                fc.record({
                    hoverColor: fc.oneof(
                        fc.constant(colorPalette.interactive.hover),
                        fc.constant(colorPalette.interactive.focus),
                        fc.constant(colorPalette.text.accent),
                        fc.constant(colorPalette.text.primary)
                    ),
                    activeColor: fc.oneof(
                        fc.constant(colorPalette.interactive.active),
                        fc.constant(colorPalette.interactive.hover),
                        fc.constant(colorPalette.text.accent)
                    ),
                    animationDuration: fc.oneof(
                        fc.constant("fast"),
                        fc.constant("normal"),
                        fc.constant("slow")
                    ),
                }),
                (presetName, customConfig) => {
                    const gameObject = new MockGameObject();

                    // Create interactive element with preset and custom config
                    const element = createInteractiveElement(
                        gameObject as any,
                        presetName,
                        {
                            hoverState: { color: customConfig.hoverColor },
                            activeState: { color: customConfig.activeColor },
                            animation: {
                                duration:
                                    designTokens.animation.durations[
                                        customConfig.animationDuration
                                    ],
                                easing: easingFunctions.easeOut,
                            },
                        }
                    );

                    // Validate that the element follows consistent patterns
                    expect(validateInteractivePattern(element)).toBe(true);

                    // Test hover feedback consistency
                    gameObject.emit("pointerover");

                    // Should have called setColor with hover color
                    expect(gameObject.setColor).toHaveBeenCalledWith(
                        customConfig.hoverColor
                    );

                    // Should have created a tween with consistent timing
                    expect(gameObject.scene.tweens.add).toHaveBeenCalledWith(
                        expect.objectContaining({
                            duration:
                                designTokens.animation.durations[
                                    customConfig.animationDuration
                                ],
                            ease: easingFunctions.easeOut,
                        })
                    );

                    // Test active feedback consistency
                    gameObject.emit("pointerdown");

                    // Should have called setColor with active color
                    expect(gameObject.setColor).toHaveBeenCalledWith(
                        customConfig.activeColor
                    );

                    // Animation duration should be within acceptable range
                    const duration =
                        designTokens.animation.durations[
                            customConfig.animationDuration
                        ];
                    expect(duration).toBeGreaterThan(0);
                    expect(duration).toBeLessThanOrEqual(1000); // Max 1 second for UI feedback

                    // Cleanup
                    element.destroy();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: professional-menu-redesign, Property 5: Interaction pattern uniformity**
     * **Validates: Requirements 2.2**
     *
     * For any similar interactive elements, they should respond to user input in the
     * same manner with identical feedback patterns
     */
    it("Property 5: Interaction pattern uniformity - similar elements have identical interaction patterns", () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant("menuButton"),
                    fc.constant("textLink"),
                    fc.constant("accentButton"),
                    fc.constant("courseCard")
                ),
                fc.array(
                    fc.record({
                        scale: fc.float({
                            min: Math.fround(0.5),
                            max: Math.fround(2.0),
                        }),
                        alpha: fc.float({
                            min: Math.fround(0.1),
                            max: Math.fround(1.0),
                        }),
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                (presetName, elementConfigs) => {
                    const elements: BaseInteractiveElement[] = [];
                    const gameObjects: MockGameObject[] = [];

                    // Create multiple elements with the same preset but different custom configs
                    elementConfigs.forEach((config) => {
                        const gameObject = new MockGameObject();
                        const element = createInteractiveElement(
                            gameObject as any,
                            presetName,
                            {
                                hoverState: {
                                    scale: config.scale,
                                    alpha: config.alpha,
                                },
                            }
                        );

                        elements.push(element);
                        gameObjects.push(gameObject);
                    });

                    // All elements should follow the same interaction pattern
                    elements.forEach((element) => {
                        expect(validateInteractivePattern(element)).toBe(true);
                    });

                    // Get the expected easing for this preset
                    const presetConfig = interactivePresets[presetName]();
                    const expectedEasing = presetConfig.animation.easing;

                    // Test that all elements respond to hover in the same way
                    gameObjects.forEach((gameObject) => {
                        gameObject.emit("pointerover");

                        // All should have set up interactivity
                        expect(gameObject.setInteractive).toHaveBeenCalledWith({
                            useHandCursor: true,
                        });

                        // All should have created tweens with the same easing function (from the preset)
                        expect(
                            gameObject.scene.tweens.add
                        ).toHaveBeenCalledWith(
                            expect.objectContaining({
                                ease: expectedEasing,
                            })
                        );
                    });

                    // Test that all elements respond to active state in the same way
                    gameObjects.forEach((gameObject) => {
                        gameObject.emit("pointerdown");

                        // Should have created additional tweens for active state
                        expect(gameObject.scene.tweens.add).toHaveBeenCalled();
                    });

                    // Test that all elements handle disabled state uniformly
                    elements.forEach((element) => {
                        element.setEnabled(false);
                        expect(element.getEnabled()).toBe(false);
                    });

                    // Cleanup
                    elements.forEach((element) => element.destroy());
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit tests for specific functionality
    describe("Interactive Elements Unit Tests", () => {
        it("should create valid interactive elements with all required states", () => {
            const element = createInteractiveElement(
                mockGameObject as any,
                "menuButton"
            );

            expect(validateInteractivePattern(element)).toBe(true);
            expect(element.getEnabled()).toBe(true);
        });

        it("should handle enable/disable state changes correctly", () => {
            const element = createInteractiveElement(
                mockGameObject as any,
                "menuButton"
            );

            // Test disabling
            element.setEnabled(false);
            expect(element.getEnabled()).toBe(false);
            expect(mockGameObject.disableInteractive).toHaveBeenCalled();

            // Test re-enabling
            element.setEnabled(true);
            expect(element.getEnabled()).toBe(true);
            expect(mockGameObject.setInteractive).toHaveBeenCalledWith({
                useHandCursor: true,
            });
        });

        it("should clean up resources when destroyed", () => {
            const element = createInteractiveElement(
                mockGameObject as any,
                "menuButton"
            );

            element.destroy();

            // Should have removed event listeners
            expect(mockGameObject.off).toHaveBeenCalledWith(
                "pointerover",
                expect.any(Function),
                element
            );
            expect(mockGameObject.off).toHaveBeenCalledWith(
                "pointerout",
                expect.any(Function),
                element
            );
            expect(mockGameObject.off).toHaveBeenCalledWith(
                "pointerdown",
                expect.any(Function),
                element
            );
            expect(mockGameObject.off).toHaveBeenCalledWith(
                "pointerup",
                expect.any(Function),
                element
            );
        });

        it("should provide consistent animation durations across all presets", () => {
            const presets = Object.keys(interactivePresets) as Array<
                keyof typeof interactivePresets
            >;

            presets.forEach((presetName) => {
                const config = interactivePresets[presetName]();

                // Animation duration should be from our defined set
                const validDurations = Object.values(animationDurations);
                expect(validDurations).toContain(config.animation.duration);

                // Animation easing should be from our defined set
                const validEasings = Object.values(easingFunctions);
                expect(validEasings).toContain(config.animation.easing);
            });
        });

        it("should use colors from the design system palette", () => {
            const presets = Object.keys(interactivePresets) as Array<
                keyof typeof interactivePresets
            >;

            presets.forEach((presetName) => {
                const config = interactivePresets[presetName]();

                // All colors should be valid hex colors or from our palette
                const validColors = [
                    ...Object.values(colorPalette.text),
                    ...Object.values(colorPalette.interactive),
                    colorPalette.background,
                    colorPalette.primary,
                    colorPalette.secondary,
                    colorPalette.accent,
                ];

                if (config.defaultState.color) {
                    expect(
                        validColors.includes(config.defaultState.color) ||
                            /^#[0-9a-fA-F]{6}$/.test(config.defaultState.color)
                    ).toBe(true);
                }

                if (config.hoverState.color) {
                    expect(
                        validColors.includes(config.hoverState.color) ||
                            /^#[0-9a-fA-F]{6}$/.test(config.hoverState.color)
                    ).toBe(true);
                }
            });
        });

        it("should handle rapid state changes without breaking", () => {
            const element = createInteractiveElement(
                mockGameObject as any,
                "menuButton"
            );

            // Simulate rapid hover/unhover
            mockGameObject.emit("pointerover");
            mockGameObject.emit("pointerout");
            mockGameObject.emit("pointerover");
            mockGameObject.emit("pointerdown");
            mockGameObject.emit("pointerup");
            mockGameObject.emit("pointerout");

            // Should not throw errors and should still be functional
            expect(element.getEnabled()).toBe(true);
            expect(validateInteractivePattern(element)).toBe(true);

            element.destroy();
        });
    });
});

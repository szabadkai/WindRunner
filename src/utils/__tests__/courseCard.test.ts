/**
 * Course Card Component Tests
 *
 * Property-based tests for course progression display organization
 * and card-based layout functionality.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
    createCourseCard,
    validateCourseProgressionDisplay,
} from "../courseCard";
import { COURSES } from "../../data/courses";
import { ProgressionSystem } from "../../systems/ProgressionSystem";

// Mock Phaser scene and game objects
const mockScene = {
    add: {
        container: vi.fn(() => ({
            add: vi.fn(),
            setInteractive: vi.fn(),
            on: vi.fn(),
            setAlpha: vi.fn(),
        })),
        rectangle: vi.fn(() => ({
            setStrokeStyle: vi.fn(),
        })),
        text: vi.fn(() => ({
            setOrigin: vi.fn(() => ({
                setOrigin: vi.fn(),
            })),
        })),
    },
} as any;

// Mock ProgressionSystem
vi.mock("../../systems/ProgressionSystem", () => ({
    ProgressionSystem: {
        isCourseUnlocked: vi.fn(),
        getStarsForCourse: vi.fn(),
        getBestTime: vi.fn(),
    },
}));

// Mock SoundManager
vi.mock("../../systems/SoundManager", () => ({
    SoundManager: {
        getInstance: () => ({
            playHover: vi.fn(),
            playSelect: vi.fn(),
        }),
    },
}));

describe("Course Card System", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * **Feature: professional-menu-redesign, Property 6: Course progression display organization**
     * **Validates: Requirements 2.3**
     *
     * For any course selection element, progression information should be displayed
     * in a consistent, organized format
     */
    it("should organize course progression display consistently across all course states", () => {
        fc.assert(
            fc.property(
                // Generate random course indices
                fc.integer({ min: 0, max: COURSES.length - 1 }),
                // Generate random progression states
                fc.record({
                    isUnlocked: fc.boolean(),
                    stars: fc.integer({ min: 0, max: 3 }),
                    bestTime: fc.option(
                        fc.integer({ min: 1000, max: 300000 }),
                        { nil: null }
                    ),
                }),
                (courseIndex, progressionState) => {
                    // Mock the progression system to return our test state
                    vi.mocked(
                        ProgressionSystem.isCourseUnlocked
                    ).mockReturnValue(progressionState.isUnlocked);
                    vi.mocked(
                        ProgressionSystem.getStarsForCourse
                    ).mockReturnValue(progressionState.stars);
                    vi.mocked(ProgressionSystem.getBestTime).mockReturnValue(
                        progressionState.bestTime
                    );

                    // Create course card elements
                    const courseCard = createCourseCard(mockScene, {
                        courseIndex,
                        x: 0,
                        y: 0,
                        width: 400,
                    });

                    // Validate that progression display follows organizational requirements
                    const isValid = validateCourseProgressionDisplay(
                        courseCard,
                        courseIndex
                    );

                    // The validation should always pass for properly organized displays
                    expect(isValid).toBe(true);

                    // Additional consistency checks
                    if (progressionState.isUnlocked) {
                        // Unlocked courses should have progression elements when appropriate
                        if (progressionState.stars > 0) {
                            expect(courseCard.starsText).toBeDefined();
                        }
                        if (progressionState.bestTime) {
                            expect(courseCard.timeText).toBeDefined();
                        }
                        // Should not have lock elements
                        expect(courseCard.lockIcon).toBeUndefined();
                        expect(courseCard.unlockRequirement).toBeUndefined();
                    } else {
                        // Locked courses should have lock elements
                        expect(courseCard.lockIcon).toBeDefined();
                        expect(courseCard.unlockRequirement).toBeDefined();
                        // Should not have progression elements
                        expect(courseCard.starsText).toBeUndefined();
                        expect(courseCard.timeText).toBeUndefined();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it("should maintain consistent card structure across different course configurations", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: COURSES.length - 1 }),
                fc.record({
                    width: fc.integer({ min: 200, max: 800 }),
                    x: fc.integer({ min: -400, max: 400 }),
                    y: fc.integer({ min: -300, max: 300 }),
                }),
                (courseIndex, cardConfig) => {
                    // Mock unlocked state for this test
                    vi.mocked(
                        ProgressionSystem.isCourseUnlocked
                    ).mockReturnValue(true);
                    vi.mocked(
                        ProgressionSystem.getStarsForCourse
                    ).mockReturnValue(2);
                    vi.mocked(ProgressionSystem.getBestTime).mockReturnValue(
                        45000
                    );

                    const courseCard = createCourseCard(mockScene, {
                        courseIndex,
                        ...cardConfig,
                    });

                    // All course cards should have these essential elements
                    expect(courseCard.container).toBeDefined();
                    expect(courseCard.background).toBeDefined();
                    expect(courseCard.titleText).toBeDefined();
                    expect(courseCard.progressionContainer).toBeDefined();

                    // Verify the scene methods were called to create the elements
                    expect(mockScene.add.container).toHaveBeenCalled();
                    expect(mockScene.add.rectangle).toHaveBeenCalled();
                    expect(mockScene.add.text).toHaveBeenCalled();
                }
            ),
            { numRuns: 100 }
        );
    });

    it("should handle edge cases in progression display gracefully", () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: COURSES.length - 1 }),
                fc.oneof(
                    // Edge case: unlocked with no stars or time
                    fc.constant({ isUnlocked: true, stars: 0, bestTime: null }),
                    // Edge case: unlocked with maximum stars
                    fc.constant({
                        isUnlocked: true,
                        stars: 3,
                        bestTime: 30000,
                    }),
                    // Edge case: locked course
                    fc.constant({ isUnlocked: false, stars: 0, bestTime: null })
                ),
                (courseIndex, edgeCase) => {
                    vi.mocked(
                        ProgressionSystem.isCourseUnlocked
                    ).mockReturnValue(edgeCase.isUnlocked);
                    vi.mocked(
                        ProgressionSystem.getStarsForCourse
                    ).mockReturnValue(edgeCase.stars);
                    vi.mocked(ProgressionSystem.getBestTime).mockReturnValue(
                        edgeCase.bestTime
                    );

                    const courseCard = createCourseCard(mockScene, {
                        courseIndex,
                        x: 0,
                        y: 0,
                        width: 400,
                    });

                    // Should handle edge cases without errors
                    expect(() =>
                        validateCourseProgressionDisplay(
                            courseCard,
                            courseIndex
                        )
                    ).not.toThrow();

                    // Validation should still pass for edge cases
                    const isValid = validateCourseProgressionDisplay(
                        courseCard,
                        courseIndex
                    );
                    expect(isValid).toBe(true);
                }
            ),
            { numRuns: 50 }
        );
    });
});

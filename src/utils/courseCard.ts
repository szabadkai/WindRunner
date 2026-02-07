/**
 * Course Card Component System
 *
 * Provides card-based layout components for course selection with professional styling,
 * elegant progression indicators, and sophisticated locked course presentation.
 */

import { COURSES } from "../data/courses";
import { ProgressionSystem } from "../systems/ProgressionSystem";
import { SoundManager } from "../systems/SoundManager";
import { designTokens } from "./designTokens";
import {
    colorPalette,
    createNavigationStyle,
    createBodyStyle,
    createMonospaceStyle,
    createSectionHeaderStyle,
} from "./designUtils";
import {
    createInteractiveElement,
    interactivePresets,
} from "./interactiveElements";
import { addFocusIndicator } from "./accessibility";
import {
    ResponsiveLayoutManager,
    ProportionalSpacingCalculator,
    AnimationFallbackSystem,
} from "./menuPolishing";

/**
 * Course card configuration interface
 */
export interface CourseCardConfig {
    courseIndex: number;
    x: number;
    y: number;
    width: number;
    onSelect?: (courseIndex: number) => void;
}

/**
 * Course card visual elements container
 */
export interface CourseCardElements {
    container: Phaser.GameObjects.Container;
    background: Phaser.GameObjects.Rectangle;
    titleText: Phaser.GameObjects.Text;
    progressionContainer: Phaser.GameObjects.Container;
    starsText?: Phaser.GameObjects.Text;
    timeText?: Phaser.GameObjects.Text;
    lockIcon?: Phaser.GameObjects.Text;
    unlockRequirement?: Phaser.GameObjects.Text;
    interactive?: any; // BaseInteractiveElement instance
}

/**
 * Creates a professional course card with card-based layout
 */
export function createCourseCard(
    scene: Phaser.Scene,
    config: CourseCardConfig
): CourseCardElements {
    const course = COURSES[config.courseIndex];
    const isUnlocked = ProgressionSystem.isCourseUnlocked(config.courseIndex);
    const stars = ProgressionSystem.getStarsForCourse(config.courseIndex);
    const bestTime = ProgressionSystem.getBestTime(config.courseIndex);

    // Get responsive layout manager for optimized spacing
    const layoutManager = ResponsiveLayoutManager.getInstance();

    // Create main container
    const container = scene.add.container(config.x, config.y);

    // Card background with sophisticated styling and responsive height
    const cardHeight = layoutManager.isMobileLayout() ? 140 : 120; // Taller cards on mobile
    const background = scene.add.rectangle(
        0,
        0,
        config.width,
        cardHeight,
        parseInt(colorPalette.background.replace("#", ""), 16),
        0.8
    );

    // Add subtle border and depth
    background.setStrokeStyle(
        2,
        parseInt(designTokens.colors.navy[700].replace("#", ""), 16),
        0.6
    );
    container.add(background);

    // Course title with professional typography and responsive sizing
    const titleFontSize = layoutManager.getResponsiveFontSize(20);
    const titleStyle = isUnlocked
        ? createNavigationStyle({ fontSize: `${titleFontSize}px` })
        : createNavigationStyle({
              fontSize: `${titleFontSize}px`,
              color: colorPalette.text.disabled,
          });

    const titlePadding = layoutManager.getResponsiveSpacing("lg");
    const titleText = scene.add
        .text(
            -config.width / 2 + titlePadding,
            -cardHeight / 2 + layoutManager.getResponsiveSpacing("md"),
            course.name,
            titleStyle
        )
        .setOrigin(0, 0);
    container.add(titleText);

    // Create progression container with proportional spacing
    const progressionY = ProportionalSpacingCalculator.calculateOptimalSpacing(
        titleFontSize,
        16, // progression element height
        cardHeight
    );

    const progressionContainer = scene.add.container(
        -config.width / 2 + titlePadding,
        -cardHeight / 2 + progressionY + titleFontSize
    );
    container.add(progressionContainer);

    const elements: CourseCardElements = {
        container,
        background,
        titleText,
        progressionContainer,
    };

    if (isUnlocked) {
        // Stars display with elegant styling
        if (stars > 0) {
            const starsText = scene.add
                .text(
                    0,
                    0,
                    "★".repeat(stars) + "☆".repeat(3 - stars), // Filled and empty stars
                    {
                        fontSize: "16px",
                        color: designTokens.colors.gold[400],
                        fontFamily: "Arial, sans-serif",
                    }
                )
                .setOrigin(0, 0);
            progressionContainer.add(starsText);
            elements.starsText = starsText;
        }

        // Best time display with monospace font
        if (bestTime) {
            const timeText = scene.add
                .text(
                    stars > 0 ? 120 : 0,
                    0,
                    formatTime(bestTime),
                    createMonospaceStyle("sm", {
                        color: colorPalette.text.accent,
                    })
                )
                .setOrigin(0, 0);
            progressionContainer.add(timeText);
            elements.timeText = timeText;
        }

        // Add interactive behavior for unlocked courses
        if (config.onSelect) {
            elements.interactive = createInteractiveElement(
                container,
                interactivePresets.courseCard(),
                {
                    defaultState: {
                        color: colorPalette.text.primary,
                        scale: 1.0,
                        alpha: 0.9,
                    },
                    hoverState: {
                        color: colorPalette.interactive.hover,
                        scale: 1.01,
                        alpha: 1.0,
                    },
                }
            );

            // Set up click handling
            container.setInteractive(
                new Phaser.Geom.Rectangle(
                    -config.width / 2,
                    -cardHeight / 2,
                    config.width,
                    cardHeight
                ),
                Phaser.Geom.Rectangle.Contains
            );

            container.on("pointerover", () => {
                SoundManager.getInstance().playHover();

                // Performance-optimized glow effect
                const glowTween = AnimationFallbackSystem.createOptimizedTween(
                    scene,
                    {
                        targets: background,
                        duration: designTokens.animation.durations.fast,
                        ease: designTokens.animation.easing.easeOut,
                        onUpdate: () => {
                            background.setStrokeStyle(
                                3,
                                parseInt(
                                    designTokens.colors.gold[400].replace(
                                        "#",
                                        ""
                                    ),
                                    16
                                ),
                                0.8
                            );
                        },
                    }
                );

                // Fallback for low-performance devices
                if (!glowTween) {
                    background.setStrokeStyle(
                        3,
                        parseInt(
                            designTokens.colors.gold[400].replace("#", ""),
                            16
                        ),
                        0.8
                    );
                }
            });

            container.on("pointerout", () => {
                // Performance-optimized glow removal
                const glowTween = AnimationFallbackSystem.createOptimizedTween(
                    scene,
                    {
                        targets: background,
                        duration: designTokens.animation.durations.fast,
                        ease: designTokens.animation.easing.easeOut,
                        onUpdate: () => {
                            background.setStrokeStyle(
                                2,
                                parseInt(
                                    designTokens.colors.navy[700].replace(
                                        "#",
                                        ""
                                    ),
                                    16
                                ),
                                0.6
                            );
                        },
                    }
                );

                // Fallback for low-performance devices
                if (!glowTween) {
                    background.setStrokeStyle(
                        2,
                        parseInt(
                            designTokens.colors.navy[700].replace("#", ""),
                            16
                        ),
                        0.6
                    );
                }
            });

            container.on("pointerdown", () => {
                SoundManager.getInstance().playSelect();
                config.onSelect!(config.courseIndex);
            });
        }
    } else {
        // Sophisticated locked course presentation
        const lockIcon = scene.add
            .text(0, 0, "🔒", {
                fontSize: "14px",
                color: colorPalette.text.disabled,
            })
            .setOrigin(0, 0);
        progressionContainer.add(lockIcon);
        elements.lockIcon = lockIcon;

        // Unlock requirement with clear typography
        const unlockRequirement = scene.add
            .text(
                25,
                0,
                `Requires ${course.unlockStars} ★`,
                createBodyStyle("sm", {
                    color: colorPalette.text.disabled,
                })
            )
            .setOrigin(0, 0);
        progressionContainer.add(unlockRequirement);
        elements.unlockRequirement = unlockRequirement;

        // Subtle disabled styling for the entire card
        container.setAlpha(0.6);
    }

    return elements;
}

/**
 * Creates the course selection section with consistent spacing and alignment
 */
export function createCourseSelectionSection(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    onCourseSelect: (courseIndex: number) => void,
    focusableElements?: Array<{
        element: Phaser.GameObjects.GameObject;
        focusIndicator: Phaser.GameObjects.Graphics;
        callback?: () => void;
    }>
): Phaser.GameObjects.Container {
    const layoutManager = ResponsiveLayoutManager.getInstance();
    const sectionContainer = scene.add.container(x, y);

    // Section header with professional typography and responsive sizing
    const headerText = scene.add
        .text(0, 0, "REGATTA MODE", createSectionHeaderStyle())
        .setOrigin(0.5, 0);
    sectionContainer.add(headerText);

    // Course cards with responsive spacing and proportional layout
    const cardWidth = Math.min(
        width - layoutManager.getResponsiveSpacing("xl"),
        500
    );
    const cardSpacing = layoutManager.getResponsiveSpacing("lg");
    let currentY = layoutManager.getResponsiveSpacing("xl");

    COURSES.forEach((_, index) => {
        const courseCard = createCourseCard(scene, {
            courseIndex: index,
            x: 0,
            y: currentY,
            width: cardWidth,
            onSelect: onCourseSelect,
        });

        sectionContainer.add(courseCard.container);

        // Add to focusable elements if unlocked and array provided
        if (focusableElements && ProgressionSystem.isCourseUnlocked(index)) {
            // Create a temporary object that matches the expected interface
            const focusTarget = Object.assign(courseCard.container, {
                width: cardWidth,
                height: 120,
                displayWidth: cardWidth,
                displayHeight: 120,
            });

            const focusIndicator = addFocusIndicator(scene, focusTarget);

            focusableElements.push({
                element: courseCard.container,
                focusIndicator,
                callback: () => onCourseSelect(index),
            });
        }

        const cardHeight = layoutManager.isMobileLayout() ? 140 : 120;
        currentY += cardHeight + cardSpacing; // Responsive card height + spacing
    });

    return sectionContainer;
}

/**
 * Formats time in MM:SS.MS format for display
 */
function formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
}

/**
 * Updates course card progression display when progression changes
 */
export function updateCourseCardProgression(
    elements: CourseCardElements,
    courseIndex: number
): void {
    const stars = ProgressionSystem.getStarsForCourse(courseIndex);
    const bestTime = ProgressionSystem.getBestTime(courseIndex);

    // Update stars display
    if (elements.starsText) {
        elements.starsText.setText("★".repeat(stars) + "☆".repeat(3 - stars));
    }

    // Update time display
    if (elements.timeText && bestTime) {
        elements.timeText.setText(formatTime(bestTime));
    }
}

/**
 * Validates that course progression display follows organizational requirements
 */
export function validateCourseProgressionDisplay(
    elements: CourseCardElements,
    courseIndex: number
): boolean {
    const isUnlocked = ProgressionSystem.isCourseUnlocked(courseIndex);
    const stars = ProgressionSystem.getStarsForCourse(courseIndex);
    const bestTime = ProgressionSystem.getBestTime(courseIndex);

    // Validate that unlocked courses show proper progression information
    if (isUnlocked) {
        // Should have stars display if stars > 0
        if (stars > 0 && !elements.starsText) {
            return false;
        }

        // Should have time display if best time exists
        if (bestTime && !elements.timeText) {
            return false;
        }

        // Should not have lock elements
        if (elements.lockIcon || elements.unlockRequirement) {
            return false;
        }
    } else {
        // Locked courses should show lock icon and requirement
        if (!elements.lockIcon || !elements.unlockRequirement) {
            return false;
        }

        // Should not have progression elements
        if (elements.starsText || elements.timeText) {
            return false;
        }
    }

    return true;
}

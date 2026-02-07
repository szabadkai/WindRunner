/**
 * Interactive Elements System Example
 *
 * Demonstrates how to use the interactive element system in a Phaser scene.
 * This example shows different types of interactive elements with consistent
 * feedback patterns and animations.
 */

import {
    createInteractiveElement,
    addHoverEffect,
} from "./interactiveElements";
import { createNavigationStyle, createBodyStyle } from "./designUtils";

export class InteractiveElementsExample extends Phaser.Scene {
    constructor() {
        super("InteractiveElementsExample");
    }

    create() {
        const { width, height } = this.cameras.main;

        // Example 1: Menu Button with preset configuration
        const menuButtonText = this.add
            .text(
                width / 2,
                height / 2 - 100,
                "Menu Button",
                createNavigationStyle()
            )
            .setOrigin(0.5);

        const menuButton = createInteractiveElement(
            menuButtonText,
            "menuButton"
        );

        // Add click handler
        menuButtonText.on("pointerdown", () => {
            console.log("Menu button clicked!");
        });

        // Example 2: Accent Button for primary actions
        const accentButtonText = this.add
            .text(
                width / 2,
                height / 2 - 50,
                "Primary Action",
                createBodyStyle("xxl")
            )
            .setOrigin(0.5);

        const accentButton = createInteractiveElement(
            accentButtonText,
            "accentButton"
        );

        accentButtonText.on("pointerdown", () => {
            console.log("Primary action triggered!");
        });

        // Example 3: Text Link with subtle interaction
        const linkText = this.add
            .text(width / 2, height / 2, "Text Link", createBodyStyle("lg"))
            .setOrigin(0.5);

        const textLink = createInteractiveElement(linkText, "textLink");

        linkText.on("pointerdown", () => {
            console.log("Link clicked!");
        });

        // Example 4: Course Card with custom configuration
        const courseCardText = this.add
            .text(
                width / 2,
                height / 2 + 50,
                "Course Selection",
                createNavigationStyle()
            )
            .setOrigin(0.5);

        const courseCard = createInteractiveElement(
            courseCardText,
            "courseCard",
            {
                // Custom hover state with different scale
                hoverState: {
                    scale: 1.1,
                    alpha: 1.0,
                },
            }
        );

        courseCardText.on("pointerdown", () => {
            console.log("Course selected!");
        });

        // Example 5: Simple hover effect utility
        const simpleText = this.add
            .text(
                width / 2,
                height / 2 + 100,
                "Simple Hover Effect",
                createBodyStyle()
            )
            .setOrigin(0.5);

        // Use the utility function for quick hover effects
        addHoverEffect(simpleText);

        simpleText.on("pointerdown", () => {
            console.log("Simple element clicked!");
        });

        // Example 6: Disabled state demonstration
        const disabledText = this.add
            .text(
                width / 2,
                height / 2 + 150,
                "Disabled Button",
                createNavigationStyle()
            )
            .setOrigin(0.5);

        const disabledButton = createInteractiveElement(
            disabledText,
            "menuButton"
        );
        disabledButton.setEnabled(false); // Demonstrate disabled state

        // Instructions
        this.add
            .text(
                width / 2,
                50,
                "Interactive Elements System Demo\nHover and click on the elements below",
                {
                    ...createBodyStyle("sm"),
                    align: "center",
                }
            )
            .setOrigin(0.5);

        // Cleanup example - show how to properly destroy interactive elements
        this.events.once("shutdown", () => {
            menuButton.destroy();
            accentButton.destroy();
            textLink.destroy();
            courseCard.destroy();
            disabledButton.destroy();
        });
    }
}

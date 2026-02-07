/**
 * Typography System Usage Example
 *
 * Demonstrates how to use the typography system in Phaser scenes.
 * This file shows the proper way to initialize and use typography utilities.
 */

import {
    initializeTypography,
    createTitleStyle,
    createSubtitleStyle,
    createNavigationStyle,
    createBodyStyle,
    createMonospaceStyle,
} from "./designUtils";

/**
 * Example of how to initialize typography in a Phaser scene
 */
export class TypographyExampleScene extends Phaser.Scene {
    constructor() {
        super("TypographyExample");
    }

    async preload() {
        // Initialize typography system during preload
        await initializeTypography();
    }

    create() {
        const { width } = this.cameras.main;

        // Example 1: Create a title using the typography system
        this.add
            .text(width / 2, 100, "WINDRUNNER", createTitleStyle())
            .setOrigin(0.5);

        // Example 2: Create a subtitle that complements the title
        this.add
            .text(
                width / 2,
                160,
                "Sailing Simulator",
                createSubtitleStyle({
                    letterSpacing: 2, // Custom letter spacing
                })
            )
            .setOrigin(0.5);

        // Example 3: Create navigation buttons with consistent styling
        const playButton = this.add
            .text(width / 2, 250, "Play Game", createNavigationStyle())
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Example 4: Create body text for descriptions
        this.add
            .text(
                width / 2,
                320,
                "Experience the thrill of sailing in this realistic simulator.",
                createBodyStyle("lg", {
                    wordWrap: { width: 400 },
                    align: "center",
                })
            )
            .setOrigin(0.5);

        // Example 5: Create monospace text for time displays
        this.add
            .text(
                width / 2,
                400,
                "Best Time: 02:34.56",
                createMonospaceStyle("base")
            )
            .setOrigin(0.5);

        // Example 6: Interactive button with hover effects
        playButton.on("pointerover", () => {
            // You can create hover styles by modifying the existing style
            const hoverStyle = createNavigationStyle();
            hoverStyle.color = "#fcd34d"; // Gold color from design tokens
            playButton.setStyle(hoverStyle);
        });

        playButton.on("pointerout", () => {
            // Reset to normal style
            playButton.setStyle(createNavigationStyle());
        });

        // Example 7: Different font sizes for hierarchy
        const sizes = ["xs", "sm", "base", "lg", "xl", "xxl", "xxxl"] as const;
        sizes.forEach((size, index) => {
            this.add.text(
                50,
                500 + index * 30,
                `${size.toUpperCase()}: Sample Text`,
                createBodyStyle(size)
            );
        });
    }
}

/**
 * Utility function to create consistent menu text styles
 */
export function createMenuTextStyles() {
    return {
        title: createTitleStyle(),
        subtitle: createSubtitleStyle(),
        navigation: createNavigationStyle(),
        body: createBodyStyle(),
        small: createBodyStyle("sm"),
        time: createMonospaceStyle(),
    };
}

/**
 * Example of how to create a text element with proper error handling
 */
export function createSafeText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    styleType: "title" | "subtitle" | "navigation" | "body" = "body"
): Phaser.GameObjects.Text {
    try {
        let style;
        switch (styleType) {
            case "title":
                style = createTitleStyle();
                break;
            case "subtitle":
                style = createSubtitleStyle();
                break;
            case "navigation":
                style = createNavigationStyle();
                break;
            case "body":
            default:
                style = createBodyStyle();
                break;
        }

        return scene.add.text(x, y, text, style);
    } catch (error) {
        console.warn(
            "Failed to create text with typography system, using fallback:",
            error
        );

        // Fallback to basic Phaser text style
        return scene.add.text(x, y, text, {
            fontFamily: "Arial, sans-serif",
            fontSize: "16px",
            color: "#ffffff",
        });
    }
}

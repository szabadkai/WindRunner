/**
 * Font Loading Utilities
 *
 * Provides utilities for loading web fonts with fallback handling and error recovery.
 * Ensures consistent typography across the menu system with graceful degradation.
 */

import { FontDefinition } from "./designSystem";

/**
 * Font loading configuration
 */
export interface FontLoadConfig {
    family: string;
    weight?: string | number;
    style?: string;
    display?: "auto" | "block" | "swap" | "fallback" | "optional";
    timeout?: number; // milliseconds
}

/**
 * Font loading result
 */
export interface FontLoadResult {
    success: boolean;
    family: string;
    error?: string;
    fallbackUsed?: string;
}

/**
 * Professional web fonts configuration
 */
export const WEB_FONTS: Record<string, FontLoadConfig> = {
    title: {
        family: "Playfair Display",
        weight: "700",
        style: "normal",
        display: "swap",
        timeout: 3000,
    },
    subtitle: {
        family: "Inter",
        weight: "300",
        style: "normal",
        display: "swap",
        timeout: 3000,
    },
    navigation: {
        family: "Inter",
        weight: "400",
        style: "normal",
        display: "swap",
        timeout: 3000,
    },
    body: {
        family: "Inter",
        weight: "400",
        style: "normal",
        display: "swap",
        timeout: 3000,
    },
};

/**
 * System font fallbacks for different font categories
 */
export const SYSTEM_FALLBACKS: Record<string, string[]> = {
    serif: ["Georgia", "Times New Roman", "Times", "serif"],
    sansSerif: [
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "sans-serif",
    ],
    monospace: [
        "SF Mono",
        "Monaco",
        "Inconsolata",
        "Roboto Mono",
        "Consolas",
        "Courier New",
        "monospace",
    ],
};

/**
 * Font loading manager class
 */
export class FontLoader {
    private static instance: FontLoader;
    private loadedFonts: Set<string> = new Set();
    private loadingPromises: Map<string, Promise<FontLoadResult>> = new Map();

    private constructor() {}

    static getInstance(): FontLoader {
        if (!FontLoader.instance) {
            FontLoader.instance = new FontLoader();
        }
        return FontLoader.instance;
    }

    /**
     * Load a single font with fallback handling
     */
    async loadFont(config: FontLoadConfig): Promise<FontLoadResult> {
        const fontKey = `${config.family}-${config.weight}-${config.style}`;

        // Return cached result if already loaded
        if (this.loadedFonts.has(fontKey)) {
            return {
                success: true,
                family: config.family,
            };
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(fontKey)) {
            return this.loadingPromises.get(fontKey)!;
        }

        // Create new loading promise
        const loadingPromise = this.performFontLoad(config, fontKey);
        this.loadingPromises.set(fontKey, loadingPromise);

        return loadingPromise;
    }

    /**
     * Load multiple fonts concurrently
     */
    async loadFonts(configs: FontLoadConfig[]): Promise<FontLoadResult[]> {
        const promises = configs.map((config) => this.loadFont(config));
        return Promise.all(promises);
    }

    /**
     * Load all web fonts defined in WEB_FONTS
     */
    async loadAllWebFonts(): Promise<FontLoadResult[]> {
        const configs = Object.values(WEB_FONTS);
        return this.loadFonts(configs);
    }

    /**
     * Check if a font is available (loaded or system font)
     */
    isFontAvailable(family: string): boolean {
        // Check if it's a loaded web font
        const webFontKey = Object.values(WEB_FONTS).find(
            (f) => f.family === family
        );
        if (webFontKey) {
            const fontKey = `${webFontKey.family}-${webFontKey.weight}-${webFontKey.style}`;
            return this.loadedFonts.has(fontKey);
        }

        // Check if it's a system font
        return this.isSystemFontAvailable(family);
    }

    /**
     * Get the best available font from a font definition
     */
    getBestAvailableFont(fontDef: FontDefinition): string {
        // Check if primary font is available
        if (this.isFontAvailable(fontDef.family)) {
            return fontDef.family;
        }

        // Check fallbacks
        if (fontDef.fallback) {
            for (const fallback of fontDef.fallback) {
                if (this.isFontAvailable(fallback)) {
                    return fallback;
                }
            }
        }

        // Return generic fallback
        return "sans-serif";
    }

    /**
     * Create a complete font family string with fallbacks
     */
    createFontFamilyString(fontDef: FontDefinition): string {
        const fonts: string[] = [];

        // Add primary font if available
        if (this.isFontAvailable(fontDef.family)) {
            fonts.push(`"${fontDef.family}"`);
        }

        // Add fallbacks
        if (fontDef.fallback) {
            fonts.push(
                ...fontDef.fallback.map((f) => (f.includes(" ") ? `"${f}"` : f))
            );
        }

        return fonts.join(", ");
    }

    /**
     * Perform the actual font loading
     */
    private async performFontLoad(
        config: FontLoadConfig,
        fontKey: string
    ): Promise<FontLoadResult> {
        try {
            // Check if Font Loading API is available
            if (!("fonts" in document)) {
                return {
                    success: false,
                    family: config.family,
                    error: "Font Loading API not supported",
                };
            }

            // Create font face
            const fontFace = new FontFace(
                config.family,
                `url(https://fonts.googleapis.com/css2?family=${encodeURIComponent(
                    config.family
                )}:wght@${config.weight}&display=${config.display || "swap"})`,
                {
                    weight: String(config.weight || "400"),
                    style: config.style || "normal",
                    display: config.display || "swap",
                }
            );

            // Load with timeout
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(
                    () => reject(new Error("Font load timeout")),
                    config.timeout || 3000
                );
            });

            await Promise.race([fontFace.load(), timeoutPromise]);

            // Add to document fonts
            document.fonts.add(fontFace);
            this.loadedFonts.add(fontKey);

            return {
                success: true,
                family: config.family,
            };
        } catch (error) {
            return {
                success: false,
                family: config.family,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        } finally {
            this.loadingPromises.delete(fontKey);
        }
    }

    /**
     * Check if a system font is available
     */
    private isSystemFontAvailable(family: string): boolean {
        // Simple check for common system fonts
        const systemFonts = [
            ...SYSTEM_FALLBACKS.serif,
            ...SYSTEM_FALLBACKS.sansSerif,
            ...SYSTEM_FALLBACKS.monospace,
        ];

        return systemFonts.includes(family);
    }
}

/**
 * Convenience function to load all fonts
 */
export async function loadAllFonts(): Promise<FontLoadResult[]> {
    return FontLoader.getInstance().loadAllWebFonts();
}

/**
 * Convenience function to get best available font
 */
export function getBestFont(fontDef: FontDefinition): string {
    return FontLoader.getInstance().getBestAvailableFont(fontDef);
}

/**
 * Convenience function to create font family string
 */
export function createFontFamily(fontDef: FontDefinition): string {
    return FontLoader.getInstance().createFontFamilyString(fontDef);
}

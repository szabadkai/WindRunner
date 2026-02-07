/**
 * Design Tokens Configuration
 *
 * Centralized design system tokens for the professional menu redesign.
 * Provides color palettes, typography scales, spacing system, and animation configurations.
 */

export interface DesignTokens {
    colors: {
        navy: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
        };
        gold: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
        };
        gray: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
        };
    };
    spacing: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        xxl: number;
        xxxl: number;
    };
    typography: {
        scale: {
            xs: number;
            sm: number;
            base: number;
            lg: number;
            xl: number;
            xxl: number;
            xxxl: number;
            display: number;
        };
        lineHeight: {
            tight: number;
            normal: number;
            relaxed: number;
        };
        letterSpacing: {
            tight: number;
            normal: number;
            wide: number;
            wider: number;
            widest: number;
        };
    };
    animation: {
        durations: {
            fast: number;
            normal: number;
            slow: number;
        };
        easing: {
            easeOut: string;
            easeInOut: string;
            bounce: string;
        };
    };
}

/**
 * Design tokens configuration following the sophisticated navy, gold, and gray palette
 * with proper spacing and typography scales for professional appearance.
 */
export const designTokens: DesignTokens = {
    colors: {
        navy: {
            50: "#f0f4f8", // Lightest navy - almost white with navy tint
            100: "#d9e2ec", // Very light navy
            200: "#bcccdc", // Light navy
            300: "#9fb3c8", // Medium-light navy
            400: "#829ab1", // Medium navy
            500: "#627d98", // Base navy - main brand color
            600: "#486581", // Medium-dark navy
            700: "#334e68", // Dark navy
            800: "#243b53", // Very dark navy
            900: "#0a192f", // Darkest navy - current background
        },
        gold: {
            50: "#fffdf7", // Lightest gold - cream
            100: "#fef9e7", // Very light gold
            200: "#fef0c7", // Light gold
            300: "#fde68a", // Medium-light gold
            400: "#fcd34d", // Medium gold
            500: "#f59e0b", // Base gold - accent color
            600: "#d97706", // Medium-dark gold
            700: "#b45309", // Dark gold
            800: "#92400e", // Very dark gold
            900: "#78350f", // Darkest gold - bronze
        },
        gray: {
            50: "#f9fafb", // Lightest gray - almost white
            100: "#f3f4f6", // Very light gray
            200: "#e5e7eb", // Light gray
            300: "#d1d5db", // Medium-light gray
            400: "#9ca3af", // Medium gray
            500: "#6b7280", // Base gray
            600: "#4b5563", // Medium-dark gray
            700: "#374151", // Dark gray
            800: "#1f2937", // Very dark gray
            900: "#111827", // Darkest gray
        },
    },
    spacing: {
        xs: 4, // 4px
        sm: 8, // 8px
        md: 16, // 16px
        lg: 24, // 24px
        xl: 32, // 32px
        xxl: 48, // 48px
        xxxl: 64, // 64px
    },
    typography: {
        scale: {
            xs: 12, // 12px - small text
            sm: 14, // 14px - body small
            base: 16, // 16px - base body text
            lg: 18, // 18px - large body text
            xl: 20, // 20px - subtitle
            xxl: 24, // 24px - heading
            xxxl: 32, // 32px - large heading
            display: 48, // 48px+ - display text (title)
        },
        lineHeight: {
            tight: 1.2, // Tight line height for headings
            normal: 1.5, // Normal line height for body text
            relaxed: 1.75, // Relaxed line height for large text
        },
        letterSpacing: {
            tight: -0.4, // Tight letter spacing (-0.025em equivalent)
            normal: 0, // Normal letter spacing
            wide: 0.4, // Wide letter spacing (0.025em equivalent)
            wider: 0.8, // Wider letter spacing (0.05em equivalent)
            widest: 1.6, // Widest letter spacing (0.1em equivalent)
        },
    },
    animation: {
        durations: {
            fast: 150, // 150ms - quick interactions
            normal: 250, // 250ms - standard transitions
            slow: 350, // 350ms - slower, more deliberate animations
        },
        easing: {
            easeOut: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Smooth ease out
            easeInOut: "cubic-bezier(0.645, 0.045, 0.355, 1)", // Smooth ease in-out
            bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", // Subtle bounce effect
        },
    },
};

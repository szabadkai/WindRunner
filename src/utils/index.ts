/**
 * Design System Utilities - Main Export
 *
 * Centralized exports for the design system foundation.
 * Provides easy access to design tokens, interfaces, and utility functions.
 */

// Design tokens and configuration
export { designTokens } from "./designTokens";
export type { DesignTokens } from "./designTokens";

// Design system interfaces and types
export type {
    FontDefinition,
    TypographyConfig,
    InteractiveColors,
    TextColors,
    ColorPalette,
    AnimationConfig,
    MenuDesignConfig,
    PhaserTextStyle,
    InteractiveElementConfig,
    EnhancedInteractiveElementConfig,
    InteractiveState,
    InteractiveAnimation,
    LayoutConfig,
    ProgressIndicatorConfig,
    AudioControlConfig,
} from "./designSystem";

// Utility functions and configurations
export {
    typography,
    colorPalette,
    menuDesignConfig,
    createTextStyle,
    createTitleStyle,
    createSubtitleStyle,
    createNavigationStyle,
    createBodyStyle,
    createMonospaceStyle,
    createInteractiveConfig,
    createSectionHeaderStyle,
    createButtonStyle,
    getSpacing,
    getColor,
    validateContrast,
    initializeTypography,
    isTypographyReady,
} from "./designUtils";

// Font loading utilities
export {
    FontLoader,
    loadAllFonts,
    getBestFont,
    createFontFamily,
    WEB_FONTS,
    SYSTEM_FALLBACKS,
} from "./fontLoader";
export type { FontLoadConfig, FontLoadResult } from "./fontLoader";

// Interactive element system
export {
    BaseInteractiveElement,
    easingFunctions,
    animationDurations,
    interactivePresets,
    createInteractiveElement,
    addHoverEffect,
    validateInteractivePattern,
} from "./interactiveElements";
export type {
    InteractiveState as InteractiveElementState,
    InteractiveAnimation as InteractiveElementAnimation,
    InteractiveElementConfig as EnhancedInteractiveConfig,
} from "./interactiveElements";

// Course card system
export {
    createCourseCard,
    createCourseSelectionSection,
    updateCourseCardProgression,
    validateCourseProgressionDisplay,
} from "./courseCard";
export type { CourseCardConfig, CourseCardElements } from "./courseCard";

// Accessibility utilities
export {
    MIN_TOUCH_TARGET_SIZE,
    WCAG_AA_NORMAL_TEXT_RATIO,
    WCAG_AA_LARGE_TEXT_RATIO,
    defaultFocusIndicator,
    calculateContrastRatio,
    meetsWCAGAA,
    validateTextContrast,
    validateTouchTargetSize,
    calculateTouchTargetPadding,
    addFocusIndicator,
    validateAccessibility,
} from "./accessibility";
export type { FocusIndicatorConfig } from "./accessibility";
// Menu polishing utilities
export {
    AnimationPerformanceMonitor,
    ResponsiveLayoutManager,
    ProportionalSpacingCalculator,
    AnimationFallbackSystem,
    CrossBrowserCompatibility,
    DesignSystemValidator,
} from "./menuPolishing";

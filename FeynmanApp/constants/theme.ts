/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#60a5fa';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Extended colors for app components
    cardBackground: '#f9fafb',
    cardBackgroundSecondary: '#f3f4f6',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#3b82f6',
    success: '#16a34a',
    successBackground: '#dcfce7',
    error: '#dc2626',
    errorBackground: '#fee2e2',
    warning: '#f59e0b',
    warningBackground: '#fef3c7',
    shadow: '#0f172a',
    formulaBackground: '#ede9fe',
    formulaBorder: '#ddd6fe',
    formulaText: '#4c1d95',
    hintBackground: '#dbeafe',
    hintBorder: '#bfdbfe',
    hintText: '#2563eb',
    quizChoiceBackground: '#ffffff',
    quizChoiceBorder: '#e5e7eb',
    quizChoiceSelected: '#2563eb',
    quizChoiceCorrect: '#dcfce7',
    quizChoiceCorrectBorder: '#16a34a',
    quizChoiceIncorrect: '#fee2e2',
    quizChoiceIncorrectBorder: '#dc2626',
    progressBarBackground: '#e5e7eb',
    progressBarFill: '#2563eb',
    medalBackground: '#f9fafb',
  },
  dark: {
    text: '#f9fafb',
    background: '#0f172a',
    tint: tintColorDark,
    icon: '#94a3b8',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    // Extended colors for app components (dark mode)
    cardBackground: '#1e293b',
    cardBackgroundSecondary: '#334155',
    border: '#475569',
    borderLight: '#334155',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    success: '#22c55e',
    successBackground: '#14532d',
    error: '#ef4444',
    errorBackground: '#7f1d1d',
    warning: '#f59e0b',
    warningBackground: '#78350f',
    shadow: '#000000',
    formulaBackground: '#312e81',
    formulaBorder: '#4338ca',
    formulaText: '#c7d2fe',
    hintBackground: '#1e3a8a',
    hintBorder: '#1e40af',
    hintText: '#93c5fd',
    quizChoiceBackground: '#1e293b',
    quizChoiceBorder: '#475569',
    quizChoiceSelected: '#3b82f6',
    quizChoiceCorrect: '#14532d',
    quizChoiceCorrectBorder: '#22c55e',
    quizChoiceIncorrect: '#7f1d1d',
    quizChoiceIncorrectBorder: '#ef4444',
    progressBarBackground: '#334155',
    progressBarFill: '#3b82f6',
    medalBackground: '#1e293b',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

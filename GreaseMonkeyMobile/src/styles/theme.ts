/**
 * Design system theme matching the web frontend
 * Based on shadcn/ui design tokens and TailwindCSS configuration
 */

export const colors = {
  // Primary brand colors (matching web frontend)
  primary: {
    DEFAULT: 'hsl(0, 0%, 9%)', // --primary
    foreground: 'hsl(0, 0%, 98%)', // --primary-foreground
    orange: '#FF6B35', // GreaseMonkey brand orange
  },
  
  // Background colors
  background: {
    DEFAULT: 'hsl(0, 0%, 100%)', // --background (white)
    secondary: 'hsl(0, 0%, 96.1%)', // --secondary
  },
  
  // Text colors
  foreground: {
    DEFAULT: 'hsl(0, 0%, 3.9%)', // --foreground (dark text)
    muted: 'hsl(0, 0%, 45.1%)', // --muted-foreground
    secondary: 'hsl(0, 0%, 9%)', // --secondary-foreground
  },
  
  // Card and surface colors
  card: {
    DEFAULT: 'hsl(0, 0%, 100%)', // --card
    foreground: 'hsl(0, 0%, 3.9%)', // --card-foreground
  },
  
  // Border and input colors
  border: 'hsl(0, 0%, 89.8%)', // --border
  input: 'hsl(0, 0%, 89.8%)', // --input
  
  // State colors
  destructive: {
    DEFAULT: 'hsl(0, 84.2%, 60.2%)', // --destructive
    foreground: 'hsl(0, 0%, 98%)', // --destructive-foreground
  },
  
  // Accent colors
  accent: {
    DEFAULT: 'hsl(0, 0%, 96.1%)', // --accent
    foreground: 'hsl(0, 0%, 9%)', // --accent-foreground
  },
  
  // Utility colors
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 4, // calc(var(--radius) - 4px)
  md: 6, // calc(var(--radius) - 2px)
  lg: 8, // var(--radius)
  xl: 12,
  full: 9999,
};

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
};

// Component-specific styles matching web frontend
export const components = {
  button: {
    primary: {
      backgroundColor: colors.primary.DEFAULT,
      color: colors.primary.foreground,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    secondary: {
      backgroundColor: colors.background.secondary,
      color: colors.foreground.secondary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.foreground.DEFAULT,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.foreground.DEFAULT,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
  },
  card: {
    backgroundColor: colors.card.DEFAULT,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  input: {
    backgroundColor: colors.card.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.foreground.DEFAULT,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  components,
};

export default theme;
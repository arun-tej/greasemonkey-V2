# GreaseMonkey V2 - Unified Theme System

## Overview
The mobile app theme has been updated to match the web frontend's design system, creating a consistent experience across all platforms.

## Design System

### Color Palette
Both web and mobile now use the same shadcn/ui inspired color system:

```typescript
// Primary Colors
primary: 'hsl(0, 0%, 9%)'          // Dark gray for primary elements
primaryForeground: 'hsl(0, 0%, 98%)' // White text on primary
orange: '#FF6B35'                   // GreaseMonkey brand orange

// Background Colors  
background: 'hsl(0, 0%, 100%)'      // Pure white background
secondary: 'hsl(0, 0%, 96.1%)'      // Light gray for secondary surfaces

// Text Colors
foreground: 'hsl(0, 0%, 3.9%)'      // Dark text
muted: 'hsl(0, 0%, 45.1%)'          // Muted text for subtitles

// Surface Colors
card: 'hsl(0, 0%, 100%)'            // White cards with shadows
border: 'hsl(0, 0%, 89.8%)'         // Light borders
```

### Typography
Consistent typography scale:
- **Headings**: 24px-36px with bold weight
- **Body Text**: 14px-16px with normal/medium weight
- **Small Text**: 12px for captions and metadata
- **Font Weight**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing System
Consistent spacing scale:
- xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 20px, xxl: 24px, xxxl: 32px

### Border Radius
- sm: 4px, md: 6px, lg: 8px, xl: 12px, full: 9999px

## Component System

### Shared Components
Both platforms now use consistent UI components:

#### Button Component
- **Primary**: Dark background with white text
- **Secondary**: Light gray background  
- **Outline**: Transparent with border
- **Ghost**: Transparent background
- Consistent padding, border radius, and typography

#### Input Component
- White background with light gray border
- Focus states with orange accent color
- Icon support (left/right)
- Built-in password visibility toggle
- Consistent validation styling

#### Card Component
- White background with subtle shadows
- Consistent border radius and padding
- Elevated variant with larger shadow

## Platform Implementations

### Web Frontend (React)
- Uses TailwindCSS with custom CSS variables
- shadcn/ui component library
- Responsive design with consistent spacing

### Mobile App (React Native)
- Custom theme object with TypeScript definitions
- Native StyleSheet with calculated values
- Platform-specific adaptations (safe areas, navigation)

## Key Changes Made

### Mobile App Updates
1. **Theme System**: Created comprehensive theme.ts with all design tokens
2. **UI Components**: Built Button, Input, and Card components matching web design
3. **Screen Updates**: Updated FeedScreen, LoginScreen, RegisterScreen with new theme
4. **Status Bar**: Changed to light mode to match white background
5. **Typography**: Implemented consistent font weights and sizes

### Benefits
- **Consistency**: Users get same experience across web and mobile
- **Maintainability**: Single source of truth for design tokens
- **Scalability**: Easy to add new components following established patterns
- **Accessibility**: Consistent contrast ratios and touch targets

## Usage Examples

### Using Theme in Mobile Components
```typescript
import { theme } from '../../styles/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.DEFAULT,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground.DEFAULT,
  }
});
```

### Using UI Components
```typescript
import { Button, Input, Card } from '../../components/ui';

<Card>
  <Input
    label="Email"
    placeholder="Enter your email"
    leftIcon="mail-outline"
  />
  <Button
    title="Submit"
    onPress={handleSubmit}
    variant="primary"
  />
</Card>
```

## Migration Notes
- All screens now use light theme instead of previous dark theme
- Legacy styling has been replaced with theme-based styling
- Component props follow web frontend patterns for consistency
- Status bar and navigation styling updated to match

This unified approach ensures users have a seamless experience when switching between web and mobile platforms, while maintaining platform-specific best practices.
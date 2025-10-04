# HabitChain Color Palette System

This directory contains the centralized color palette for the HabitChain dApp, extracted from the HabitChain logo.

## Color Palette Overview

### Brand Colors (from logo)

Your exact brand colors:

- **Hot Pink**: `#FC298D` - Main brand pink (logo background)
- **Light Pink**: `#FE50AE` - Accent pink (detail circles)
- **Deep Purple**: `#6D0F9B` - Brand purple (circular elements)
- **Bright Green**: `#00CB77` - Brand green (center "hc" text)
- **White**: `#FFFFFF` - Text on dark backgrounds

These colors are used throughout the app in both dark and light modes.

### How It Works

All colors are defined as CSS custom properties (variables) in `colors.css`. These variables are then used throughout the application's CSS files.

## Usage

### In CSS Files

Import the color palette at the top of your CSS file:

```css
@import "./styles/colors.css";
```

Then use the CSS variables:

```css
.my-element {
  background-color: var(--bg-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.my-button {
  background-color: var(--primary-color);
  color: white;
}

.my-button:hover {
  background-color: var(--primary-hover);
}
```

### In React Components

You can also use these variables in inline styles:

```tsx
<div
  style={{
    backgroundColor: "var(--bg-light)",
    borderColor: "var(--border-color)",
  }}
>
  Content
</div>
```

## Available Color Variables

### Primary & Secondary

- `--primary-color` - Main interactive color (green)
- `--primary-hover` - Hover state for primary
- `--secondary-color` - Secondary interactive color (purple)
- `--secondary-hover` - Hover state for secondary
- `--accent-color` - Accent color (pink)
- `--accent-hover` - Hover state for accent

### Backgrounds

- `--bg-color` - Main background (dark purple-black)
- `--bg-light` - Lighter background for cards/elements
- `--bg-hover` - Hover state background
- `--bg-card` - Card background

### Borders

- `--border-color` - Default border color
- `--border-hover` - Hover state border
- `--border-accent` - Accent border color

### Text

- `--text-color` - Primary text color
- `--text-muted` - Muted/secondary text
- `--text-accent` - Accent text color

### Status Colors

- `--success-color`, `--success-bg`, `--success-border` - Success states
- `--error-color`, `--error-bg`, `--error-border` - Error states
- `--warning-color`, `--warning-bg`, `--warning-border` - Warning states
- `--info-color`, `--info-bg`, `--info-border` - Info states

### Gradients

- `--gradient-primary` - Purple to pink gradient
- `--gradient-secondary` - Green to purple gradient
- `--gradient-accent` - Multi-color brand gradient

### UI Elements

- `--radius` - Border radius (8px)
- `--shadow-sm`, `--shadow-md`, `--shadow-lg` - Box shadows
- `--font-sans` - Default font family

## Changing the Color Scheme

To update the color scheme for the entire application:

1. Open `/frontend/src/styles/colors.css`
2. Modify the color values in the `:root` block
3. Save the file
4. All components using these variables will automatically update

### Example: Changing the Primary Color

```css
/* In colors.css */
:root {
  /* Change from green to blue */
  --brand-green: #0099ff; /* Was #00D395 */
  --primary-color: var(--brand-green);
  --primary-hover: #33aaff;
}
```

## Theme Customization

The app includes a comprehensive **Theme Customizer** that allows real-time color customization.

### Using the Theme Customizer

Click the **palette icon** button in the app's header to open the Theme Customizer panel:

- **8 Pre-configured Presets**: Logo Palette, Neon Vibes, Sunset Dream, Ocean Depths, Cyberpunk, Forest Magic, Retro 80s, Minimal Mono
- **Individual Color Control**: Fine-tune all 8 key colors with color pickers
- **Real-time Preview**: Changes apply instantly across the app
- **Auto-save**: Your custom theme persists across sessions

### Light Mode Colors

The color palette includes a light mode variant (activated via `data-theme="light"`) with:

- **Backgrounds**: Pure white with subtle pink tints (`#fef5fb`, `#fde9f7`)
- **Text**: Dark purple for excellent readability
- **Borders**: Brand purple and pink
- **Accents**: Full-strength brand colors for buttons and highlights

### Programmatic Theme Control

You can control themes programmatically:

```tsx
// Switch to light mode (data-theme attribute)
document.documentElement.setAttribute("data-theme", "light");

// Or use the Theme Customizer to apply preset themes
// (see ThemeCustomizer component documentation)
```

## Best Practices

1. **Always use CSS variables** - Never hardcode color values in components
2. **Use semantic names** - Use `--success-color` instead of `--green`
3. **Maintain contrast** - Ensure text is readable against backgrounds
4. **Test both themes** - If implementing light mode, test all components
5. **Use appropriate status colors** - Success (green), Error (red/pink), Warning (yellow), Info (purple)

## Component Examples

### Success Message

```css
.success-message {
  background-color: var(--success-bg);
  color: var(--success-color);
  border: 1px solid var(--success-border);
}
```

### Primary Button

```css
.primary-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.primary-button:hover {
  background-color: var(--primary-hover);
}
```

### Card Component

```css
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
}
```

## Migration Notes

This color system was created to replace the previous blue-gray theme with HabitChain's brand colors. All components have been updated to use these new variables.

If you're adding new components:

- Import `colors.css` in your component's CSS file
- Use the CSS variables instead of hardcoded colors
- Follow the semantic naming conventions

## Support

For questions or issues with the color system, please refer to the main project documentation or create an issue in the repository.

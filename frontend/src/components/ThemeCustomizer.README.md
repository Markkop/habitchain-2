# Theme Customizer

A comprehensive theme customization interface that allows users to preview and switch between different color combinations in real-time.

## Features

### 🎨 Pre-configured Theme Presets

Choose from 8 professionally designed color palettes:

1. **Logo Palette** - Original HabitChain brand colors
2. **Neon Vibes** - Electric neon colors on dark backgrounds
3. **Sunset Dream** - Warm sunset gradient colors
4. **Ocean Depths** - Deep ocean blues and teals
5. **Cyberpunk** - High-tech cyberpunk aesthetic
6. **Forest Magic** - Mystical forest greens and purples
7. **Retro 80s** - Classic 80s synthwave colors
8. **Minimal Mono** - Elegant monochrome with purple accents

### 🎯 Real-time Preview

- All color changes apply instantly across the entire app
- No page refresh needed
- Visual feedback as you customize

### 🔧 Fine-tune Individual Colors

Customize 8 key color variables:

- **Brand Pink** - Main brand color
- **Light Pink** - Accent pink
- **Brand Purple** - Secondary color
- **Brand Green** - Primary actions
- **Background** - Main background
- **BG Light** - Cards & elements
- **BG Hover** - Hover states
- **BG Card** - Card backgrounds

### 💾 Automatic Persistence

- Your custom theme is automatically saved to localStorage
- Theme persists across browser sessions
- No need to manually save changes

### 📱 Responsive Design

- Works seamlessly on desktop, tablet, and mobile
- Touch-friendly color pickers
- Adaptive layout

## Usage

### Opening the Theme Customizer

Click the floating **palette icon** button in the bottom-right corner of the screen.

### Switching Presets

1. Open the Theme Customizer
2. Browse the **Preset Themes** section
3. Click any preset card to apply it instantly
4. The active preset is highlighted with a colored border

### Customizing Colors

1. Scroll to the **Fine-tune Colors** section
2. Each color has:
   - A **color picker** (click the colored square)
   - A **text input** for hex values
   - A **label** and **description**
3. Changes apply in real-time as you adjust colors

### Resetting to Default

Click the **Reset** button in the Preset Themes header to restore the original Logo Palette.

## Technical Details

### Color Variables Updated

The customizer directly updates these CSS custom properties:

```css
--brand-pink
--brand-pink-light
--brand-purple
--brand-green
--bg-color
--bg-light
--bg-hover
--bg-card
```

And derived variables:

```css
--primary-color (uses brand-green)
--primary-hover (uses brand-pink-light)
--secondary-color (uses brand-purple)
--accent-color (uses brand-pink)
--border-color (brand-purple with opacity)
--border-hover (brand-pink-light with opacity)
--border-accent (brand-pink with opacity)
```

### Storage Format

Custom themes are stored in localStorage as JSON:

```json
{
  "colors": {
    "brandPink": "#fc298d",
    "brandPinkLight": "#fe50ae",
    "brandPurple": "#6d0f9b",
    "brandGreen": "#00cb77",
    "bgColor": "#1a0831",
    "bgLight": "#2d1048",
    "bgHover": "#3d1860",
    "bgCard": "#251040"
  },
  "presetId": "logo-palette"
}
```

### Files

- **Component**: `/src/components/ThemeCustomizer.tsx`
- **Presets Config**: `/src/config/themePresets.ts`
- **Styles**: Defined in `/src/App.css`

## Adding New Presets

To add a new theme preset:

1. Open `/src/config/themePresets.ts`
2. Add a new object to the `themePresets` array:

```typescript
{
  id: "your-theme-id",
  name: "Your Theme Name",
  description: "A brief description",
  colors: {
    brandPink: "#ff0000",
    brandPinkLight: "#ff3333",
    brandPurple: "#990099",
    brandGreen: "#00ff00",
    bgColor: "#000000",
    bgLight: "#111111",
    bgHover: "#222222",
    bgCard: "#1a1a1a",
  },
}
```

3. The new preset will automatically appear in the Theme Customizer

## Keyboard Shortcuts

- **Escape** - Close the Theme Customizer panel
- Click outside the panel to close it

## Best Practices

### Color Selection Tips

1. **Contrast**: Ensure text colors have sufficient contrast with backgrounds
2. **Brand Colors**: Keep your brand colors vibrant and consistent
3. **Backgrounds**: Use darker backgrounds for dark mode, lighter for light mode
4. **Hierarchy**: Background shades should progress logically (darkest to lightest)

### Accessibility

- All preset themes are designed with readability in mind
- Custom colors should maintain sufficient contrast ratios
- Test your custom theme with actual content

### Performance

- Color updates are optimized using CSS custom properties
- No re-renders required for theme changes
- Minimal impact on app performance

## Troubleshooting

### Theme Not Persisting

- Check browser localStorage is enabled
- Clear localStorage and try again: `localStorage.clear()`

### Colors Not Updating

- Try refreshing the page
- Check browser console for errors
- Ensure hex values are valid (e.g., `#ff0000`)

### Reset Not Working

- Manually clear theme from localStorage:
  ```javascript
  localStorage.removeItem("customTheme");
  ```
- Refresh the page

## Future Enhancements

Potential features for future versions:

- Export/import custom themes
- Share theme configurations via URL
- Light mode color customization
- More preset themes
- Advanced color harmonies
- Theme marketplace
- Gradient customization
- Animation preferences

## Support

For issues or questions about the Theme Customizer, please refer to the main project documentation or create an issue in the repository.

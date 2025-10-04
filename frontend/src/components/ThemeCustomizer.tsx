import { useState, useEffect } from "react";
import { themePresets, ThemePreset } from "../config/themePresets";
import { X, Palette, RotateCcw } from "lucide-react";

interface ThemeCustomizerProps {
  inline?: boolean;
}

export function ThemeCustomizer({ inline = false }: ThemeCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<ThemePreset>(
    themePresets[0]
  );
  const [customColors, setCustomColors] = useState(themePresets[0].colors);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("customTheme");
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setCustomColors(parsed.colors);
        applyTheme(parsed.colors);
      } catch (error) {
        console.error("Error loading saved theme:", error);
      }
    }
  }, []);

  const applyTheme = (colors: typeof customColors) => {
    const root = document.documentElement;

    // Apply brand colors
    root.style.setProperty("--brand-pink", colors.brandPink);
    root.style.setProperty("--brand-pink-light", colors.brandPinkLight);
    root.style.setProperty("--brand-purple", colors.brandPurple);
    root.style.setProperty("--brand-green", colors.brandGreen);

    // Apply background colors
    root.style.setProperty("--bg-color", colors.bgColor);
    root.style.setProperty("--bg-light", colors.bgLight);
    root.style.setProperty("--bg-hover", colors.bgHover);
    root.style.setProperty("--bg-card", colors.bgCard);

    // Update derived colors
    root.style.setProperty("--primary-color", colors.brandGreen);
    root.style.setProperty("--primary-hover", colors.brandPinkLight);
    root.style.setProperty("--secondary-color", colors.brandPurple);
    root.style.setProperty("--accent-color", colors.brandPink);

    // Update borders with transparency
    root.style.setProperty("--border-color", `${colors.brandPurple}66`);
    root.style.setProperty("--border-hover", `${colors.brandPinkLight}99`);
    root.style.setProperty("--border-accent", `${colors.brandPink}80`);

    // Save to localStorage
    localStorage.setItem(
      "customTheme",
      JSON.stringify({ colors, presetId: currentPreset.id })
    );
  };

  const handlePresetChange = (preset: ThemePreset) => {
    setCurrentPreset(preset);
    setCustomColors(preset.colors);
    applyTheme(preset.colors);
  };

  const handleColorChange = (key: keyof typeof customColors, value: string) => {
    const newColors = { ...customColors, [key]: value };
    setCustomColors(newColors);
    applyTheme(newColors);
  };

  const resetToDefault = () => {
    const defaultPreset = themePresets[0];
    setCurrentPreset(defaultPreset);
    setCustomColors(defaultPreset.colors);
    applyTheme(defaultPreset.colors);
  };

  const colorInputs: Array<{
    key: keyof typeof customColors;
    label: string;
    description: string;
  }> = [
    {
      key: "brandPink",
      label: "Brand Pink",
      description: "Main brand color",
    },
    {
      key: "brandPinkLight",
      label: "Light Pink",
      description: "Accent pink",
    },
    {
      key: "brandPurple",
      label: "Brand Purple",
      description: "Secondary color",
    },
    {
      key: "brandGreen",
      label: "Brand Green",
      description: "Primary actions",
    },
    {
      key: "bgColor",
      label: "Background",
      description: "Main background",
    },
    {
      key: "bgLight",
      label: "BG Light",
      description: "Cards & elements",
    },
    {
      key: "bgHover",
      label: "BG Hover",
      description: "Hover states",
    },
    {
      key: "bgCard",
      label: "BG Card",
      description: "Card backgrounds",
    },
  ];

  return (
    <>
      {/* Theme Button - Inline or Floating */}
      <button
        onClick={() => setIsOpen(true)}
        className={inline ? "theme-customizer-inline" : "theme-customizer-fab"}
        title="Customize Theme"
        aria-label="Open theme customizer"
      >
        <Palette size={inline ? 18 : 24} />
      </button>

      {/* Customizer Panel */}
      {isOpen && (
        <div
          className="theme-customizer-overlay"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="theme-customizer-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="theme-customizer-header">
              <div>
                <h2 className="theme-customizer-title">Theme Customizer</h2>
                <p className="theme-customizer-subtitle">
                  Choose a preset or customize colors
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="theme-customizer-close"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="theme-customizer-content">
              {/* Presets */}
              <div className="theme-section">
                <div className="theme-section-header">
                  <h3 className="theme-section-title">Preset Themes</h3>
                  <button
                    onClick={resetToDefault}
                    className="theme-reset-btn"
                    title="Reset to Logo Palette"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                </div>
                <div className="theme-presets-grid">
                  {themePresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetChange(preset)}
                      className={`theme-preset-card ${
                        currentPreset.id === preset.id ? "active" : ""
                      }`}
                    >
                      <div className="theme-preset-colors">
                        <div
                          className="theme-preset-color"
                          style={{ backgroundColor: preset.colors.brandPink }}
                        />
                        <div
                          className="theme-preset-color"
                          style={{
                            backgroundColor: preset.colors.brandPinkLight,
                          }}
                        />
                        <div
                          className="theme-preset-color"
                          style={{ backgroundColor: preset.colors.brandPurple }}
                        />
                        <div
                          className="theme-preset-color"
                          style={{ backgroundColor: preset.colors.brandGreen }}
                        />
                      </div>
                      <div className="theme-preset-info">
                        <div className="theme-preset-name">{preset.name}</div>
                        <div className="theme-preset-desc">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="theme-section">
                <h3 className="theme-section-title">Fine-tune Colors</h3>
                <div className="theme-colors-grid">
                  {colorInputs.map(({ key, label, description }) => (
                    <div key={key} className="theme-color-input">
                      <div className="theme-color-label-row">
                        <label
                          htmlFor={`color-${key}`}
                          className="theme-color-label"
                        >
                          {label}
                        </label>
                        <span className="theme-color-value">
                          {customColors[key]}
                        </span>
                      </div>
                      <div className="theme-color-desc">{description}</div>
                      <div className="theme-color-picker-row">
                        <input
                          id={`color-${key}`}
                          type="color"
                          value={customColors[key]}
                          onChange={(e) =>
                            handleColorChange(key, e.target.value)
                          }
                          className="theme-color-picker"
                        />
                        <input
                          type="text"
                          value={customColors[key]}
                          onChange={(e) =>
                            handleColorChange(key, e.target.value)
                          }
                          className="theme-color-text"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Info */}
              <div className="theme-preview-info">
                <div className="theme-info-icon">💡</div>
                <div>
                  <strong>Live Preview:</strong> Changes apply instantly to the
                  entire app. Your custom theme is automatically saved.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    brandPink: string;
    brandPinkLight: string;
    brandPurple: string;
    brandGreen: string;
    bgColor: string;
    bgLight: string;
    bgHover: string;
    bgCard: string;
  };
}

export const themePresets: ThemePreset[] = [
  {
    id: "logo-palette",
    name: "Logo Palette",
    description: "Original HabitChain brand colors",
    colors: {
      brandPink: "#fc298d",
      brandPinkLight: "#fe50ae",
      brandPurple: "#6d0f9b",
      brandGreen: "#00cb77",
      bgColor: "#1a0831",
      bgLight: "#2d1048",
      bgHover: "#3d1860",
      bgCard: "#251040",
    },
  },
  {
    id: "neon-vibes",
    name: "Neon Vibes",
    description: "Electric neon colors on dark",
    colors: {
      brandPink: "#ff0080",
      brandPinkLight: "#ff4db8",
      brandPurple: "#9d00ff",
      brandGreen: "#00ff88",
      bgColor: "#0a0015",
      bgLight: "#1a0030",
      bgHover: "#2a0045",
      bgCard: "#1f0038",
    },
  },
  {
    id: "sunset-dream",
    name: "Sunset Dream",
    description: "Warm sunset gradient colors",
    colors: {
      brandPink: "#ff6b9d",
      brandPinkLight: "#ffa0c1",
      brandPurple: "#a855f7",
      brandGreen: "#fbbf24",
      bgColor: "#1e1b4b",
      bgLight: "#312e81",
      bgHover: "#4338ca",
      bgCard: "#2e1065",
    },
  },
  {
    id: "ocean-depths",
    name: "Ocean Depths",
    description: "Deep ocean blues and teals",
    colors: {
      brandPink: "#06b6d4",
      brandPinkLight: "#22d3ee",
      brandPurple: "#0284c7",
      brandGreen: "#10b981",
      bgColor: "#0c1e2e",
      bgLight: "#1a3448",
      bgHover: "#2a4a62",
      bgCard: "#1f3d54",
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "High-tech cyberpunk aesthetic",
    colors: {
      brandPink: "#ff2a6d",
      brandPinkLight: "#ff5c91",
      brandPurple: "#d946ef",
      brandGreen: "#01f9c6",
      bgColor: "#050014",
      bgLight: "#0d0028",
      bgHover: "#15003c",
      bgCard: "#10002e",
    },
  },
  {
    id: "forest-magic",
    name: "Forest Magic",
    description: "Mystical forest greens and purples",
    colors: {
      brandPink: "#c084fc",
      brandPinkLight: "#d8b4fe",
      brandPurple: "#7e22ce",
      brandGreen: "#34d399",
      bgColor: "#14161a",
      bgLight: "#1f2937",
      bgHover: "#374151",
      bgCard: "#2a3441",
    },
  },
  {
    id: "retro-80s",
    name: "Retro 80s",
    description: "Classic 80s synthwave colors",
    colors: {
      brandPink: "#ff00ff",
      brandPinkLight: "#ff66ff",
      brandPurple: "#8b00ff",
      brandGreen: "#00ffff",
      bgColor: "#1a0033",
      bgLight: "#2d0055",
      bgHover: "#400077",
      bgCard: "#330066",
    },
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    description: "Elegant monochrome with purple accents",
    colors: {
      brandPink: "#e879f9",
      brandPinkLight: "#f0abfc",
      brandPurple: "#a855f7",
      brandGreen: "#c4b5fd",
      bgColor: "#18181b",
      bgLight: "#27272a",
      bgHover: "#3f3f46",
      bgCard: "#2d2d32",
    },
  },
];


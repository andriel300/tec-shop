/** @type {import('tailwindcss').Config} */
import { createThemes } from "tw-colors";
import colors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";

// List of base colors to generate themes
const baseColors = [
  "gray",
  "red",
  "yellow",
  "green",
  "blue",
  "indigo",
  "purple",
  "pink",
];

// Mapping of color shades, used to invert shades for dark theme
const shadeMapping = {
  "50": "900",
  "100": "800",
  "200": "700",
  "300": "600",
  "400": "500",
  "500": "400",
  "600": "300",
  "700": "200",
  "800": "100",
  "900": "50",
};

// Function to generate a theme object based on provided colors and shade mapping
const generateThemeObject = (colors, mapping, invert = false) => {
  const theme = {};
  baseColors.forEach((color) => {
    theme[color] = {};
    Object.entries(mapping).forEach(([key, value]) => {
      const shadeKey = invert ? value : key;
      theme[color][key] = colors[color][shadeKey];
    });
  });
  return theme;
};

// Generate light and dark themes
const lightTheme = generateThemeObject(colors, shadeMapping);
const darkTheme = generateThemeObject(colors, shadeMapping, true);

const themes = {
  light: {
    ...lightTheme,
    white: "#ffffff",
  },
  dark: {
    ...darkTheme,
    white: colors.gray["950"],
    black: colors.gray["50"],
  },
};

// Design tokens — aligned with "The Precision Tech Editorial" design system
const designTokens = {
  brand: {
    // primary: #0058BB is the "laser pointer" — use sparingly for the single most important CTA
    primary: {
      DEFAULT: '#0058BB',
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#0058BB',
      700: '#0047A0',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    // primaryContainer: gradient endpoint for the signature CTA gradient (primary → primaryContainer at 135°)
    primaryContainer: '#6C9FFF',
    secondary: {
      DEFAULT: '#5670D5',
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',
      600: '#5670D5',
      700: '#C2410C',
      800: '#9A3412',
      900: '#001453',
    },
    accent: {
      DEFAULT: '#14B8A6',
      400: '#2DD4BF',
      500: '#14B8A6',
      600: '#0D9488',
    },
  },
  ui: {
    background: {
      light: '#FFFFFF',
      dark: '#0B1220',
    },
    // Surface hierarchy (light → dark = lowest → highest physical layer)
    // surface-container-lowest (#FFF) sits on surface-container-low (#EEF1F3) → felt as "lift", not a border
    surface: '#F5F7F9',                    // base page layer
    surfaceContainerLow: '#EEF1F3',        // sections / alternate row tones
    surfaceContainer: '#E5E9EB',           // inset wells
    surfaceContainerLowest: '#FFFFFF',     // cards, floating panels — highest perceived elevation
    surfaceContainerHighest: '#D9DDE0',    // "bottom of a well" / image backdrops (lab-like)
    surfaceDark: '#0F1724',
    muted: '#EEF1F3',
    border: '#E5E7EB',
  },
  text: {
    primary: '#0F1724',
    onSurface: '#2C2F31',      // use instead of #000 — slightly softer, premium contrast
    secondary: '#6B7280',
    inverted: '#FFFFFF',
    muted: '#9CA3AF',
    outlineVariant: '#ABADAF', // "ghost border" at 15% opacity when border is required for a11y
  },
  feedback: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
  },
  elevation: {
    low: '0 1px 2px rgba(15, 23, 36, 0.04)',
    medium: '0 4px 8px rgba(15, 23, 36, 0.06)',
    high: '0 10px 30px rgba(2,6,23,0.12)',
    // ambient: ultra-diffused floating shadow — use for dropdowns / detached panels only
    ambient: '0px 20px 40px rgba(44, 47, 49, 0.06)',
  },
  rounding: {
    sm: '6px',
    md: '10px',
    // lg = 8px — the "architectural" radius. Buttons, cards, inputs use this.
    // Only use pill (9999px) for status badges and notification dots.
    lg: '8px',
    pill: '9999px',
  },
};

const config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Gradients
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // Signature CTA gradient — primary (#0058BB) → primary-container (#6C9FFF) at 135°
        "gradient-signature":
          `linear-gradient(135deg, ${designTokens.brand.primary.DEFAULT}, ${designTokens.brand.primaryContainer})`,
      },

      // Colors from Design Tokens
      colors: {
        'brand-primary': designTokens.brand.primary,
        'primary-container': designTokens.brand.primaryContainer,
        'brand-secondary': designTokens.brand.secondary,
        'brand-accent': {
          DEFAULT: designTokens.brand.accent.DEFAULT,
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: designTokens.brand.accent[400],
          500: designTokens.brand.accent[500],
          600: designTokens.brand.accent[600],
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        // Surface hierarchy tokens — CSS variable backed so they switch with .dark automatically
        'surface': 'var(--surface)',
        'surface-container-low': 'var(--surface-container-low)',
        'surface-container': 'var(--surface-container)',
        'surface-container-lowest': 'var(--surface-container-lowest)',
        'surface-container-highest': 'var(--surface-container-highest)',
        'on-surface': 'var(--on-surface)',
        'outline-variant': 'var(--outline-variant)',
        'ui-background': designTokens.ui.background.light,
        'ui-background-dark': designTokens.ui.background.dark,
        'ui-surface': designTokens.ui.surface,
        'ui-surface-dark': designTokens.ui.surfaceDark,
        'ui-muted': designTokens.ui.muted,
        'ui-divider': designTokens.ui.border,
        'text-primary': designTokens.text.primary,
        'text-secondary': designTokens.text.secondary,
        'text-inverted': designTokens.text.inverted,
        'text-muted': designTokens.text.muted,
        'feedback-success': designTokens.feedback.success,
        'feedback-warning': designTokens.feedback.warning,
        'feedback-error': designTokens.feedback.error,
        'feedback-info': designTokens.feedback.info,
        accent: designTokens.brand.accent.DEFAULT,
      },

      // Typography — dual-typeface system
      // display / Space Grotesk: brand moments, product titles, hero sections, pricing
      // sans   / Inter:          functional data, descriptions, UI controls
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        display: [
          'var(--font-space-grotesk)',
          'var(--font-inter)',
          'ui-sans-serif',
        ],
        heading: [
          'var(--font-space-grotesk)',
          'var(--font-poppins)',
          'var(--font-inter)',
          'ui-sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      // Border Radius — "architectural" profile
      // lg (8px) is the standard for buttons, cards, inputs
      // pill (9999px) only for status indicators and notification badges
      borderRadius: {
        sm: designTokens.rounding.sm,
        md: designTokens.rounding.md,
        lg: designTokens.rounding.lg,
        pill: designTokens.rounding.pill,
      },

      // Box Shadow — tonal layering over drop shadows
      boxShadow: {
        'elev-low': designTokens.elevation.low,
        'elev-md': designTokens.elevation.medium,
        'elev-lg': designTokens.elevation.high,
        // ambient: for dropdowns / floating panels only
        'ambient': designTokens.elevation.ambient,
      },

      // Ring Width
      ringWidth: {
        3: '3px',
      },

      // Container
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
        },
      },

      // Animations
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeInZoom: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'fade-in-zoom': 'fadeInZoom 150ms ease-out',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),

    // tw-colors theme generation
    createThemes(themes),

    // Custom CSS Variables Plugin
    plugin(function({ addBase }) {
      addBase({
        ':root': {
          '--brand-primary': designTokens.brand.primary.DEFAULT,
          '--brand-primary-700': designTokens.brand.primary[700],
          '--primary-container': designTokens.brand.primaryContainer,
          '--brand-secondary': designTokens.brand.secondary.DEFAULT,
          '--brand-accent': designTokens.brand.accent.DEFAULT,
          // Surface hierarchy
          '--surface': designTokens.ui.surface,
          '--surface-container-low': designTokens.ui.surfaceContainerLow,
          '--surface-container': designTokens.ui.surfaceContainer,
          '--surface-container-lowest': designTokens.ui.surfaceContainerLowest,
          '--surface-container-highest': designTokens.ui.surfaceContainerHighest,
          '--on-surface': designTokens.text.onSurface,
          '--outline-variant': designTokens.text.outlineVariant,
          '--ui-background': designTokens.ui.background.light,
          '--ui-surface': designTokens.ui.surface,
          '--ui-divider': designTokens.ui.border,
          '--text-primary': designTokens.text.primary,
          '--text-secondary': designTokens.text.secondary,
          '--feedback-success': designTokens.feedback.success,
          '--feedback-warning': designTokens.feedback.warning,
          '--feedback-error': designTokens.feedback.error,
        },
        '.dark, [data-theme="dark"]': {
          '--brand-primary': designTokens.brand.primary[700],
          '--primary-container': designTokens.brand.primaryContainer,
          '--brand-secondary': designTokens.brand.secondary[500],
          '--brand-accent': designTokens.brand.accent[600] || designTokens.brand.accent.DEFAULT,
          // Surface hierarchy (dark)
          '--surface': designTokens.ui.surfaceDark,
          '--surface-container-low': '#141E2E',
          '--surface-container': '#1A2538',
          '--surface-container-lowest': '#0F1724',
          '--surface-container-highest': '#243044',
          '--on-surface': '#E2E4E6',
          '--outline-variant': '#3A3D3F',
          '--ui-background': designTokens.ui.background.dark,
          '--ui-surface': designTokens.ui.surfaceDark,
          '--ui-divider': '#111827',
          '--text-primary': designTokens.text.inverted,
          '--text-secondary': designTokens.text.muted,
          '--feedback-success': designTokens.feedback.success,
          '--feedback-warning': designTokens.feedback.warning,
          '--feedback-error': designTokens.feedback.error,
        },
      });
    }),

    // Accessibility Plugin
    plugin(function({ addBase }) {
      addBase({
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            'animation-duration': '0.01ms !important',
            'animation-iteration-count': '1 !important',
            'transition-duration': '0.01ms !important',
          },
        },
      });
    }),
  ],
};

export default config;

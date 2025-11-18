/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin');

// Design tokens exported so other tools can import the same palette
const designTokens = {
  brand: {
    primary: {
      DEFAULT: '#1D4ED8', // deep blue (brand main)
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8', // chosen default
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    secondary: {
      DEFAULT: '#F97316', // vibrant orange
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
    accent: {
      DEFAULT: '#14B8A6', // soft teal
      400: '#2DD4BF',
      500: '#14B8A6',
      600: '#0D9488',
    },
  },

  ui: {
    background: {
      light: '#FFFFFF', // page background light
      dark: '#0B1220', // deep neutral for dark mode (not pure black)
    },
    surface: '#F9FAFB', // card / panel background (light)
    surfaceDark: '#0F1724', // card / panel background (dark)
    muted: '#F3F4F6', // muted surfaces
    border: '#E5E7EB', // neutral divider
  },

  text: {
    primary: '#0F1724', // very dark (close to gray-900)
    secondary: '#6B7280',
    inverted: '#FFFFFF',
    muted: '#9CA3AF',
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
  },

  rounding: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    pill: '9999px',
  },
};

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../libs/shared/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // or 'media' if you prefer automatic system preference
  theme: {
    extend: {
      colors: {
        // brand tokens (semantic) - expose full palette for gradients
        'brand-primary': designTokens.brand.primary,
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

        // ui tokens
        'ui-background': designTokens.ui.background.light,
        'ui-background-dark': designTokens.ui.background.dark,
        'ui-surface': designTokens.ui.surface,
        'ui-surface-dark': designTokens.ui.surfaceDark,
        'ui-muted': designTokens.ui.muted,
        'ui-divider': designTokens.ui.border,

        // text tokens (single values)
        'text-primary': designTokens.text.primary,
        'text-secondary': designTokens.text.secondary,
        'text-inverted': designTokens.text.inverted,
        'text-muted': designTokens.text.muted,

        // feedback tokens
        'feedback-success': designTokens.feedback.success,
        'feedback-warning': designTokens.feedback.warning,
        'feedback-error': designTokens.feedback.error,
        'feedback-info': designTokens.feedback.info,

        // small helper aliases
        accent: designTokens.brand.accent.DEFAULT,
      },

      // typography & fonts
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
        heading: [
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

      // radii
      borderRadius: {
        sm: designTokens.rounding.sm,
        md: designTokens.rounding.md,
        lg: designTokens.rounding.lg,
        pill: designTokens.rounding.pill,
      },

      boxShadow: {
        'elev-low': designTokens.elevation.low,
        'elev-md': designTokens.elevation.medium,
        'elev-lg': designTokens.elevation.high,
      },

      // small accessibility helpers
      ringWidth: {
        3: '3px',
      },

      // container defaults
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
        },
      },

      // Custom animations
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

    // Small plugin: expose tokens as CSS variables for use in non-Tailwind CSS
    plugin(function ({ addBase }) {
      addBase({
        ':root': {
          // Brand
          '--brand-primary': designTokens.brand.primary.DEFAULT,
          '--brand-primary-700': designTokens.brand.primary[700],
          '--brand-secondary': designTokens.brand.secondary.DEFAULT,
          '--brand-accent': designTokens.brand.accent.DEFAULT,

          // UI
          '--ui-background': designTokens.ui.background.light,
          '--ui-surface': designTokens.ui.surface,
          '--ui-divider': designTokens.ui.border,

          // Text
          '--text-primary': designTokens.text.primary,
          '--text-secondary': designTokens.text.secondary,

          // Feedback
          '--feedback-success': designTokens.feedback.success,
          '--feedback-warning': designTokens.feedback.warning,
          '--feedback-error': designTokens.feedback.error,
        },

        '[data-theme="dark"]': {
          '--brand-primary': designTokens.brand.primary[700],
          '--brand-secondary': designTokens.brand.secondary[500],
          '--brand-accent':
            designTokens.brand.accent[600] || designTokens.brand.accent.DEFAULT,

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

    // Accessibility: Disable animations for users who prefer reduced motion
    plugin(function ({ addBase }) {
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

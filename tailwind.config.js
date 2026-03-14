// ═══════════════════════════════════════════════════════════════════
// LITECHANGE.ORG — TAILWIND CSS CONFIG v1.0
// Drop this into tailwind.config.js for any LiteChange project.
// Extends (not replaces) the default Tailwind theme.
// ═══════════════════════════════════════════════════════════════════

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {

      // ── COLORS ──────────────────────────────────────────────────
      colors: {
        olive: {
          950: '#0E1009',
          900: '#1B1F15',
          800: '#2A2F22',
          700: '#3A3F32',
          600: '#4E5444',
          500: '#6B7260',
          400: '#8A9080',
          300: '#A8AE9E',
          200: '#C8CCBE',
          100: '#E2E5DB',
          50:  '#F0F2EC',
        },
        paper: {
          950: '#3A3428',
          900: '#5C5244',
          800: '#7A6E5E',
          700: '#998B78',
          600: '#B0A494',
          500: '#C4B8A8',
          400: '#D4C8B6',
          300: '#E4D9C8',
          200: '#F0E6D8',
          100: '#F7F1E8',
          50:  '#FDFAF6',
        },
        lite: {
          950: '#2A3A06',
          900: '#3D5A0A',
          800: '#527A10',
          700: '#6B8A1A',
          600: '#84A422',
          500: '#9ABF30',
          400: '#B0D838',
          300: '#C8FF3C',
          200: '#D8FF72',
          100: '#E8FFA8',
          50:  '#F4FFD6',
        },
        signal: {
          900: '#1A3E54',
          700: '#2D6888',
          500: '#4A90B8',
          300: '#7AB4D4',
          100: '#C4DFF0',
        },
        warm: {
          900: '#5C2210',
          700: '#8A3518',
          500: '#C45A32',
          300: '#E08A68',
          100: '#F4D0C0',
        },
      },

      // ── TYPOGRAPHY ──────────────────────────────────────────────
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', '"Helvetica Neue"', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },

      fontSize: {
        'xs':   ['0.6875rem', { lineHeight: '1.5' }],    // 11px
        'sm':   ['0.8125rem', { lineHeight: '1.5' }],    // 13px
        'base': ['0.9375rem', { lineHeight: '1.5' }],    // 15px
        'md':   ['1.0625rem', { lineHeight: '1.5' }],    // 17px
        'lg':   ['1.25rem',   { lineHeight: '1.4' }],    // 20px
        'xl':   ['1.5rem',    { lineHeight: '1.3' }],    // 24px
        '2xl':  ['1.875rem',  { lineHeight: '1.25' }],   // 30px
        '3xl':  ['2.375rem',  { lineHeight: '1.2' }],    // 38px
        '4xl':  ['3rem',      { lineHeight: '1.15' }],   // 48px
        '5xl':  ['3.75rem',   { lineHeight: '1.1' }],    // 60px
        '6xl':  ['4.5rem',    { lineHeight: '1.05' }],   // 72px
      },

      letterSpacing: {
        tighter: '-0.02em',
        tight:   '-0.01em',
        normal:  '0',
        wide:    '0.02em',
        wider:   '0.05em',
        caps:    '0.1em',
      },

      // ── SPACING & SIZING ────────────────────────────────────────
      maxWidth: {
        'prose':   '680px',
        'content': '1140px',
        'wide':    '1440px',
      },

      // ── BORDER RADIUS ───────────────────────────────────────────
      borderRadius: {
        'sm':   '6px',
        'md':   '10px',
        'lg':   '16px',
        'xl':   '24px',
      },

      // ── SHADOWS ─────────────────────────────────────────────────
      boxShadow: {
        'sm':  '0 1px 2px rgba(27, 31, 21, 0.05)',
        'md':  '0 4px 12px rgba(27, 31, 21, 0.08)',
        'lg':  '0 12px 40px rgba(27, 31, 21, 0.1)',
        'xl':  '0 24px 80px rgba(27, 31, 21, 0.14)',
        // Dark mode shadows (use via dark: prefix)
        'dark-sm':  '0 1px 2px rgba(0, 0, 0, 0.2)',
        'dark-md':  '0 4px 12px rgba(0, 0, 0, 0.3)',
        'dark-lg':  '0 12px 40px rgba(0, 0, 0, 0.35)',
        'dark-xl':  '0 24px 80px rgba(0, 0, 0, 0.45)',
      },

      // ── TRANSITIONS ─────────────────────────────────────────────
      transitionDuration: {
        'fast':   '120ms',
        'normal': '200ms',
        'slow':   '350ms',
        'slower': '500ms',
      },

      transitionTimingFunction: {
        'default': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ── Z-INDEX ─────────────────────────────────────────────────
      zIndex: {
        'dropdown': '100',
        'sticky':   '200',
        'overlay':  '300',
        'modal':    '400',
        'popover':  '500',
        'toast':    '600',
        'tooltip':  '700',
      },

      // ── ANIMATION ───────────────────────────────────────────────
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.08)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up':        'fade-up 0.5s ease-out forwards',
        'fade-in':        'fade-in 0.3s ease-out forwards',
        'pulse-glow':     'pulse-glow 4s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
      },
    },
  },
};

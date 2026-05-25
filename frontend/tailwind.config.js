/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: (() => {
        // Bind every brand/surface token to a CSS variable defined in index.css.
        // Wrapping in rgb(var(--x) / <alpha-value>) lets Tailwind alpha modifiers
        // (bg-secondary/20, ring-secondary/30, etc.) keep working, and means
        // toggling the `dark` class on <html> recolors the entire UI in one shot.
        const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
        const tokens = [
          'background', 'surface', 'surface-dim', 'surface-bright',
          'surface-container-lowest', 'surface-container-low', 'surface-container',
          'surface-container-high', 'surface-container-highest', 'surface-variant',
          'surface-tint', 'on-surface', 'on-surface-variant', 'on-background',
          'inverse-surface', 'inverse-on-surface',
          'primary', 'on-primary', 'primary-container', 'on-primary-container',
          'primary-fixed', 'primary-fixed-dim', 'on-primary-fixed',
          'on-primary-fixed-variant', 'inverse-primary',
          'secondary', 'on-secondary', 'secondary-container', 'on-secondary-container',
          'secondary-fixed', 'secondary-fixed-dim', 'on-secondary-fixed',
          'on-secondary-fixed-variant',
          'tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container',
          'tertiary-fixed', 'tertiary-fixed-dim', 'on-tertiary-fixed',
          'on-tertiary-fixed-variant',
          'error', 'on-error', 'error-container', 'on-error-container',
          'outline', 'outline-variant',
          'professional-blue', 'match-green', 'info-blue',
          'success', 'success-container', 'warning',
        ];
        return Object.fromEntries(tokens.map((name) => [name, v(name)]));
      })(),
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.55' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shimmer:          'shimmer 1.4s ease-in-out infinite',
        'fade-in':        'fade-in 200ms ease-out both',
        'fade-up':        'fade-up 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in':       'scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slide-in-right 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-soft':     'pulse-soft 2s ease-in-out infinite',
        float:            'float 4s ease-in-out infinite',
      },
      spacing: {
        unit: '4px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
        'stack-xl': '48px',
        'stack-gap': '16px',
        gutter: '24px',
        'card-padding': '24px',
        'margin-desktop': '48px',
        'sidebar-width': '260px',
        'container-max-width': '1280px',
      },
      maxWidth: {
        container: '1280px',
        'container-max-width': '1280px',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        ambient: '0px 4px 20px rgba(15, 23, 42, 0.05)',
        hover: '0px 10px 30px rgba(15, 23, 42, 0.10)',
        overlay: '0px 24px 80px rgba(15, 23, 42, 0.28)',
        'ambient-lvl1': '0px 4px 20px rgba(15, 23, 42, 0.05)',
        'ambient-lvl2': '0px 10px 30px rgba(15, 23, 42, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        h1: ['Inter', 'system-ui', 'sans-serif'],
        h2: ['Inter', 'system-ui', 'sans-serif'],
        h3: ['Inter', 'system-ui', 'sans-serif'],
        'body-lg': ['Inter', 'system-ui', 'sans-serif'],
        'body-md': ['Inter', 'system-ui', 'sans-serif'],
        'body-sm': ['Inter', 'system-ui', 'sans-serif'],
        'label-md': ['Inter', 'system-ui', 'sans-serif'],
        'label-sm': ['Inter', 'system-ui', 'sans-serif'],
        'ai-score': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        h1: ['36px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '1.2', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '600' }],
        'ai-score': ['20px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
    },
  },
  plugins: [require('tailwindcss-rtl')],
};

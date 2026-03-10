/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy aliases kept so any remaining className refs don't break
        brand: {
          300: '#00d4ff',
          400: '#00d4ff',
          500: '#00d4ff',
          600: '#00b8e0',
          700: '#0099c0',
        },
        surface: {
          950: '#000000',
          900: '#0a0a0a',
          800: '#111111',
          700: '#161616',
          600: '#1e1e1e',
          500: '#2a2a2a',
          400: '#555555',
          300: '#888888',
          200: '#e0e0e0',
        },
        cyan: '#00d4ff',
      },

      fontFamily: {
        sans: ['JetBrains Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      boxShadow: {
        'glow':     '0 0 20px rgba(0,212,255,0.25)',
        'glow-sm':  '0 0 10px rgba(0,212,255,0.15)',
        'card':     '0 4px 24px rgba(0,0,0,0.6)',
      },

      animation: {
        'fade-in':      'fadeIn 0.4s ease both',
        'fade-up':      'fadeUp 0.4s ease both',
        'blink':        'blink 1s step-end infinite',
        'pulse-cyan':   'pulseCyan 2s ease-in-out infinite',
        'spin':         'spin 0.8s linear infinite',
      },

      keyframes: {
        fadeIn:     { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        fadeUp:     { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'none' } },
        blink:      { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        pulseCyan:  { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        spin:       { to: { transform: 'rotate(360deg)' } },
      },

      borderRadius: {
        DEFAULT: '0px',
        none:    '0px',
        sm:      '0px',
        md:      '0px',
        lg:      '0px',
        xl:      '0px',
        '2xl':   '0px',
        '3xl':   '0px',
        full:    '9999px', // kept only for toggle/dot elements
      },

      backgroundImage: {
        // Fine-line grid used on landing/auth pages
        'grid': "url(\"data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Cpath d='M0 0h48v1H0zM0 0h1v48H0z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
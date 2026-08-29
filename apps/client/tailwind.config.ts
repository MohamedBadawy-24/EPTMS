import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        scb: {
          blue: '#0047BA',
          'blue-hover': '#003896',
          'blue-light': '#EBF2FF',
          dark: '#4A4F54',
          'dark-muted': '#6C7278',
          warm: '#D6D1CA',
          'warm-light': '#EAE6E1',
          offwhite: '#F5F3F0',
        },
        rag: {
          green: '#22C55E',
          'green-bg': '#DCFCE7',
          'green-text': '#15803D',
          amber: '#F59E0B',
          'amber-bg': '#FEF3C7',
          'amber-text': '#B45309',
          red: '#EF4444',
          'red-bg': '#FEE2E2',
          'red-text': '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;

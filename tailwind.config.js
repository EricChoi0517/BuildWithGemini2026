/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        echo: {
          bg: '#0A0A0F',
          surface: '#12121A',
          card: '#1A1A25',
          border: '#2A2A3A',
          accent: '#6C63FF',
          'accent-dim': '#4A4280',
          text: '#E8E6F0',
          'text-muted': '#8885A0',
          'text-dim': '#5A576E',
          green: '#4ADE80',
          amber: '#FBBF24',
          red: '#F87171',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        echo: {
          bg: '#F8F8FC',
          surface: '#FFFFFF',
          card: '#EDE9FE',
          border: '#DDD8F0',
          accent: '#7C6CFF',
          'accent-dim': '#A498FF',
          text: '#1E1B2E',
          'text-muted': '#5B5675',
          'text-dim': '#8E88A5',
          green: '#22C55E',
          amber: '#F59E0B',
          red: '#EF4444',
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

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        echo: {
          bg: '#F5F0E8',
          surface: '#FFFCF7',
          sidebar: '#EFE8DD',
          card: '#E8DFD2',
          border: '#D9CFC0',
          accent: '#6B5B9E',
          'accent-dim': '#8B7CB8',
          text: '#2C2720',
          'text-muted': '#6B6358',
          'text-dim': '#9A9085',
          green: '#3D8B5C',
          amber: '#C4873A',
          red: '#C45C5C',
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

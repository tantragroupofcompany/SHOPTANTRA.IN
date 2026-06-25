/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-navy': {
          DEFAULT: '#0a2540',
          dark: '#030d1a',
          light: '#1e3a5f',
        },
        'brand-orange': {
          DEFAULT: '#f76b00',
          hover: '#e05e00',
          light: '#fff5ed',
        },
        'brand-gold': '#d97706',
      },
    },
  },
  plugins: [],
};


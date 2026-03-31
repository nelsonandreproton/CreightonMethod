/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Creighton stamp colors
        stamp: {
          red: '#DC2626',
          green: '#16A34A',
          white: '#FFFFFF',
          yellow: '#EAB308',
          brown: '#92400E',
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: '#FE8784',
        peach: '#FDC17C',
        turquoise: '#30D7C4',
        slate: '#607ABB',
      },
    },
  },
  plugins: [],
};
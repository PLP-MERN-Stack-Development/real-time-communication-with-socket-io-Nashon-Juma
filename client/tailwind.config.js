/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8f3',
          100: '#f8ecdf',
          200: '#f0d5b8',
          300: '#e5b788',
          400: '#d98f56',
          500: '#c4a338', // Secondary color
          600: '#b07437',
          700: '#8f572e',
          800: '#461400', // Primary color
          900: '#3c1200',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
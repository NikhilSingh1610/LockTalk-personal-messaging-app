/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <-- Correct key for enabling class-based dark mode
  theme: {
    extend: {},
  },
  plugins: [],
};


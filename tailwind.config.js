/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'fifa-green': '#00ff88',
        'fifa-blue': '#0066ff',
        'fifa-gold': '#ffd700',
        'fifa-dark': '#1a1a1a',
        'fifa-card': '#2d3748'
      },
      fontFamily: {
        'fifa': ['Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}
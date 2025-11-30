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
        'sans': ['Outfit', 'sans-serif'],
        'fifa': ['Outfit', 'sans-serif']
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sport: ['Oswald', 'sans-serif'],
      },
      colors: {
        'lab-dark': '#0f172a',
        'lab-panel': '#1e293b',
      },
      animation: {
        'bounce-short': 'bounce 1s infinite 3',
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'case-navy': '#1e3a8a',
        'case-orange': '#fb923c',
        'case-dark': '#1a1a2e',
        primary: '#1e3a8a',
        secondary: '#f1f5f9',
      },
    },
  },
  plugins: [],
}

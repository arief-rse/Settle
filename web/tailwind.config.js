/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'tighter-plus': '-0.075em',
      },
      fontWeight: {
        'medium-plus': '550',
      },
    },
  },
  plugins: [],
} 
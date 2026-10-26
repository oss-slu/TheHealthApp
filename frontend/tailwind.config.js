/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        health: {
          primary: '#0f766e',
          secondary: '#059669',
          good: '#10b981',
          warning: '#f59e0b',
          critical: '#ef4444',
          surface: '#f0fdfa',
        }
      },
    },
  },
  plugins: [],
}
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
          primary: '#0f766e',   // (Teal)
          secondary: '#059669', // (Emerald)
          good: '#10b981',      // Normal (Greem)
          warning: '#f59e0b',   // Caution (Orange)
          critical: '#ef4444',  // Danger (Red)
          surface: '#f0fdfa',   // Background (Teal-50)
        }
      }
    },
  },
  plugins: [],
}
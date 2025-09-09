/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#2e7d32",
          light: "#e8f5e9"
        }
      }
    }
  },
  plugins: [],
};



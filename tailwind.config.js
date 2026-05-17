/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinic: {
          blue: '#1d4ed8',
          'blue-dark': '#1e3a8a',
          'blue-light': '#dbeafe',
          'blue-mid': '#2563eb',
        }
      },
    },
  },
  plugins: [],
}


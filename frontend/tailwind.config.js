/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chatBg: '#120f1e',
        sidebarBg: 'rgba(25, 23, 40, 0.7)',
        bubblePrimary: 'rgba(124, 88, 252, 0.8)',
        bubbleSecondary: 'rgba(45, 41, 70, 0.8)',
        accent: '#9d7cff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        'md': '12px',
        'lg': '20px',
      }
    },
  },
  plugins: [],
}

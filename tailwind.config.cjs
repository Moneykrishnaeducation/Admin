/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: '#FFD700',
      },
      boxShadow: {
        gold: '0 0 18px rgba(255,215,0,0.18)',
      },
    },
  },
  plugins: [],
  safelist: [
    'text-yellow-400', 'bg-yellow-500', 'bg-yellow-400',
    'text-white', 'text-black', 'bg-black', 'bg-white',
    'shadow-[0_0_10px_rgba(255,215,0,0.6)]', 'shadow-[0_0_12px_rgba(255,215,0,0.5)]',
    'text-gold', 'bg-gold', 'border-gold', 'shadow-gold'
  ],
}

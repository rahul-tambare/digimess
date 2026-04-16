/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF6B35',
          light: '#FF8A5C',
          dark: '#E55A2B',
          bg: 'rgba(255, 107, 53, 0.08)',
          bg2: 'rgba(255, 107, 53, 0.15)',
        },
        accent: {
          DEFAULT: '#2D6A4F',
          light: '#40916C',
          bg: 'rgba(45, 106, 79, 0.08)',
        },
        dark: {
          surface: '#1E293B',
          surfaceLight: '#334155',
          text: '#E2E8F0',
          textSecondary: '#94A3B8',
        },
        surface: '#FFFFFF',
        background: '#F8FAFC',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}

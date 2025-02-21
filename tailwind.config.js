import { colors } from './src/styles/colors.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        background: colors.background,
        text: colors.text,
        accent1: colors.accent1,
        accent2: colors.accent2,
        accent3: colors.accent3,
        accent4: colors.accent4,
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Habilitando o modo escuro
}
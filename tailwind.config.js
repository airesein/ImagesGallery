/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        divider: "var(--divider)",
        content1: "var(--content1)",
        content2: "var(--content2)",
        content3: "var(--content3)",
        primary: {
          DEFAULT: "#006FEE",
          foreground: "#FFFFFF",
        },
        focus: "#006FEE",
      },
      borderRadius: {
        large: "14px",
        medium: "12px",
        small: "8px",
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
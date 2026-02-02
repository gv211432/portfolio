/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Legacy colors (keep for existing pages)
        primaryDark: '#313854',
        primary: '#8b94cb',
        secondary: '#f0f0f0',
        light: '#ffffff',
        accent: '#ff4081',
        primaryGray: '#444A6E',
        // Luxury Tech Palette for main landing page
        obsidian: {
          DEFAULT: '#0D0D0D',
          50: '#1A1A1A',
          100: '#141414',
          200: '#0D0D0D',
          300: '#080808',
          400: '#050505',
        },
        gold: {
          DEFAULT: '#C9A962',
          50: '#F5EFE0',
          100: '#EDE3CA',
          200: '#DECE9F',
          300: '#D4BC7F',
          400: '#C9A962',
          500: '#B8954A',
          600: '#9A7B3A',
        },
        cyan: {
          DEFAULT: '#00D9FF',
          50: '#E0FAFF',
          100: '#B3F3FF',
          200: '#80ECFF',
          300: '#4DE5FF',
          400: '#1ADEFF',
          500: '#00D9FF',
          600: '#00B8D9',
        },
        carbon: '#121212',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'marquee': "marquee 25s linear infinite",
        'fade-in': 'fadeIn 1s ease forwards',
        'blink': 'blink 1s step-end infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'data-flow': 'dataFlow 3s linear infinite',
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in": {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 169, 98, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(201, 169, 98, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        dataFlow: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
};

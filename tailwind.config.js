/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/data/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Category info dynamic classes for whitelabel products & opensource projects
    'text-cyan', 'bg-cyan/10', 'border-cyan/30',
    'text-green-400', 'bg-green-400/10', 'border-green-400/30',
    'text-pink-400', 'bg-pink-400/10', 'border-pink-400/30',
    'text-amber-400', 'bg-amber-400/10', 'border-amber-400/30',
    'text-purple-400', 'bg-purple-400/10', 'border-purple-400/30',
    'text-blue-400', 'bg-blue-400/10', 'border-blue-400/30',
    'text-emerald-400', 'bg-emerald-400/10', 'border-emerald-400/30',
    'text-orange-400', 'bg-orange-400/10', 'border-orange-400/30',
    'text-indigo-400', 'bg-indigo-400/10', 'border-indigo-400/30',
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

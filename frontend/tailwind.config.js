/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', 
        secondary: '#64748b',
        danger: '#ef4444',
        success: '#22c55e',
        // Premium Dark Theme Colors
        'dark-bg': '#020617', // Slate 950
        'glass-surface': 'rgba(255, 255, 255, 0.03)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'accent-glow': '#8b5cf6', // Violet
      },
      animation: {
        'spin-slow': 'spin 15s linear infinite',
        blob: 'blob 7s infinite',
        'pulse-glow': 'pulse-glow 3s infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        }
      },
    },
  },
  plugins: [],
}

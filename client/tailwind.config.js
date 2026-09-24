/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#090d16',
        panelBg: '#0f172a',
        borderCol: '#1e293b',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985'
        }
      },
      keyframes: {
        slideInTop: {
          '0%': { transform: 'translateY(-40px) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' }
        },
        slideOutTop: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-40px) scale(0.9)', opacity: '0' }
        },
        slideInRight: {
          '0%': { transform: 'translateX(40px) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' }
        },
        slideOutLeft: {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateX(-40px) scale(0.9)', opacity: '0' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(56, 189, 248, 0.5)' },
          '50%': { boxShadow: '0 0 25px rgba(56, 189, 248, 0.9)' }
        }
      },
      animation: {
        'slide-in-top': 'slideInTop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-out-top': 'slideOutTop 0.3s ease-in forwards',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-out-left': 'slideOutLeft 0.3s ease-in forwards',
        'pulse-glow': 'pulseGlow 2s infinite'
      }
    },
  },
  plugins: [],
}

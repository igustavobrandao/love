/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: { 
          primary: '#FF6B6B',
          background: '#202026',
          foreground: '#FFFFFF',
        },
        animation: { 
          pulse: 'pulse 2s ease-in-out infinite',
          heartFall: 'heartFall var(--duration, 5s) linear var(--delay, 0s) forwards',
          'dash-fade': 'dashFade 150ms ease-out',
          'dash-pop': 'dashPop 180ms ease-out',
          'dash-toast': 'dashToast 220ms ease-out',
          'dash-pulse': 'dashPulse 1.4s ease-in-out infinite',
          'dash-shimmer': 'dashShimmer 1.2s linear infinite',
        },
        keyframes: { 
          dashFade: { from: { opacity: '0' }, to: { opacity: '1' } },
          dashPop: {
            from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
            to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
          },
          dashToast: {
            from: { opacity: '0', transform: 'translateY(12px)' },
            to: { opacity: '1', transform: 'translateY(0)' },
          },
          dashPulse: { '0%, 100%': { opacity: '0.35' }, '50%': { opacity: '0.7' } },
          dashShimmer: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
          pulse: {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
          },
          heartFall: {
            '0%': {
              transform: 'translateY(0) rotate(0deg)',
              opacity: '1',
            },
            '100%': {
              transform: 'translateY(calc(100vh + 100px)) rotate(360deg)',
              opacity: '0',
            },
          }
        }
      },
    },
    plugins: [],
  }
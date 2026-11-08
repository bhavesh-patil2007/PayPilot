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
        obsidian: {
          950: '#06090e',
          900: '#0a0f18',
          850: '#0e1522',
          800: '#141c2c',
          750: '#1a2438',
          700: '#222f46',
          600: '#334460',
        },
        paypal: {
          blue: '#0070ba',
          dark: '#003087',
          cyan: '#00cfde',
          light: '#e6f4fc',
        },
        fintech: {
          green: '#10b981',
          emerald: '#059669',
          amber: '#f59e0b',
          red: '#ef4444',
          rose: '#f43f5e',
          purple: '#8b5cf6',
          indigo: '#6366f1',
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-paypal': '0 0 20px -5px rgba(0, 112, 186, 0.4)',
        'glow-cyan': '0 0 20px -5px rgba(0, 207, 222, 0.4)',
        'glow-green': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
        'glow-purple': '0 0 20px -5px rgba(139, 92, 246, 0.4)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
};

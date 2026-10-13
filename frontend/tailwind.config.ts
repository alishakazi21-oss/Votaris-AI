import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        border: 'var(--border)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        'accent-green': 'var(--accent-green)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-amber': 'var(--accent-amber)',
        'accent-red': 'var(--accent-red)',
        'accent-violet': 'var(--accent-violet)',
        'accent-orange': '#FB923C',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl: '0.75rem',
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        glow: '0 0 15px -3px rgba(34, 211, 238, 0.15)',
      }
    },
  },
  plugins: [],
} satisfies Config

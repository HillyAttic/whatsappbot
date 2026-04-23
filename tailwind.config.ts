import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sidebar — deep charcoal, not pure black
        sidebar: {
          DEFAULT: '#0f1117',
          hover: '#1a1d27',
          active: '#232733',
          border: '#1e2230',
        },
        // Accent — burnt orange / rust
        accent: {
          DEFAULT: '#e8590c',
          hover: '#d9480f',
          light: '#fff4e6',
          muted: 'rgba(232,89,12,0.12)',
        },
        // Teal secondary accent
        teal: {
          DEFAULT: '#0c8599',
          hover: '#0b7285',
          light: '#e6fcf5',
          muted: 'rgba(12,133,153,0.12)',
        },
        // Surface — warm off-white / cream
        surface: {
          DEFAULT: '#faf6f1',
          card: '#ffffff',
          hover: '#f0ebe3',
          border: '#e6ded2',
        },
        // Ink — near-black with warm tone
        ink: {
          DEFAULT: '#1a1626',
          secondary: '#5c5470',
          muted: '#9b94a8',
          inverse: '#faf6f1',
        },
        // Semantic
        success: {
          DEFAULT: '#2b8a3e',
          hover: '#237032',
          light: 'rgba(43,138,62,0.1)',
        },
        danger: {
          DEFAULT: '#c92a2a',
          hover: '#a61e1e',
          light: 'rgba(201,42,42,0.1)',
        },
        warning: {
          DEFAULT: '#e67700',
          hover: '#d06600',
          light: 'rgba(230,119,0,0.1)',
        },
        // Gold accent for highlights
        gold: {
          DEFAULT: '#f59f00',
          light: '#fff3bf',
        },
      },
      fontFamily: {
        // Display: Syne — geometric, high-contrast, architectural
        display: ['"Syne"', 'sans-serif'],
        // Body: IBM Plex Sans — clean, neutral, distinctive
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        // Mono: IBM Plex Mono — for phone numbers and data
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26,22,38,0.06), 0 1px 2px rgba(26,22,38,0.04)',
        'card-hover': '0 4px 16px rgba(26,22,38,0.08), 0 2px 6px rgba(26,22,38,0.04)',
        'modal': '0 24px 64px rgba(26,22,38,0.18), 0 8px 24px rgba(26,22,38,0.10)',
        'sidebar': '4px 0 32px rgba(0,0,0,0.18)',
        'bold': '0 4px 0 rgba(26,22,38,0.9)',
        'glow-accent': '0 0 20px rgba(232,89,12,0.25)',
        'glow-teal': '0 0 20px rgba(12,133,153,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        'panel-in': 'panelIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        'stagger-in': 'staggerIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up-sm': 'slideUpSm 0.2s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUpSm: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        panelIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        staggerIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(232,89,12,0.15)' },
          '50%': { boxShadow: '0 0 24px rgba(232,89,12,0.35)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

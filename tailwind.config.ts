import type { Config } from 'tailwindcss'

export default {
  // v4 自动检测源码，content 可删
  // content: ['./src/**/*.{ts,tsx,css}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e80ff',
        default: '#d1d5db',
        warning: '#faad14',
        success: '#52c41a',
        error:   '#ff4d4f',
        info:    '#13c2c2',
        bg:      '#f7f8fa',
        // Dark navigation palette with clearer depth cues
        nav: '#1e293b',
        'nav-deep': '#0f172a',
        'nav-hover': '#334155',
        'nav-sub': '#273449',
        'nav-sub-hover': '#3a4c66',
        // Navigation foreground tokens (avoid raw white/gray)
        'nav-fg': '#e5e7eb',        // slate-200
        'nav-fg-muted': '#cbd5e1',  // slate-300
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans CJK SC', 'sans-serif'],
      },
    },
  },
} satisfies Config




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
        nav: '#1f2937',
        'nav-deep': '#111827',
        'nav-hover': '#4b5563',
        'nav-sub': '#374151',
        'nav-sub-hover': '#4b5563',
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans CJK SC', 'sans-serif'],
      },
    },
  },
} satisfies Config




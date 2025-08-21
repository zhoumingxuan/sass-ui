import type { Config } from 'tailwindcss';

export default {
  // Include CSS files so that utilities used with `@apply` are recognized
  content: ['./src/**/*.{ts,tsx,css}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e80ff',
        default: '#d1d5db',
        warning: '#faad14',
        success: '#52c41a',
        error: '#ff4d4f',
        info: '#13c2c2',
        bg: '#f7f8fa',
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans CJK SC', 'sans-serif'],
      },
    },
  },
} satisfies Config;

import type { Config } from 'tailwindcss';

export default {
  // Include CSS files so that utilities used with `@apply` are recognized
  content: ['./src/**/*.{ts,tsx,css}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e80ff',
        secondary: '#13c2c2',
        danger: '#ff4d4f',
        bg: '#f7f8fa',
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans CJK SC', 'sans-serif'],
      },
    },
  },
} satisfies Config;

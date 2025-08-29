import type { Config } from 'tailwindcss'

export default {
  // v4 自动检测源码，content 可删
  // content: ['./src/**/*.{ts,tsx,css}'],
  theme: {
    extend: {
      spacing: {
        // Single source of truth for app header/nav height
        header: '2.75rem', // 44px, slightly shorter
        // Sidebar widths
        sidebar: '14rem', // 224px
        'sidebar-collapsed': '4rem', // 64px
        // Modal default width
        modal: '25rem', // 400px
        // Component-specific fixed paddings
        indent72: '72px',
        indent88: '88px',
        // Inputs
        'date-input': '180px',
      },
      boxShadow: {
        header: '0 6px 12px -6px rgba(0,0,0,0.12)',
        sidebar: '8px 0 16px -14px rgba(2,6,23,0.45)',
      },
      fontSize: {
        15: '15px',
      },
      minWidth: {
        'message': '200px',
      },
      maxWidth: {
        'message': '80vw',
      },
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
        // App-specific sidebar segmentation (header/body/footer)
        // Header/Footer: subtle translucent layer for glass effect, slightly darker than before
        'nav-header': 'rgba(255, 255, 255, 0.01)',
        'nav-footer': 'rgba(255, 255, 255, 0.01)',
        // Body: central, darker surface to anchor content
        'nav-body':   '#0b1526',
        // Scrollbar design tokens
        'sb-thumb': 'rgba(156, 163, 175, 0.55)',
        'sb-thumb-hover': 'rgba(107, 114, 128, 0.65)',
        'sb-thumb-active': 'rgba(55, 65, 81, 0.75)',
        'sb-thumb-sidebar-hover': 'rgba(203, 213, 225, 0.34)',
        'sb-thumb-sidebar-active': 'rgba(203, 213, 225, 0.52)',
        'sb-track-sidebar': 'rgba(30, 41, 59, 0.22)',
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans CJK SC', 'sans-serif'],
      },
    },
  },
} satisfies Config

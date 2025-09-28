'use client';

// Unified form control styles for consistent UX across inputs
export const inputBase = [
  'w-full rounded-lg border border-gray-200 bg-white placeholder:text-gray-400 transition-[box-shadow,border-color]',
  'hover:border-gray-300',
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary/20',
  'shadow-none',
].join(' ');

// Labels: keep legible size and tone to match inputs
export const fieldLabel = 'mb-1 block text-sm text-gray-600';
export const helperText = 'mt-1 block text-xs text-gray-400';
export const errorText = 'mt-1 block text-xs text-error';
export const fieldWrapper = 'block';

// Tokens for small control elements (checkbox, radio, switch, slider thumbs)
export const controlRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60';
export const controlDisabled = 'opacity-50 cursor-not-allowed';

// Input status helpers for error/warning/success/info rings and borders
export type Status = 'error' | 'warning' | 'success' ;
export const inputStatus: Record<Status, string> = {
  // 错误态：强制覆盖基础样式的边框/环颜色（包括 hover / focus）
  error: '!border-error hover:border-error focus:!border-error !ring-error/30 focus:!ring-error/30',
  warning: '!border-warning hover:border-warning focus:!border-warning !ring-warning/30 focus:!ring-warning/30',
  success: '!border-success hover:border-success focus:!border-success !ring-success/30 focus:!ring-success/30',
};

// Unified input sizing without px font sizes
export type InputSize = 'sm' | 'md' | 'lg';
export const inputSize: Record<InputSize, string> = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

// Right padding presets for inputs with trailing icons/controls
export const inputPR: Record<InputSize, string> = {
  sm: 'pr-8',
  md: 'pr-10',
  lg: 'pr-12',
};

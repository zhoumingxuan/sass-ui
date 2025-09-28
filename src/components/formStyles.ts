'use client';

// Unified form control styles for consistent UX across inputs
export const inputBase = [
  'w-full rounded-lg border border-gray-200 bg-white placeholder:text-gray-400 transition-[box-shadow,border-color]',
  'hover:border-gray-300',
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
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
// Design note: to avoid using !important, we explicitly override base
// hover/focus border colors with the same variants and place these
// classes after `inputBase` in consumers.
export type Status = 'error' | 'warning' | 'success';
export const inputStatus: Record<Status, string> = {
  error: '!border-error hover:border-error focus-visible:ring-1 focus-visible:ring-error/40',
  warning: '!border-warning hover:border-warning focus-visible:ring-1 focus-visible:ring-warning/40',
  success: '!border-success hover:border-success focus-visible:ring-1 focus-visible:ring-success/40'
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

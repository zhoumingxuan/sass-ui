'use client';

// Unified form control styles for consistent UX across inputs
export const inputBase = [
  'w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm placeholder:text-gray-400 transition-[box-shadow,border-color]',
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
export type Status = 'error' | 'warning' | 'success' | 'info';
export const inputStatus: Record<Status, string> = {
  error: 'border-error focus:ring-error/20',
  warning: 'border-warning focus:ring-warning/20',
  success: 'border-success focus:ring-success/20',
  info: 'border-info focus:ring-info/20',
};

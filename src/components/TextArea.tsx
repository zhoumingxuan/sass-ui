'use client';

import { TextareaHTMLAttributes } from 'react';
import { inputBase, fieldLabel, helperText, inputStatus, Status, InputSize, inputSize } from './formStyles';

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & {
  label?: string;
  helper?: string;
  autoGrow?: boolean;
  status?: Status;
  size?: InputSize; // lg | md | sm
};

export default function TextArea({ label, helper, autoGrow = false, status, className = '', onChange, size = 'md', ...props }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoGrow) {
      e.currentTarget.style.height = 'auto';
      e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
    }
    onChange?.(e);
  };

  return (
    <label className="block">
      {label && <span className={fieldLabel}>{label}</span>}
      <textarea
        aria-invalid={status === 'error' ? true : undefined}
        className={[inputBase, inputSize[size], status ? inputStatus[status] : '', 'min-h-24 py-2 resize-y', className].filter(Boolean).join(' ')}
        onChange={handleChange}
        {...props}
      />
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}


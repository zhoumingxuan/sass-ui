'use client';

import { TextareaHTMLAttributes } from 'react';
import { inputBase, fieldLabel, helperText, inputStatus, Status } from './formStyles';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helper?: string;
  autoGrow?: boolean;
  status?: Status;
};

export default function TextArea({ label, helper, autoGrow = false, status, className = '', onChange, ...props }: Props) {
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
        className={[inputBase, status ? inputStatus[status] : '', 'min-h-24 py-2 resize-y', className].filter(Boolean).join(' ')}
        onChange={handleChange}
        {...props}
      />
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}


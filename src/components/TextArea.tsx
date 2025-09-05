'use client';

import { TextareaHTMLAttributes } from 'react';
import { inputBase, fieldLabel, helperText } from './formStyles';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helper?: string;
  autoGrow?: boolean;
};

export default function TextArea({ label, helper, autoGrow = false, className = '', onChange, ...props }: Props) {
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
        className={[inputBase, 'min-h-24 py-2 resize-y', className].join(' ')}
        onChange={handleChange}
        {...props}
      />
      {helper && <span className={helperText}>{helper}</span>}
    </label>
  );
}


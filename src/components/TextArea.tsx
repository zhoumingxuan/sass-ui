'use client';

import { TextareaHTMLAttributes } from 'react';
import { inputBase, fieldLabel, helperText, inputStatus, Status, InputSize, inputSize } from './formStyles';

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & {
  status?: Status;
  onChange?: (value: any) => void;
  size?: InputSize; // lg | md | sm
};

export default function TextArea({ status, className = '', onChange, size = 'md', ...props }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <textarea
      aria-invalid={status === 'error' ? true : undefined}
      className={[inputBase, inputSize[size], status ? inputStatus[status] : '', 'min-h-24 py-2 resize-y', className].filter(Boolean).join(' ')}
      onChange={handleChange}
      {...props}
    />
  );
}


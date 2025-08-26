import { ReactNode, CSSProperties } from 'react';

type Props = {
  cols?: number;
  gap?: number;
  children: ReactNode;
  className?: string;
};

export default function Grid({ cols = 4, gap = 2, children, className = '' }: Props) {
  const style: CSSProperties = {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: gap * 8,
  };
  return (
    <div className={`grid ${className}`} style={style}>
      {children}
    </div>
  );
}

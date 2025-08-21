'use client';

import { ReactNode } from 'react';
import styles from './Modal.module.scss';

type Props = {
  show: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ show, title, children, onClose }: Props) {
  if (!show) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>{title}</h3>
          <button onClick={onClose}>×</button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

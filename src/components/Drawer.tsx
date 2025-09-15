'use client';

import Modal from './Modal';
import type { ReactNode } from 'react';

type Placement = 'right' | 'left' | 'top' | 'bottom';

type DrawerProps = {
  open?: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children?: ReactNode;
  placement?: Placement;
  width?: number | string; // width for left/right; for top/bottom it's height if passed as number/string
  footer?: ReactNode | null;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  className?: string;
  wrapperClassName?: string;
};

export default function Drawer({
  open,
  onClose,
  title,
  children,
  placement = 'right',
  width,
  footer,
  closable = true,
  maskClosable = true,
  keyboard = true,
  className = '',
  wrapperClassName = '',
}: DrawerProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      mode="drawer"
      placement={placement}
      width={width}
      footer={footer}
      closable={closable}
      maskClosable={maskClosable}
      keyboard={keyboard}
      className={className}
      wrapperClassName={wrapperClassName}
    >
      {children}
    </Modal>
  );
}


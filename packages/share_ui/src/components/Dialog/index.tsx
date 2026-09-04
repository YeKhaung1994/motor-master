import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { IconButton } from '../IconButton';
import { CloseIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Built on the native dialog element, which brings focus trapping, focus
 * restoration, Escape-to-close and inertness of the page behind it — all of
 * which a hand-rolled modal has to reimplement and usually gets wrong.
 */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // Escape closes the dialog itself; keep React's state in step.
    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, className)}
      aria-label={title}
      // Clicking the backdrop lands on the dialog element itself.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <IconButton label="Close" variant="ghost" size="sm" onClick={onClose}>
          <CloseIcon size={14} />
        </IconButton>
      </div>
      <div className={styles.body}>{children}</div>
    </dialog>
  );
}

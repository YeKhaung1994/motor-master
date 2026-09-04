import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export function WinnerLegend({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cx(styles.legend, className)} {...rest}>
      <span className={styles.swatch} aria-hidden="true" />
      Red marks the best figure in each row
    </p>
  );
}

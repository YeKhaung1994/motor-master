import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
}

export function Skeleton({ width = '100%', height = 14, radius, className, ...rest }: SkeletonProps) {
  const style: CSSProperties = { width, height };
  if (radius !== undefined) style.borderRadius = radius;

  return (
    <span
      className={cx(styles.skeleton, className)}
      style={style}
      aria-hidden="true"
      {...rest}
    />
  );
}

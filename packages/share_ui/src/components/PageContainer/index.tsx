import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children?: ReactNode;
}

export function PageContainer({ as: Tag = 'div', className, children, ...rest }: PageContainerProps) {
  return (
    <Tag className={cx(styles.container, className)} {...rest}>
      {children}
    </Tag>
  );
}

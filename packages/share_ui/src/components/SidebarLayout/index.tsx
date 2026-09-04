import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface SidebarLayoutProps extends HTMLAttributes<HTMLDivElement> {
  sidebar: ReactNode;
  sidebarLabel?: string;
  children: ReactNode;
}

export function SidebarLayout({
  sidebar,
  sidebarLabel = 'Filters',
  className,
  children,
  ...rest
}: SidebarLayoutProps) {
  return (
    <div className={cx(styles.layout, className)} {...rest}>
      <aside className={styles.rail} aria-label={sidebarLabel}>
        {sidebar}
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

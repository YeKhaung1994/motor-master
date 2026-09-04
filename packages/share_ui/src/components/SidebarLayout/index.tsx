import { useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

/** Distance the rail sticks below the top bar. Matches `--mm-space-5` + 60px. */
const STICKY_OFFSET = 80;

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
  const railRef = useRef<HTMLElement>(null);
  const [canStick, setCanStick] = useState(false);

  /*
   * The rail sticks only when it fits in the space beside the results. A rail
   * that is taller than the window either clips its own end or needs a second
   * scrollbar, and two scrollbars in one page is worse than none — so when it
   * does not fit, it simply scrolls with everything else.
   */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const measure = () => {
      setCanStick(rail.scrollHeight <= window.innerHeight - STICKY_OFFSET);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div className={cx(styles.layout, className)} {...rest}>
      <aside
        ref={railRef}
        className={cx(styles.rail, canStick && styles.sticky)}
        aria-label={sidebarLabel}
      >
        {sidebar}
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

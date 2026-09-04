import type { ReactNode } from 'react';
import { Logo } from '../Logo';
import { useLinkComponent } from '../Link';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface TopBarProps {
  navItems?: NavItem[];
  /** Usually a `SearchInput` with `variant="dark"`. */
  search?: ReactNode;
  homeHref?: string;
}

export function TopBar({ navItems = [], search, homeHref = '/' }: TopBarProps) {
  const Link = useLinkComponent();
  return (
    <header className={styles.topBar}>
      <div className={styles.inner}>
        <Logo href={homeHref} onDark />
        <nav className={styles.nav} aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(styles.link, item.active && styles.active)}
              aria-current={item.active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {search ? <div className={styles.search}>{search}</div> : null}
      </div>
    </header>
  );
}

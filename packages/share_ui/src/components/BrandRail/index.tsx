import { useState } from 'react';
import { useLinkComponent } from '../Link';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface BrandRailItemProps {
  name: string;
  /** Not every imported catalogue states where the manufacturer is based. */
  countryCode?: string | null;
  count: number;
  href: string;
  active?: boolean;
}

export function BrandRailItem({
  name,
  countryCode,
  count,
  href,
  active = false,
}: BrandRailItemProps) {
  const Link = useLinkComponent();
  return (
    <li>
      <Link
        href={href}
        className={cx(styles.item, active && styles.active)}
        aria-current={active ? 'true' : undefined}
      >
        <span className={styles.name}>{name}</span>
        {countryCode ? <span className={styles.country}>{countryCode}</span> : null}
        <span className={styles.count}>{count}</span>
      </Link>
    </li>
  );
}

export interface BrandRailProps {
  title?: string;
  items: BrandRailItemProps[];
  /** Href for the "all brands" reset row; omitted when there is nothing to reset. */
  allHref?: string;
  allLabel?: string;
  allCount?: number;
  /** Show at most this many brands until the reader asks for the rest. */
  maxVisible?: number;
  className?: string;
}

export function BrandRail({
  title = 'Brands',
  items,
  allHref,
  allLabel = 'All brands',
  allCount,
  maxVisible,
  className,
}: BrandRailProps) {
  const [expanded, setExpanded] = useState(false);

  const canCollapse = maxVisible !== undefined && items.length > maxVisible;
  // The brand being viewed stays on screen wherever it sits in the list.
  const visible =
    canCollapse && !expanded
      ? items.filter((item, index) => index < maxVisible || item.active)
      : items;
  const hiddenCount = items.length - visible.length;
  const anyActive = items.some((item) => item.active);

  return (
    <nav className={cx(styles.rail, className)} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      <ul className={styles.list}>
        {allHref ? (
          <BrandRailItem
            name={allLabel}
            count={allCount ?? items.reduce((sum, item) => sum + item.count, 0)}
            href={allHref}
            active={!anyActive}
          />
        ) : null}
        {visible.map((item) => (
          <BrandRailItem key={item.href} {...item} />
        ))}
      </ul>
      {canCollapse ? (
        <button type="button" className={styles.toggle} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show fewer' : `Show ${hiddenCount} more`}
        </button>
      ) : null}
    </nav>
  );
}

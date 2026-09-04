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

export function BrandRailItem({ name, countryCode, count, href, active = false }: BrandRailItemProps) {
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
  className?: string;
}

export function BrandRail({ title = 'Brands', items, className }: BrandRailProps) {
  return (
    <nav className={cx(styles.rail, className)} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <BrandRailItem key={item.href} {...item} />
        ))}
      </ul>
    </nav>
  );
}

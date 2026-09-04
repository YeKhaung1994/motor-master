import { Logo } from '../Logo';
import { useLinkComponent } from '../Link';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  /** One column per group of destinations; the app supplies brands at runtime. */
  columns?: FooterColumn[];
  description?: string;
  /** What the figures are and are not — the standing caveat for the catalogue. */
  note?: string;
  /** Credit line, e.g. "Built by YK". */
  byline?: string;
  year?: number;
  className?: string;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: 'Browse',
    links: [
      { label: 'All bikes', href: '/' },
      { label: 'Brands', href: '/brands' },
      { label: 'Compare', href: '/compare' },
    ],
  },
  {
    title: 'About the data',
    links: [{ label: 'Image credits', href: '/credits' }],
  },
];

export function Footer({
  columns = DEFAULT_COLUMNS,
  description = 'Motorcycle specifications and side-by-side comparison, built from manufacturer spec sheets.',
  note = 'Specifications are manufacturer figures and may vary by market. Prices are list prices before on-road costs.',
  byline,
  year = new Date().getFullYear(),
  className,
}: FooterProps) {
  const Link = useLinkComponent();

  return (
    <footer className={cx(styles.footer, className)}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          <div className={styles.brand}>
            <Logo />
            <p className={styles.description}>{description}</p>
          </div>

          {/* One landmark for the whole footer; the columns are its headings. */}
          <nav className={styles.nav} aria-label="Footer">
            {columns.map((column) => (
              <div className={styles.column} key={column.title}>
                <h2 className={styles.columnTitle}>{column.title}</h2>
                <ul className={styles.list}>
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}`}>
                      <Link href={link.href} className={styles.link}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.foot}>
          <p className={styles.note}>{note}</p>

          <div className={styles.bar}>
            <span className={styles.copy}>© {year} motor-master</span>
            {byline ? <span className={styles.byline}>{byline}</span> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

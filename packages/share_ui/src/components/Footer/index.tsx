import { Logo } from '../Logo';
import { useLinkComponent } from '../Link';
import styles from './styles.module.css';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps {
  links?: FooterLink[];
  note?: string;
}

const DEFAULT_LINKS: FooterLink[] = [
  { label: 'All bikes', href: '/' },
  { label: 'Brands', href: '/brands' },
  { label: 'Compare', href: '/compare' },
];

export function Footer({
  links = DEFAULT_LINKS,
  note = 'Specifications are manufacturer figures and may vary by market.',
}: FooterProps) {
  const Link = useLinkComponent();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Logo />
        <nav className={styles.links} aria-label="Footer">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </Link>
          ))}
        </nav>
        <p className={styles.note}>{note}</p>
      </div>
    </footer>
  );
}

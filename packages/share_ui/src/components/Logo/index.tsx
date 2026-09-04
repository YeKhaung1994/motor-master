import { useLinkComponent } from '../Link';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface LogoProps {
  href?: string;
  onDark?: boolean;
  className?: string;
}

export function Logo({ href = '/', onDark = false, className }: LogoProps) {
  const Link = useLinkComponent();
  return (
    <Link href={href} className={cx(styles.logo, onDark && styles.onDark, className)}>
      <span className={styles.bar} aria-hidden="true" />
      <span className={styles.word}>motor-master</span>
    </Link>
  );
}

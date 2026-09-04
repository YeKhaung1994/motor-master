import { ArrowLeftIcon } from '../../icons';
import { useLinkComponent } from '../Link';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface BackLinkProps {
  href: string;
  /** Where the reader goes back to, e.g. `all bikes`. */
  context: string;
  className?: string;
}

export function BackLink({ href, context, className }: BackLinkProps) {
  const Link = useLinkComponent();
  return (
    <Link href={href} className={cx(styles.backLink, className)}>
      <ArrowLeftIcon size={14} />
      Back to {context}
    </Link>
  );
}

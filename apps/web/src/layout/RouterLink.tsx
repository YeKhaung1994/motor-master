import { Link } from 'react-router-dom';
import type { LinkProps } from '@motor-master/share_ui';

/**
 * Adapter handed to share_ui's LinkProvider so every link inside the design
 * system routes client-side. External and hash hrefs fall through to an anchor.
 */
export function RouterLink({ href, children, ...rest }: LinkProps) {
  const isExternal = /^(https?:|mailto:|tel:|#)/.test(href);

  if (isExternal) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} {...rest}>
      {children}
    </Link>
  );
}

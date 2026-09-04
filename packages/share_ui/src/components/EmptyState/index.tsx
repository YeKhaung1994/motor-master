import type { HTMLAttributes, ReactNode } from 'react';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  headline: string;
  body?: string;
  /** One action only — a single obvious way forward. */
  action?: ReactNode;
}

export function EmptyState({ headline, body, action, className, ...rest }: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, className)} {...rest}>
      <Heading level={2} size="sm">
        {headline}
      </Heading>
      {body ? (
        <Text tone="muted" size="sm" className={styles.body}>
          {body}
        </Text>
      ) : null}
      {action}
    </div>
  );
}

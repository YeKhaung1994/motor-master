import { useEffect, useState } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface BikeImageProps {
  /** Photograph for this model, if one exists. */
  src?: string | null;
  alt: string;
  /** Shown when there is no photograph, or the file is missing. */
  placeholder?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
}

/**
 * The art area of a card or detail page. Model photography is stored per slug,
 * so a catalogue can be imported before its images exist — a missing file falls
 * back to a marked-out placeholder rather than a broken image.
 */
export function BikeImage({
  src,
  alt,
  placeholder = 'No photo yet',
  loading = 'lazy',
  className,
}: BikeImageProps) {
  const [failed, setFailed] = useState(false);

  // A new bike in the same card slot deserves a fresh attempt.
  useEffect(() => setFailed(false), [src]);

  const showImage = Boolean(src) && !failed;

  return (
    <div className={cx(styles.frame, className)}>
      {showImage ? (
        <img
          className={styles.image}
          src={src as string}
          alt={alt}
          loading={loading}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.placeholder} role="img" aria-label={`${alt} — no photo yet`}>
          {placeholder}
        </div>
      )}
    </div>
  );
}

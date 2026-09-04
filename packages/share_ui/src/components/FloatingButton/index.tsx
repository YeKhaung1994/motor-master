import { useEffect, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface FloatingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: ReactNode;
  /** Number of bikes already picked; omitted when none are. */
  count?: number;
  /** Lift clear of the compare tray when it is open. */
  raised?: boolean;
  /**
   * Selector for a region the button must not cover — the footer by default.
   * A fixed control that sits on top of the credits and the byline is a control
   * that has outstayed its welcome.
   */
  parkNear?: string | null;
}

/** Height of the bottom strip the button sits in, including its offset. */
const BUTTON_ZONE = 140;

export function FloatingButton({
  label,
  icon,
  count,
  raised = false,
  parkNear = 'footer',
  className,
  type = 'button',
  ...rest
}: FloatingButtonProps) {
  const [parked, setParked] = useState(false);

  useEffect(() => {
    if (!parkNear) return;
    const region = document.querySelector(parkNear);
    if (!region) return;

    let observer: IntersectionObserver | null = null;

    /*
     * Park only when the region reaches the strip the button actually occupies,
     * not merely when it appears on screen — otherwise a short page, where the
     * footer is visible from the start, would hide the button for good.
     */
    const observe = () => {
      observer?.disconnect();
      const strip = Math.min(BUTTON_ZONE, window.innerHeight);
      observer = new IntersectionObserver(
        ([entry]) => setParked(Boolean(entry?.isIntersecting)),
        { rootMargin: `-${Math.max(window.innerHeight - strip, 0)}px 0px 0px 0px` },
      );
      observer.observe(region);
    };

    observe();
    window.addEventListener('resize', observe);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', observe);
    };
  }, [parkNear]);

  return (
    <button
      type={type}
      className={cx(styles.button, raised && styles.raised, parked && styles.parked, className)}
      // Parked means gone, not merely invisible: it leaves the tab order too.
      aria-hidden={parked || undefined}
      tabIndex={parked ? -1 : undefined}
      {...rest}
    >
      {icon}
      {label}
      {count ? <span className={styles.count}>{count}</span> : null}
    </button>
  );
}

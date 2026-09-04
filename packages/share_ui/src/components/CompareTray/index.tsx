import { useEffect, useRef } from 'react';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { CloseIcon } from '../../icons';
import { cx } from '../../utils/cx';
import { displayPrice } from '../../utils/format';
import type { PriceLike } from '../../utils/format';
import styles from './styles.module.css';

export interface CompareSlotBike {
  id: number;
  name: string;
  brand: string;
  price: PriceLike | null;
}

export interface CompareSlotProps {
  /** 1-based, so the empty copy reads `Slot 2 — add a bike`. */
  position: number;
  bike?: CompareSlotBike | null;
  onRemove?: (id: number) => void;
}

export function CompareSlot({ position, bike, onRemove }: CompareSlotProps) {
  if (!bike) {
    return (
      <div className={styles.slot}>
        <span className={styles.slotBody}>Slot {position} — add a bike</span>
      </div>
    );
  }

  return (
    <div className={cx(styles.slot, styles.filled)}>
      <span className={styles.slotBody}>
        <span className={styles.slotName}>{bike.name}</span>
        <span className={styles.slotMeta}>
          {bike.brand} · {displayPrice(bike.price, 'Price not published')}
        </span>
      </span>
      <IconButton
        label={`Remove ${bike.name} from compare`}
        variant="onInk"
        size="sm"
        onClick={() => onRemove?.(bike.id)}
      >
        <CloseIcon size={13} />
      </IconButton>
    </div>
  );
}

export interface CompareTrayProps {
  bikes: CompareSlotBike[];
  maxSlots?: number;
  onRemove?: (id: number) => void;
  onClear?: () => void;
  onCompare?: () => void;
  compareHref?: string;
  className?: string;
}

export function CompareTray({
  bikes,
  maxSlots = 3,
  onRemove,
  onClear,
  onCompare,
  compareHref,
  className,
}: CompareTrayProps) {
  const ref = useRef<HTMLElement>(null);
  const open = bikes.length > 0;
  const ready = bikes.length >= 2;

  /*
   * Publish the tray's real height so anything else pinned to the bottom can
   * clear it. The height changes with content and viewport, so a fixed offset
   * elsewhere is a guess that eventually overlaps by a few pixels.
   */
  useEffect(() => {
    const element = ref.current;
    const root = document.documentElement;
    if (!element) return;

    const publish = () => {
      root.style.setProperty('--mm-tray-height', open ? `${element.offsetHeight}px` : '0px');
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.setProperty('--mm-tray-height', '0px');
    };
  }, [open]);
  const label = `Compare ${bikes.length} ${bikes.length === 1 ? 'bike' : 'bikes'}`;

  return (
    <section
      ref={ref}
      className={cx(styles.tray, open && styles.open, className)}
      aria-label="Compare tray"
      aria-hidden={!open}
    >
      <div className={styles.inner}>
        <div className={styles.slots}>
          {Array.from({ length: maxSlots }, (_, index) => (
            <CompareSlot
              key={index}
              position={index + 1}
              bike={bikes[index] ?? null}
              onRemove={onRemove}
            />
          ))}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.clear} onClick={onClear}>
            Clear
          </button>
          {ready && compareHref ? (
            <Button variant="compare" href={compareHref}>
              {label}
            </Button>
          ) : (
            <Button variant="compare" onClick={onCompare} disabled={!ready}>
              {label}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

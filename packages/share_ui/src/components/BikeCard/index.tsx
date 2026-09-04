import { Badge } from '../Badge';
import { BikeImage } from '../BikeImage';
import { Button } from '../Button';
import { Stat } from '../Stat';
import { CheckIcon } from '../../icons';
import { cx } from '../../utils/cx';
import { displayPrice } from '../../utils/format';
import type { PriceLike } from '../../utils/format';
import styles from './styles.module.css';

export interface BikeCardData {
  id: number;
  slug: string;
  name: string;
  brand: string;
  /** The manufacturer's own category, e.g. Naked, Adventure scooter, MiniMOTO. */
  class: string;
  /** Null wherever the spec sheet publishes no figure. */
  cc: number | null;
  hp: number | null;
  kg: number | null;
  price: PriceLike | null;
  imageUrl?: string | null;
}

export interface BikeCardProps {
  bike: BikeCardData;
  /** Already in the compare tray. */
  selected?: boolean;
  /** Blocked because the tray is full. */
  compareDisabled?: boolean;
  onToggleCompare?: (bike: BikeCardData) => void;
  specsHref?: string;
  className?: string;
}

export function BikeCard({
  bike,
  selected = false,
  compareDisabled = false,
  onToggleCompare,
  specsHref,
  className,
}: BikeCardProps) {
  const href = specsHref ?? `/bikes/${bike.slug}`;

  return (
    <article className={cx(styles.card, selected && styles.selected, className)}>
      <div className={styles.art}>
        <BikeImage src={bike.imageUrl} alt={`${bike.brand} ${bike.name}`} />
        <Badge className={styles.badge}>{bike.class}</Badge>
      </div>

      <div className={styles.body}>
        <span className={styles.brand}>{bike.brand}</span>
        <h3 className={styles.model}>{bike.name}</h3>

        <div className={styles.stats}>
          <Stat value={bike.cc} unit="cc" label="Engine" />
          <Stat value={bike.hp} unit="hp" label="Power" />
          <Stat value={bike.kg} unit="kg" label="Kerb weight" />
        </div>

        <span className={cx(styles.price, !bike.price?.text && styles.priceMissing)}>
          {displayPrice(bike.price)}
        </span>
      </div>

      <div className={styles.footer}>
        <Button href={href} variant="ghost" size="sm">
          Full specs
        </Button>
        <Button
          variant={selected ? 'compare' : 'ghost'}
          size="sm"
          disabled={compareDisabled && !selected}
          onClick={() => onToggleCompare?.(bike)}
          iconStart={selected ? <CheckIcon size={13} strokeWidth={2.4} /> : undefined}
        >
          {selected ? 'Added' : 'Add to compare'}
        </Button>
      </div>
    </article>
  );
}

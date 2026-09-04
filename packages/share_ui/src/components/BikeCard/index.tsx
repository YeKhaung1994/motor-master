import { Badge } from '../Badge';
import { Button } from '../Button';
import { Stat } from '../Stat';
import { CheckIcon } from '../../icons';
import { cx } from '../../utils/cx';
import { formatPrice } from '../../utils/format';
import styles from './styles.module.css';

export interface BikeCardData {
  id: number;
  slug: string;
  name: string;
  brand: string;
  /** Naked, Sport, Adventure, Cruiser, Scooter. */
  class: string;
  cc: number;
  hp: number;
  kg: number;
  priceUsd: number;
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
        {bike.imageUrl ? (
          <img className={styles.image} src={bike.imageUrl} alt={`${bike.brand} ${bike.name}`} loading="lazy" />
        ) : null}
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

        <span className={styles.price}>{formatPrice(bike.priceUsd)}</span>
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

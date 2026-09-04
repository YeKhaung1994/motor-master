import { useParams } from 'react-router-dom';
import {
  BackLink,
  Badge,
  Button,
  EmptyState,
  Heading,
  KeyStats,
  PageContainer,
  Skeleton,
  SpecTable,
  Text,
  formatPrice,
} from '@motor-master/share_ui';
import { useBike } from '../features/bikes/hooks';
import { buildSpecGroups } from '../features/bikes/specRows';
import { useCompare } from '../features/compare/useCompare';

export function BikeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const bikeQuery = useBike(slug);

  const toggleCompare = useCompare((state) => state.toggle);
  const compareBikes = useCompare((state) => state.bikes);

  if (bikeQuery.isPending) {
    return (
      <PageContainer as="main" className="page">
        <div className="stack">
          <Skeleton width={160} height={18} />
          <Skeleton width={320} height={52} />
          <Skeleton height={280} />
        </div>
      </PageContainer>
    );
  }

  if (bikeQuery.isError || !bikeQuery.data) {
    const notFound = bikeQuery.error?.message === 'Bike not found';
    return (
      <PageContainer as="main" className="page">
        <BackLink href="/" context="all bikes" />
        <EmptyState
          headline={notFound ? 'We do not have that bike' : "Couldn't load this bike"}
          body={
            notFound
              ? 'It may have been renamed. Browse the full catalogue to find it.'
              : 'Check your connection and try again.'
          }
          action={
            notFound ? (
              <Button href="/">Browse all bikes</Button>
            ) : (
              <Button onClick={() => void bikeQuery.refetch()}>Try again</Button>
            )
          }
        />
      </PageContainer>
    );
  }

  const bike = bikeQuery.data;
  const selected = compareBikes.some((entry) => entry.id === bike.id);
  const specs = bike.specs;

  return (
    <PageContainer as="main" className="page">
      <BackLink href={`/brands/${bike.brandSlug}`} context={bike.brand} />

      <div className="detail">
        <div className="detail-art">
          {bike.imageUrl ? <img src={bike.imageUrl} alt={`${bike.brand} ${bike.name}`} /> : null}
        </div>

        <div className="detail-copy">
          <Badge>{bike.class}</Badge>
          <div className="stack-tight">
            <Text tone="muted">
              {bike.brand} · {bike.modelYear}
            </Text>
            <Heading level={1} size="lg">
              {bike.name}
            </Heading>
          </div>

          <div className="stack-tight">
            <Heading level={2} size="md">
              {formatPrice(bike.priceUsd)}
            </Heading>
            <Text size="sm" tone="muted">
              MSRP, before on-road costs
            </Text>
          </div>

          <KeyStats
            items={[
              { value: specs.displacementCc ?? '—', unit: 'cc', label: 'Engine' },
              { value: specs.powerHp ?? '—', unit: 'hp', label: 'Power' },
              { value: specs.torqueNm ?? '—', unit: 'Nm', label: 'Torque' },
              { value: specs.kerbWeightKg ?? '—', unit: 'kg', label: 'Kerb weight' },
            ]}
          />

          <div className="detail-actions">
            <Button
              variant={selected ? 'compare' : 'primary'}
              onClick={() => toggleCompare(bike)}
            >
              {selected ? 'Added to compare' : 'Add to compare'}
            </Button>
            <Button variant="ghost" href={`/brands/${bike.brandSlug}`}>
              More {bike.brand} bikes
            </Button>
          </div>
        </div>
      </div>

      <SpecTable
        caption={`${bike.brand} ${bike.name} specifications`}
        columns={[{ id: bike.id, title: bike.name, meta: `${bike.brand} · ${bike.class}` }]}
        groups={buildSpecGroups([bike])}
      />
    </PageContainer>
  );
}

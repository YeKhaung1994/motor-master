import { useParams } from 'react-router-dom';
import {
  BackLink,
  Badge,
  BikeImage,
  Button,
  Divider,
  EmptyState,
  Heading,
  KeyStats,
  PageContainer,
  Skeleton,
  SpecTable,
  Text,
  displayPrice,
} from '@motor-master/share_ui';
import { useBike } from '../features/bikes/hooks';
import { buildSpecGroups } from '../features/bikes/specRows';
import { useCompare } from '../features/compare/useCompare';
import { bikeImageSrc } from '../lib/images';

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
        <BikeImage
          className="detail-art"
          src={bikeImageSrc(bike.slug, bike.imageUrl)}
          alt={`${bike.brand} ${bike.name}`}
          loading="eager"
        />

        <div className="detail-copy">
          <Badge className="detail-badge">{bike.class}</Badge>
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
              {displayPrice(bike.price)}
            </Heading>
            <Text size="sm" tone="muted">
              {bike.price
                ? `Manufacturer list price${bike.price.market ? ` in ${bike.price.market}` : ''}, before on-road costs`
                : 'The manufacturer has not published a price for this market.'}
            </Text>
          </div>

          <KeyStats
            items={[
              { value: specs.displacementCc, unit: 'cc', label: 'Engine' },
              { value: specs.powerHp, unit: 'hp', label: 'Power' },
              { value: specs.torqueNm, unit: 'Nm', label: 'Torque' },
              { value: specs.kerbWeightKg, unit: 'kg', label: 'Kerb weight' },
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

      {bike.notes || bike.flags ? (
        <div className="stack-tight provenance">
          {bike.notes ? (
            <Text size="sm" tone="muted">
              {bike.notes}
            </Text>
          ) : null}
          {/* Source caveats are shown, not hidden — the reader decides how much
              weight to give a secondary-sourced figure. */}
          {bike.flags ? (
            <Text size="sm" tone="muted">
              Note on this data: {bike.flags}
            </Text>
          ) : null}
        </div>
      ) : null}

      <SpecTable
        caption={`${bike.brand} ${bike.name} specifications`}
        columns={[{ id: bike.id, title: bike.name, meta: `${bike.brand} · ${bike.class}` }]}
        groups={buildSpecGroups([bike])}
      />

      {bike.sourceUrl || bike.priceSourceUrl ? (
        <>
          <Divider spaced />
          <div className="stack-tight">
            {bike.sourceUrl ? (
              <Text size="xs" tone="muted">
                Specifications from the manufacturer.{' '}
                <a href={bike.sourceUrl} target="_blank" rel="noreferrer noopener">
                  View the spec source
                </a>
              </Text>
            ) : null}
            {/* Thai list prices often come from a dealer or aggregator rather
                than the manufacturer, so the two sources are credited apart. */}
            {bike.priceSourceUrl && bike.priceSourceUrl !== bike.sourceUrl ? (
              <Text size="xs" tone="muted">
                Price from a third-party listing.{' '}
                <a href={bike.priceSourceUrl} target="_blank" rel="noreferrer noopener">
                  View the price source
                </a>
              </Text>
            ) : null}
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}

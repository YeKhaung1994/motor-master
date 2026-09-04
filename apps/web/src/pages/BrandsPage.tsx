import {
  Button,
  EmptyState,
  Heading,
  PageContainer,
  Skeleton,
  Text,
  Toolbar,
  useLinkComponent,
} from '@motor-master/share_ui';
import { useBrands } from '../features/brands/hooks';

export function BrandsPage() {
  const Link = useLinkComponent();
  const brandsQuery = useBrands();

  return (
    <PageContainer as="main" className="page">
      <Toolbar
        heading="Brands"
        count={brandsQuery.data?.length}
        countNoun="brand"
      />

      {brandsQuery.isPending ? (
        <div className="brand-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} height={104} />
          ))}
        </div>
      ) : null}

      {brandsQuery.isError ? (
        <EmptyState
          headline="Couldn't load brands"
          body="Check your connection and try again."
          action={<Button onClick={() => void brandsQuery.refetch()}>Try again</Button>}
        />
      ) : null}

      {brandsQuery.data ? (
        <div className="brand-grid">
          {brandsQuery.data.map((brand) => (
            <Link key={brand.slug} href={`/brands/${brand.slug}`} className="brand-tile">
              <Heading level={2} size="sm">
                {brand.name}
              </Heading>
              <Text size="sm" tone="muted">
                {brand.countryCode} · {brand.modelCount}{' '}
                {brand.modelCount === 1 ? 'model' : 'models'}
              </Text>
            </Link>
          ))}
        </div>
      ) : null}
    </PageContainer>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BikeCard,
  BikeGrid,
  BrandRail,
  Button,
  Dialog,
  EmptyState,
  FilterGroup,
  FloatingButton,
  Heading,
  HeroCompareBox,
  PageContainer,
  RangeFilter,
  SidebarLayout,
  Skeleton,
  Text,
  Toolbar,
} from '@motor-master/share_ui';
import { useBikePages } from '../features/bikes/hooks';
import { SORT_OPTIONS, useBikeFilters } from '../features/bikes/useBikeFilters';
import { useBrands } from '../features/brands/hooks';
import { useClasses } from '../features/bikes/classesApi';
import { bikeImageSrc } from '../lib/images';
import { MAX_COMPARE, useCompare } from '../features/compare/useCompare';
import type { BikeCardDto } from '../lib/types';

export function BrowsePage() {
  const { slug: brandSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { filters, classes, sort, toggleClass, setSort, setRange, clearAll, hasFilters } =
    useBikeFilters(brandSlug);

  const brandsQuery = useBrands();
  const classesQuery = useClasses(brandSlug);
  const bikesQuery = useBikePages(filters);

  const toggleCompare = useCompare((state) => state.toggle);
  // Select the stored array itself — a selector that builds a new array on every
  // render never settles against zustand's snapshot check.
  const compareBikes = useCompare((state) => state.bikes);
  const selectedIds = useMemo(() => compareBikes.map((bike) => bike.id), [compareBikes]);
  const isFull = selectedIds.length >= MAX_COMPARE;

  const [quick, setQuick] = useState<[string, string, string]>(['', '', '']);
  const [quickOpen, setQuickOpen] = useState(false);

  const brand = brandsQuery.data?.find((entry) => entry.slug === brandSlug);
  const items = useMemo(
    () => bikesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [bikesQuery.data],
  );
  const total = bikesQuery.data?.pages[0]?.total ?? 0;

  const quickOptions = useMemo(
    () => items.map((bike) => ({ value: String(bike.id), label: `${bike.brand} ${bike.name}` })),
    [items],
  );

  const heading = brand ? `${brand.name} bikes` : 'All bikes';

  /**
   * Class options for this brand, most models first. A class that is still
   * selected but has nothing under this brand is kept in the list with a count
   * of zero — otherwise the filter is switched on with no way to switch it off.
   */
  const classOptions = useMemo(() => {
    const available = [...(classesQuery.data ?? [])].sort(
      (a, b) => b.modelCount - a.modelCount || a.name.localeCompare(b.name),
    );
    const orphaned = classes
      .filter((name) => !available.some((entry) => entry.name === name))
      .map((name) => ({ name, modelCount: 0 }));

    return [...available, ...orphaned].map((entry) => ({
      value: entry.name,
      label: entry.name,
      count: entry.modelCount,
    }));
  }, [classesQuery.data, classes]);
  // Filter in whatever currency the catalogue quotes, rather than assuming dollars.
  const priceCurrency = items.find((bike) => bike.price?.currency)?.price?.currency ?? '';

  function onCompareQuickPicks() {
    const ids = quick.filter(Boolean);
    if (ids.length < 2) return;
    setQuickOpen(false);
    navigate(`/compare?ids=${ids.join(',')}`);
  }

  return (
    <PageContainer as="main" className="page">
      {brandSlug ? null : (
        <section className="hero">
          <div className="hero-copy">
            <Heading level={1} size="lg">
              Every bike, one spec sheet
            </Heading>
            <Text tone="muted" size="lg">
              Filter by brand, class, engine size and price, then put up to three bikes side by
              side and see which one actually wins on paper.
            </Text>
            <div className="hero-actions">
              <Button href="/brands" variant="ghost">
                Browse by brand
              </Button>
            </div>
          </div>
        </section>
      )}

      <SidebarLayout
        className="browse-layout"
        sidebar={
          <div className="sidebar-stack">
            <BrandRail
              allHref="/"
              allCount={brandsQuery.data?.reduce((sum, entry) => sum + entry.modelCount, 0)}
              maxVisible={6}
              items={[...(brandsQuery.data ?? [])]
                .sort((a, b) => b.modelCount - a.modelCount || a.name.localeCompare(b.name))
                .map((entry) => ({
                  name: entry.name,
                  countryCode: entry.countryCode,
                  count: entry.modelCount,
                  href: `/brands/${entry.slug}`,
                  active: entry.slug === brandSlug,
                }))}
            />
            <FilterGroup
              title="Class"
              options={classOptions}
              selected={classes}
              onChange={toggleClass}
              maxVisible={8}
            />
            <RangeFilter
              title="Engine size"
              suffix="cc"
              minValue={filters.ccMin?.toString() ?? ''}
              maxValue={filters.ccMax?.toString() ?? ''}
              onMinChange={(value) => setRange('ccMin', value)}
              onMaxChange={(value) => setRange('ccMax', value)}
            />
            <RangeFilter
              title="Price"
              suffix={priceCurrency}
              minValue={filters.priceMin?.toString() ?? ''}
              maxValue={filters.priceMax?.toString() ?? ''}
              onMinChange={(value) => setRange('priceMin', value)}
              onMaxChange={(value) => setRange('priceMax', value)}
            />
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear filters
              </Button>
            ) : null}
          </div>
        }
      >
        <Toolbar
          heading={heading}
          count={total}
          sortOptions={SORT_OPTIONS}
          sortValue={sort}
          onSortChange={setSort}
        />

        {bikesQuery.isPending ? (
          <BikeGrid>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} height={360} />
            ))}
          </BikeGrid>
        ) : null}

        {bikesQuery.isError ? (
          <EmptyState
            headline="Couldn't load bikes"
            body="Check your connection and try again."
            action={
              <Button onClick={() => void bikesQuery.refetch()}>Try again</Button>
            }
          />
        ) : null}

        {bikesQuery.isSuccess && items.length === 0 ? (
          <EmptyState
            headline="No bikes match these filters"
            body="Try widening the engine size or price range, or clearing a class."
            action={
              hasFilters ? (
                <Button variant="ghost" onClick={clearAll}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : null}

        {items.length > 0 ? (
          <>
            <BikeGrid>
            {items.map((bike: BikeCardDto) => (
              <BikeCard
                key={bike.id}
                bike={{ ...bike, imageUrl: bikeImageSrc(bike.slug, bike.imageUrl) }}
                selected={selectedIds.includes(bike.id)}
                compareDisabled={isFull}
                onToggleCompare={() => toggleCompare(bike)}
              />
            ))}
            </BikeGrid>
            {bikesQuery.hasNextPage ? (
              <div className="load-more">
                <Button
                  variant="ghost"
                  onClick={() => void bikesQuery.fetchNextPage()}
                  disabled={bikesQuery.isFetchingNextPage}
                >
                  {bikesQuery.isFetchingNextPage
                    ? 'Loading'
                    : `Show more (${total - items.length} to go)`}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </SidebarLayout>

      {/* Quick compare is a tool, not a headline: it waits behind a launcher
          instead of holding the top of a 227-model catalogue while empty. */}
      <FloatingButton
        label="Quick compare"
        count={selectedIds.length}
        raised={compareBikes.length > 0}
        aria-haspopup="dialog"
        aria-expanded={quickOpen}
        onClick={() => setQuickOpen(true)}
      />

      <Dialog open={quickOpen} onClose={() => setQuickOpen(false)} title="Quick compare">
        <HeroCompareBox
          bare
          options={quickOptions}
          values={quick}
          onChange={(index, value) =>
            setQuick((current) => {
              const next = [...current] as [string, string, string];
              next[index] = value;
              return next;
            })
          }
          onCompare={onCompareQuickPicks}
        />
      </Dialog>
    </PageContainer>
  );
}

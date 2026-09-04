import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BackLink,
  Button,
  CompareTable,
  EmptyState,
  PageContainer,
  Skeleton,
  Toolbar,
  WinnerLegend,
} from '@motor-master/share_ui';
import { buildSpecGroups } from '../features/bikes/specRows';
import { useCompareBikes } from '../features/compare/hooks';
import { parseIdsParam, useCompare } from '../features/compare/useCompare';

export function ComparePage() {
  const [searchParams] = useSearchParams();
  const ids = parseIdsParam(searchParams.get('ids'));

  const compareQuery = useCompareBikes(ids);
  const replaceAll = useCompare((state) => state.replaceAll);

  // A shared link is the source of truth: fill the tray from what loaded.
  const bikes = compareQuery.data?.bikes;
  useEffect(() => {
    if (!bikes) return;
    replaceAll(
      bikes.map((bike) => ({
        id: bike.id,
        slug: bike.slug,
        name: bike.name,
        brand: bike.brand,
        priceUsd: bike.priceUsd,
      })),
    );
  }, [bikes, replaceAll]);

  if (ids.length < 2) {
    return (
      <PageContainer as="main" className="page">
        <BackLink href="/" context="all bikes" />
        <EmptyState
          headline="Pick two bikes to compare"
          body="Add bikes from the catalogue and they will line up here, best figure in each row marked in red."
          action={<Button href="/">Browse all bikes</Button>}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer as="main" className="page">
      <BackLink href="/" context="all bikes" />

      <Toolbar heading="Compare" count={compareQuery.data?.bikes.length} />

      {compareQuery.isPending ? <Skeleton height={420} /> : null}

      {compareQuery.isError ? (
        <EmptyState
          headline="Couldn't load this comparison"
          body="Check your connection and try again."
          action={<Button onClick={() => void compareQuery.refetch()}>Try again</Button>}
        />
      ) : null}

      {compareQuery.data ? (
        <>
          <CompareTable
            columns={compareQuery.data.bikes.map((bike) => ({
              id: bike.id,
              title: bike.name,
              brand: bike.brand,
              class: bike.class,
            }))}
            groups={buildSpecGroups(compareQuery.data.bikes)}
            winners={compareQuery.data.winners}
          />
          <div className="compare-note">
            <WinnerLegend />
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}

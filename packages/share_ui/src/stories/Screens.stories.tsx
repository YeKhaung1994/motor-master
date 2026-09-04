import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BackLink } from '../components/BackLink';
import { BikeCard } from '../components/BikeCard';
import type { BikeCardData } from '../components/BikeCard';
import { BikeGrid } from '../components/BikeGrid';
import { BrandRail } from '../components/BrandRail';
import { Button } from '../components/Button';
import { CompareTable } from '../components/CompareTable';
import { CompareTray } from '../components/CompareTray';
import { FilterGroup } from '../components/FilterGroup';
import { Footer } from '../components/Footer';
import { Heading } from '../components/Heading';
import { HeroCompareBox } from '../components/HeroCompareBox';
import { KeyStats } from '../components/KeyStats';
import { PageContainer } from '../components/PageContainer';
import { SearchInput } from '../components/SearchInput';
import { SidebarLayout } from '../components/SidebarLayout';
import { SpecTable } from '../components/SpecTable';
import { Text } from '../components/Text';
import { Toolbar } from '../components/Toolbar';
import { TopBar } from '../components/TopBar';
import { WinnerLegend } from '../components/WinnerLegend';
import { formatPrice } from '../utils/format';
import { bikes, brands, classes, sortOptions } from './fixtures';

const meta: Meta = {
  title: 'Screens',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const nav = [
  { label: 'All bikes', href: '/', active: true },
  { label: 'Brands', href: '/brands' },
  { label: 'Compare', href: '/compare' },
];

function Shell({ children, tray }: { children: React.ReactNode; tray?: React.ReactNode }) {
  return (
    <>
      <TopBar navItems={nav} search={<SearchInput variant="dark" defaultValue="" />} />
      {children}
      <Footer />
      {tray}
    </>
  );
}

export const BrowsePage: Story = {
  render: () => {
    const [selected, setSelected] = useState<BikeCardData[]>([]);
    const [classFilter, setClassFilter] = useState<string[]>([]);
    const [quick, setQuick] = useState<[string, string, string]>(['', '', '']);

    const visible = useMemo(
      () => (classFilter.length ? bikes.filter((bike) => classFilter.includes(bike.class)) : bikes),
      [classFilter],
    );

    function toggle(bike: BikeCardData) {
      setSelected((current) =>
        current.some((item) => item.id === bike.id)
          ? current.filter((item) => item.id !== bike.id)
          : current.length < 3
            ? [...current, bike]
            : current,
      );
    }

    return (
      <Shell
        tray={
          <CompareTray
            bikes={selected.map((bike) => ({
              id: bike.id,
              name: bike.name,
              brand: bike.brand,
              priceUsd: bike.priceUsd,
            }))}
            onRemove={(id) => setSelected((current) => current.filter((bike) => bike.id !== id))}
            onClear={() => setSelected([])}
            compareHref={`/compare?ids=${selected.map((bike) => bike.id).join(',')}`}
          />
        }
      >
        <PageContainer as="main">
          <Heading level={1} size="xl">
            Every bike, one spec sheet
          </Heading>
          <Text tone="muted">
            Filter by brand, class and engine size, then put up to three bikes side by side.
          </Text>
          <HeroCompareBox
            options={bikes.map((bike) => ({
              value: String(bike.id),
              label: `${bike.brand} ${bike.name}`,
            }))}
            values={quick}
            onChange={(index, value) =>
              setQuick((current) => {
                const next = [...current] as [string, string, string];
                next[index] = value;
                return next;
              })
            }
            onCompare={() => undefined}
          />

          <SidebarLayout
            sidebar={
              <>
                <BrandRail items={brands} />
                <FilterGroup
                  title="Class"
                  options={classes}
                  selected={classFilter}
                  onChange={(value, checked) =>
                    setClassFilter((current) =>
                      checked ? [...current, value] : current.filter((item) => item !== value),
                    )
                  }
                />
              </>
            }
          >
            <Toolbar
              heading="All bikes"
              count={visible.length}
              sortOptions={sortOptions}
              sortValue="price_asc"
            />
            <BikeGrid>
              {visible.map((bike) => (
                <BikeCard
                  key={bike.id}
                  bike={bike}
                  selected={selected.some((item) => item.id === bike.id)}
                  compareDisabled={selected.length >= 3}
                  onToggleCompare={toggle}
                />
              ))}
            </BikeGrid>
          </SidebarLayout>
        </PageContainer>
      </Shell>
    );
  },
};

export const BikeDetailPage: Story = {
  render: () => {
    const bike = bikes[3]!;
    return (
      <Shell>
        <PageContainer as="main">
          <BackLink href="/" context="all bikes" />
          <Heading level={1} size="lg">
            {bike.brand} {bike.name}
          </Heading>
          <Heading level={2} size="md">
            {formatPrice(bike.priceUsd)}
          </Heading>
          <Text size="sm" tone="muted">
            MSRP, before on-road costs
          </Text>

          <KeyStats
            items={[
              { value: bike.cc, unit: 'cc', label: 'Engine' },
              { value: bike.hp, unit: 'hp', label: 'Power' },
              { value: 67, unit: 'Nm', label: 'Torque' },
              { value: bike.kg, unit: 'kg', label: 'Kerb weight' },
            ]}
          />

          <Button variant="compare">Add to compare</Button>
          <Button variant="ghost">Find a dealer</Button>

          <SpecTable
            columns={[{ id: bike.id, title: bike.name, meta: `${bike.brand} · ${bike.class}` }]}
            groups={[
              {
                title: 'Engine',
                rows: [
                  { field: 'DisplacementCc', label: 'Displacement', values: [`${bike.cc} cc`] },
                  { field: 'PowerHp', label: 'Power', values: [`${bike.hp} hp`] },
                  { field: 'Transmission', label: 'Transmission', values: [null] },
                ],
              },
              {
                title: 'Chassis',
                rows: [
                  { field: 'KerbWeightKg', label: 'Kerb weight', values: [`${bike.kg} kg`] },
                  { field: 'SeatHeightMm', label: 'Seat height', values: ['805 mm'] },
                  { field: 'Brakes', label: 'Brakes', values: [null] },
                ],
              },
            ]}
          />
        </PageContainer>
      </Shell>
    );
  },
};

export const ComparePage: Story = {
  render: () => {
    const picked = [bikes[3]!, bikes[5]!, bikes[9]!];
    return (
      <Shell>
        <PageContainer as="main">
          <BackLink href="/" context="all bikes" />
          <Toolbar heading="Compare" count={picked.length} />
          <CompareTable
            columns={picked.map((bike) => ({
              id: bike.id,
              title: bike.name,
              brand: bike.brand,
              class: bike.class,
            }))}
            winners={{ DisplacementCc: 6, PowerHp: 6, KerbWeightKg: 4, PriceUsd: 10 }}
            groups={[
              {
                title: 'Engine',
                rows: [
                  {
                    field: 'DisplacementCc',
                    label: 'Displacement',
                    values: picked.map((bike) => `${bike.cc} cc`),
                  },
                  {
                    field: 'PowerHp',
                    label: 'Power',
                    values: picked.map((bike) => `${bike.hp} hp`),
                  },
                ],
              },
              {
                title: 'Chassis',
                rows: [
                  {
                    field: 'KerbWeightKg',
                    label: 'Kerb weight',
                    values: picked.map((bike) => `${bike.kg} kg`),
                  },
                ],
              },
              {
                title: 'Price',
                rows: [
                  {
                    field: 'PriceUsd',
                    label: 'MSRP',
                    values: picked.map((bike) => formatPrice(bike.priceUsd)),
                  },
                ],
              },
            ]}
          />
          <WinnerLegend />
        </PageContainer>
      </Shell>
    );
  },
};

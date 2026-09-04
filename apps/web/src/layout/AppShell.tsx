import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CompareTray,
  Footer,
  LinkProvider,
  SearchInput,
  TopBar,
} from '@motor-master/share_ui';
import { useBikeSearch } from '../features/bikes/hooks';
import { useBrands } from '../features/brands/hooks';
import { useCompare } from '../features/compare/useCompare';
import { RouterLink } from './RouterLink';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const { data: suggestions } = useBikeSearch(term);

  const { data: brands } = useBrands();
  const bikes = useCompare((state) => state.bikes);
  const remove = useCompare((state) => state.remove);
  const clear = useCompare((state) => state.clear);

  const navItems = [
    { label: 'All bikes', href: '/', active: location.pathname === '/' },
    { label: 'Brands', href: '/brands', active: location.pathname.startsWith('/brands') },
    { label: 'Compare', href: '/compare', active: location.pathname.startsWith('/compare') },
  ];

  return (
    <LinkProvider component={RouterLink}>
      <TopBar
        navItems={navItems}
        search={
          <SearchInput
            variant="dark"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            suggestions={suggestions ?? []}
            onSelectSuggestion={(hit) => {
              setTerm('');
              navigate(`/bikes/${hit.slug}`);
            }}
          />
        }
      />

      <Outlet />
      <Footer
        byline="Built by YK"
        columns={[
          {
            title: 'Browse',
            links: [
              { label: 'All bikes', href: '/' },
              { label: 'Brands', href: '/brands' },
              { label: 'Compare', href: '/compare' },
            ],
          },
          {
            title: 'Brands',
            // The six largest catalogues, so the footer is a real way in.
            links: [...(brands ?? [])]
              .sort((a, b) => b.modelCount - a.modelCount || a.name.localeCompare(b.name))
              .slice(0, 6)
              .map((brand) => ({ label: brand.name, href: `/brands/${brand.slug}` })),
          },
          {
            title: 'About the data',
            links: [{ label: 'Image credits', href: '/credits' }],
          },
        ]}
      />

      <CompareTray
        bikes={bikes}
        onRemove={remove}
        onClear={clear}
        compareHref={`/compare?ids=${bikes.map((bike) => bike.id).join(',')}`}
      />
    </LinkProvider>
  );
}

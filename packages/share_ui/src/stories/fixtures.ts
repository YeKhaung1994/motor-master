import type { BikeCardData } from '../components/BikeCard';

/** The Section 4 catalogue — headline figures only; the full spec sheets arrive
 *  with the brand JSON import. */
export const bikes: BikeCardData[] = [
  { id: 1, slug: 'honda-cb650r', name: 'CB650R', brand: 'Honda', class: 'Naked', cc: 649, hp: 94, kg: 208, priceUsd: 9399, imageUrl: null },
  { id: 2, slug: 'honda-crf300l', name: 'CRF300L', brand: 'Honda', class: 'Adventure', cc: 286, hp: 27, kg: 142, priceUsd: 5749, imageUrl: null },
  { id: 3, slug: 'honda-rebel-500', name: 'Rebel 500', brand: 'Honda', class: 'Cruiser', cc: 471, hp: 46, kg: 191, priceUsd: 6499, imageUrl: null },
  { id: 4, slug: 'yamaha-mt-07', name: 'MT-07', brand: 'Yamaha', class: 'Naked', cc: 689, hp: 73, kg: 184, priceUsd: 8599, imageUrl: null },
  { id: 5, slug: 'yamaha-tenere-700', name: 'Ténéré 700', brand: 'Yamaha', class: 'Adventure', cc: 689, hp: 73, kg: 205, priceUsd: 10799, imageUrl: null },
  { id: 6, slug: 'kawasaki-z900', name: 'Z900', brand: 'Kawasaki', class: 'Naked', cc: 948, hp: 125, kg: 212, priceUsd: 9999, imageUrl: null },
  { id: 7, slug: 'kawasaki-ninja-400', name: 'Ninja 400', brand: 'Kawasaki', class: 'Sport', cc: 399, hp: 45, kg: 168, priceUsd: 5299, imageUrl: null },
  { id: 8, slug: 'ducati-monster-937', name: 'Monster 937', brand: 'Ducati', class: 'Naked', cc: 937, hp: 111, kg: 188, priceUsd: 12995, imageUrl: null },
  { id: 9, slug: 'bmw-r-1300-gs', name: 'R 1300 GS', brand: 'BMW', class: 'Adventure', cc: 1300, hp: 145, kg: 237, priceUsd: 18895, imageUrl: null },
  { id: 10, slug: 'triumph-trident-660', name: 'Trident 660', brand: 'Triumph', class: 'Naked', cc: 660, hp: 81, kg: 190, priceUsd: 8595, imageUrl: null },
  { id: 11, slug: 'ktm-390-duke', name: '390 Duke', brand: 'KTM', class: 'Naked', cc: 399, hp: 45, kg: 165, priceUsd: 5899, imageUrl: null },
  { id: 12, slug: 'royal-enfield-himalayan-450', name: 'Himalayan 450', brand: 'Royal Enfield', class: 'Adventure', cc: 452, hp: 40, kg: 196, priceUsd: 5799, imageUrl: null },
];

export const brands = [
  { name: 'Honda', countryCode: 'JP', count: 3, href: '/brands/honda' },
  { name: 'Yamaha', countryCode: 'JP', count: 2, href: '/brands/yamaha' },
  { name: 'Kawasaki', countryCode: 'JP', count: 2, href: '/brands/kawasaki' },
  { name: 'Ducati', countryCode: 'IT', count: 1, href: '/brands/ducati' },
  { name: 'BMW', countryCode: 'DE', count: 1, href: '/brands/bmw' },
  { name: 'Triumph', countryCode: 'UK', count: 1, href: '/brands/triumph' },
  { name: 'KTM', countryCode: 'AT', count: 1, href: '/brands/ktm' },
  { name: 'Royal Enfield', countryCode: 'IN', count: 1, href: '/brands/royal-enfield' },
];

export const classes = [
  { value: 'Naked', label: 'Naked', count: 5 },
  { value: 'Sport', label: 'Sport', count: 1 },
  { value: 'Adventure', label: 'Adventure', count: 4 },
  { value: 'Cruiser', label: 'Cruiser', count: 1 },
  { value: 'Scooter', label: 'Scooter', count: 0 },
];

export const sortOptions = [
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'power_desc', label: 'Most power' },
  { value: 'weight_asc', label: 'Lightest first' },
];

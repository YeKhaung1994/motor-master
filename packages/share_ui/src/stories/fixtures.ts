import type { BikeCardData } from '../components/BikeCard';

const thb = (amount: number, text: string, isApproximate = false) => ({
  amount,
  currency: 'THB',
  text,
  isApproximate,
});

/** A slice of the imported Honda Thailand catalogue. */
export const bikes: BikeCardData[] = [
  {
    id: 1,
    slug: 'honda-cbr1000rr-r-fireblade-sp',
    name: 'CBR1000RR-R Fireblade SP',
    brand: 'Honda',
    class: 'Supersport',
    cc: 1000,
    hp: 215,
    kg: 201,
    price: null,
    imageUrl: '/bikes/honda-cbr1000rr-r-fireblade-sp.jpg',
  },
  {
    id: 2,
    slug: 'honda-cbr500r',
    name: 'CBR500R',
    brand: 'Honda',
    class: 'Sport',
    cc: 471,
    hp: 47,
    kg: 192,
    price: thb(235800, 'THB 235,800'),
    imageUrl: '/bikes/honda-cbr500r.jpg',
  },
  {
    id: 3,
    slug: 'honda-cb650r',
    name: 'CB650R',
    brand: 'Honda',
    class: 'Naked',
    cc: 649,
    hp: 94,
    kg: 208,
    price: null,
    imageUrl: '/bikes/honda-cb650r.jpg',
  },
  {
    id: 4,
    slug: 'honda-adv350',
    name: 'ADV350',
    brand: 'Honda',
    class: 'Adventure scooter',
    cc: 330,
    hp: 29,
    kg: 186,
    price: thb(181900, 'THB 181,900 / 183,900'),
    imageUrl: '/bikes/honda-adv350.jpg',
  },
  {
    id: 5,
    slug: 'honda-cbr250rr',
    name: 'CBR250RR',
    brand: 'Honda',
    class: 'Supersport',
    cc: 250,
    hp: 42,
    kg: 168,
    price: thb(249000, 'THB ~249,000 (SP)', true),
    imageUrl: '/bikes/honda-cbr250rr.jpg',
  },
  {
    id: 6,
    slug: 'honda-scoopy',
    name: 'Scoopy',
    brand: 'Honda',
    class: 'Scooter',
    cc: 110,
    hp: 8.5,
    kg: 96,
    price: thb(55000, 'THB ~55,000-65,000 by variant', true),
    imageUrl: '/bikes/honda-scoopy.jpg',
  },
  {
    id: 7,
    slug: 'honda-uc3',
    name: 'UC3',
    brand: 'Honda',
    class: 'Electric scooter',
    // An electric scooter has no displacement, and this sheet is not itemised.
    cc: null,
    hp: null,
    kg: null,
    price: thb(132600, 'THB 132,600'),
    imageUrl: '/bikes/honda-uc3.jpg',
  },
  {
    id: 8,
    slug: 'honda-click-125i',
    name: 'Click 125i',
    brand: 'Honda',
    class: 'Scooter',
    cc: 124.9,
    hp: 11.1,
    kg: 111,
    price: thb(55700, 'THB 55,700'),
    // No freely licensed photograph exists for this model yet.
    imageUrl: null,
  },
];

export const brands = [{ name: 'Honda', countryCode: 'JP', count: 41, href: '/brands/honda' }];

export const classes = [
  { value: 'Adventure', label: 'Adventure', count: 3 },
  { value: 'Adventure scooter', label: 'Adventure scooter', count: 3 },
  { value: 'Naked', label: 'Naked', count: 4 },
  { value: 'Scooter', label: 'Scooter', count: 7 },
  { value: 'Supersport', label: 'Supersport', count: 2 },
];

export const sortOptions = [
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'power_desc', label: 'Most power' },
  { value: 'weight_asc', label: 'Lightest first' },
];

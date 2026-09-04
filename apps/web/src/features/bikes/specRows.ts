import { formatNumber, formatPrice } from '@motor-master/share_ui';
import type { SpecGroup } from '@motor-master/share_ui';
import type { BikeDetail } from '../../lib/types';

type Read = (bike: BikeDetail) => string | null;

function unit(value: number | null, suffix: string): string | null {
  return value === null ? null : `${formatNumber(value)} ${suffix}`;
}

interface RowSpec {
  field: string;
  label: string;
  read: Read;
}

/** Field keys match the `winners` map the API returns. */
const GROUPS: Array<{ title: string; rows: RowSpec[] }> = [
  {
    title: 'Engine',
    rows: [
      { field: 'Engine', label: 'Engine', read: (bike) => bike.specs.engine },
      {
        field: 'DisplacementCc',
        label: 'Displacement',
        read: (bike) => unit(bike.specs.displacementCc, 'cc'),
      },
      { field: 'PowerHp', label: 'Power', read: (bike) => unit(bike.specs.powerHp, 'hp') },
      { field: 'TorqueNm', label: 'Torque', read: (bike) => unit(bike.specs.torqueNm, 'Nm') },
      { field: 'Transmission', label: 'Transmission', read: (bike) => bike.specs.transmission },
    ],
  },
  {
    title: 'Running gear',
    rows: [
      {
        field: 'FrontSuspension',
        label: 'Front suspension',
        read: (bike) => bike.specs.frontSuspension,
      },
      {
        field: 'RearSuspension',
        label: 'Rear suspension',
        read: (bike) => bike.specs.rearSuspension,
      },
      { field: 'Brakes', label: 'Brakes', read: (bike) => bike.specs.brakes },
      { field: 'Tyres', label: 'Tyres', read: (bike) => bike.specs.tyres },
      {
        field: 'WheelbaseMm',
        label: 'Wheelbase',
        read: (bike) => unit(bike.specs.wheelbaseMm, 'mm'),
      },
    ],
  },
  {
    title: 'Weights and capacities',
    rows: [
      {
        field: 'KerbWeightKg',
        label: 'Kerb weight',
        read: (bike) => unit(bike.specs.kerbWeightKg, 'kg'),
      },
      {
        field: 'SeatHeightMm',
        label: 'Seat height',
        read: (bike) => unit(bike.specs.seatHeightMm, 'mm'),
      },
      { field: 'FuelTankL', label: 'Fuel tank', read: (bike) => unit(bike.specs.fuelTankL, 'L') },
    ],
  },
  {
    title: 'Equipment',
    rows: [
      { field: 'RiderAids', label: 'Rider aids', read: (bike) => bike.specs.riderAids },
      { field: 'Display', label: 'Display', read: (bike) => bike.specs.display },
    ],
  },
  {
    title: 'Price',
    rows: [
      { field: 'ModelYear', label: 'Model year', read: (bike) => String(bike.modelYear) },
      { field: 'PriceUsd', label: 'MSRP', read: (bike) => formatPrice(bike.priceUsd) },
    ],
  },
];

/**
 * Builds the spec table for one or more bikes. Rows no bike has a value for are
 * dropped, so a catalogue that has only headline figures does not render pages
 * of em dashes.
 */
export function buildSpecGroups(bikes: BikeDetail[]): SpecGroup[] {
  return GROUPS.map((group) => ({
    title: group.title,
    rows: group.rows
      .map((row) => ({
        field: row.field,
        label: row.label,
        values: bikes.map(row.read),
      }))
      .filter((row) => row.values.some((value) => value !== null)),
  })).filter((group) => group.rows.length > 0);
}

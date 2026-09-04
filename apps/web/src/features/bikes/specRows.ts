import { displayPrice, formatNumber } from '@motor-master/share_ui';
import type { SpecGroup } from '@motor-master/share_ui';
import type { BikeDetail } from '../../lib/types';

type Read = (bike: BikeDetail) => string | null;

function unit(value: number | null, suffix: string): string | null {
  return value === null ? null : `${formatNumber(value)} ${suffix}`;
}

/** "94 hp @ 12,000 rpm" reads better than two rows that have to be cross-referenced. */
function atRpm(value: number | null, suffix: string, rpm: number | null): string | null {
  if (value === null) return null;
  const figure = `${formatNumber(value)} ${suffix}`;
  return rpm === null ? figure : `${figure} @ ${formatNumber(rpm)} rpm`;
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
      { field: 'Engine', label: 'Engine', read: (b) => b.specs.engine },
      {
        field: 'DisplacementCc',
        label: 'Displacement',
        read: (b) => unit(b.specs.displacementCc, 'cc'),
      },
      { field: 'BoreStrokeMm', label: 'Bore x stroke', read: (b) => b.specs.boreStrokeMm },
      { field: 'Compression', label: 'Compression', read: (b) => b.specs.compression },
      {
        field: 'PowerHp',
        label: 'Power',
        read: (b) => atRpm(b.specs.powerHp, 'hp', b.specs.powerRpm),
      },
      { field: 'PowerKw', label: 'Power (kW)', read: (b) => unit(b.specs.powerKw, 'kW') },
      {
        field: 'TorqueNm',
        label: 'Torque',
        read: (b) => atRpm(b.specs.torqueNm, 'Nm', b.specs.torqueRpm),
      },
      { field: 'FuelSystem', label: 'Fuel system', read: (b) => b.specs.fuelSystem },
    ],
  },
  {
    title: 'Transmission',
    rows: [
      { field: 'Transmission', label: 'Gearbox', read: (b) => b.specs.transmission },
      { field: 'Clutch', label: 'Clutch', read: (b) => b.specs.clutch },
      { field: 'FinalDrive', label: 'Final drive', read: (b) => b.specs.finalDrive },
    ],
  },
  {
    title: 'Chassis',
    rows: [
      { field: 'Frame', label: 'Frame', read: (b) => b.specs.frame },
      { field: 'FrontSuspension', label: 'Front suspension', read: (b) => b.specs.frontSuspension },
      { field: 'RearSuspension', label: 'Rear suspension', read: (b) => b.specs.rearSuspension },
      { field: 'BrakeFront', label: 'Front brake', read: (b) => b.specs.brakeFront },
      { field: 'BrakeRear', label: 'Rear brake', read: (b) => b.specs.brakeRear },
      { field: 'TyreFront', label: 'Front tyre', read: (b) => b.specs.tyreFront },
      { field: 'TyreRear', label: 'Rear tyre', read: (b) => b.specs.tyreRear },
    ],
  },
  {
    title: 'Electric drivetrain',
    rows: [
      { field: 'BatteryKwh', label: 'Battery', read: (b) => unit(b.specs.batteryKwh, 'kWh') },
      { field: 'RangeKm', label: 'Range', read: (b) => unit(b.specs.rangeKm, 'km') },
      { field: 'Charging', label: 'Charging', read: (b) => b.specs.charging },
    ],
  },
  {
    title: 'Dimensions and weight',
    rows: [
      { field: 'KerbWeightKg', label: 'Kerb weight', read: (b) => unit(b.specs.kerbWeightKg, 'kg') },
      { field: 'SeatHeightMm', label: 'Seat height', read: (b) => unit(b.specs.seatHeightMm, 'mm') },
      { field: 'WheelbaseMm', label: 'Wheelbase', read: (b) => unit(b.specs.wheelbaseMm, 'mm') },
      {
        field: 'GroundClearanceMm',
        label: 'Ground clearance',
        read: (b) => unit(b.specs.groundClearanceMm, 'mm'),
      },
      { field: 'FuelTankL', label: 'Fuel tank', read: (b) => unit(b.specs.fuelTankL, 'L') },
      { field: 'FuelEconomy', label: 'Fuel economy', read: (b) => b.specs.fuelEconomy },
    ],
  },
  {
    title: 'Equipment',
    rows: [
      { field: 'RiderAids', label: 'Rider aids', read: (b) => b.specs.riderAids },
      { field: 'Display', label: 'Display', read: (b) => b.specs.display },
      { field: 'Variants', label: 'Variants', read: (b) => b.variants },
    ],
  },
  {
    title: 'Model and price',
    rows: [
      { field: 'ModelYear', label: 'Model year', read: (b) => String(b.modelYear) },
      { field: 'Markets', label: 'Sold in', read: (b) => (b.markets.length ? b.markets.join(', ') : null) },
      {
        field: 'Price',
        label: 'Price',
        read: (b) => (b.price ? displayPrice(b.price) : null),
      },
      {
        field: 'OtherPrices',
        label: 'Other markets',
        read: (b) =>
          b.otherPrices.length
            ? b.otherPrices.map((p) => `${p.market}: ${p.text}`).join(' · ')
            : null,
      },
    ],
  },
  {
    title: 'About this data',
    rows: [
      // Comparing two bikes means comparing how solid each figure is, so the
      // caveat and the compile date belong in the table, not only on a page.
      { field: 'Flags', label: 'Caveats', read: (b) => b.flags },
      {
        field: 'DataGeneratedAt',
        label: 'Specs as of',
        read: (b) => b.dataGeneratedAt,
      },
    ],
  },
];

/**
 * Builds the spec table for one or more bikes. Rows no bike has a value for are
 * dropped, so a sheet that only carries headline figures does not render pages
 * of em dashes — and the electric group disappears entirely for petrol bikes.
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

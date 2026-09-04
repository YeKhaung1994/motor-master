import { describe, expect, it } from 'vitest';
import { computeWinners } from '../services/winners.js';
import type { BikeDetailDto } from '../types.js';

function bike(
  id: number,
  values: Partial<BikeDetailDto['specs']> & { priceAmount?: number | null; currency?: string },
): BikeDetailDto {
  const { priceAmount = 10000, currency = 'THB', ...specs } = values;
  return {
    id,
    slug: `bike-${id}`,
    name: `Bike ${id}`,
    brand: 'Brand',
    brandSlug: 'brand',
    class: 'Naked',
    modelYear: 2024,
    price:
      priceAmount === null
        ? null
        : {
            amount: priceAmount,
            currency,
            market: 'TH',
            text: `${currency} ${priceAmount}`,
            isApproximate: false,
          },
    imageUrl: null,
    markets: ['TH'],
    otherPrices: [],
    variants: null,
    notes: null,
    flags: null,
    sourceUrl: null,
    priceSourceUrl: null,
    dataGeneratedAt: '2026-09-04',
    specs: {
      engine: null,
      displacementCc: null,
      boreStrokeMm: null,
      compression: null,
      powerHp: null,
      powerKw: null,
      powerRpm: null,
      torqueNm: null,
      torqueRpm: null,
      fuelSystem: null,
      transmission: null,
      clutch: null,
      finalDrive: null,
      frame: null,
      frontSuspension: null,
      rearSuspension: null,
      brakeFront: null,
      brakeRear: null,
      tyreFront: null,
      tyreRear: null,
      wheelbaseMm: null,
      seatHeightMm: null,
      groundClearanceMm: null,
      kerbWeightKg: null,
      fuelTankL: null,
      fuelEconomy: null,
      batteryKwh: null,
      rangeKm: null,
      charging: null,
      riderAids: null,
      display: null,
      ...specs,
    },
  };
}

describe('computeWinners', () => {
  it('gives the win to the highest figure for power-like fields', () => {
    const winners = computeWinners([bike(1, { powerHp: 73 }), bike(2, { powerHp: 125 })]);
    expect(winners.PowerHp).toBe(2);
  });

  it('gives the win to the lowest figure for weight and price', () => {
    const winners = computeWinners([
      bike(1, { kerbWeightKg: 184, priceAmount: 85990 }),
      bike(2, { kerbWeightKg: 212, priceAmount: 99990 }),
    ]);
    expect(winners.KerbWeightKg).toBe(1);
    expect(winners.Price).toBe(1);
  });

  it('refuses to compare prices quoted in different currencies', () => {
    const winners = computeWinners([
      bike(1, { priceAmount: 85990, currency: 'THB' }),
      bike(2, { priceAmount: 9999, currency: 'USD' }),
    ]);
    expect(winners.Price).toBeUndefined();
  });

  it('marks nothing when two bikes tie on the best figure', () => {
    const winners = computeWinners([bike(1, { powerHp: 45 }), bike(2, { powerHp: 45 })]);
    expect(winners.PowerHp).toBeUndefined();
  });

  it('ignores bikes with no value for a field', () => {
    const winners = computeWinners([bike(1, { torqueNm: null }), bike(2, { torqueNm: 67 })]);
    expect(winners.TorqueNm).toBe(2);
  });

  it('leaves a field out entirely when no bike has a value', () => {
    const winners = computeWinners([bike(1, {}), bike(2, {})]);
    expect(winners.DisplacementCc).toBeUndefined();
    expect(winners.FuelTankL).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { computeWinners } from '../services/winners.js';
import type { BikeDetailDto } from '../types.js';

function bike(id: number, values: Partial<BikeDetailDto['specs']> & { priceUsd?: number }): BikeDetailDto {
  const { priceUsd = 10000, ...specs } = values;
  return {
    id,
    slug: `bike-${id}`,
    name: `Bike ${id}`,
    brand: 'Brand',
    brandSlug: 'brand',
    class: 'Naked',
    modelYear: 2024,
    priceUsd,
    imageUrl: null,
    specs: {
      engine: null,
      displacementCc: null,
      powerHp: null,
      torqueNm: null,
      transmission: null,
      frontSuspension: null,
      rearSuspension: null,
      brakes: null,
      tyres: null,
      wheelbaseMm: null,
      kerbWeightKg: null,
      seatHeightMm: null,
      fuelTankL: null,
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
      bike(1, { kerbWeightKg: 184, priceUsd: 8599 }),
      bike(2, { kerbWeightKg: 212, priceUsd: 9999 }),
    ]);
    expect(winners.KerbWeightKg).toBe(1);
    expect(winners.PriceUsd).toBe(1);
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

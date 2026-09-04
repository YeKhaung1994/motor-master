import { create } from 'zustand';
import type { BikeCardDto, BikeDetail } from '../../lib/types';

export const MAX_COMPARE = 3;

export interface CompareEntry {
  id: number;
  slug: string;
  name: string;
  brand: string;
  priceUsd: number;
}

interface CompareState {
  bikes: CompareEntry[];
  isSelected: (id: number) => boolean;
  isFull: () => boolean;
  toggle: (bike: BikeCardDto | BikeDetail) => void;
  remove: (id: number) => void;
  clear: () => void;
  /** Hydrates the tray from a shared `/compare?ids=` link. */
  replaceAll: (bikes: CompareEntry[]) => void;
  /** The `ids=` value this selection maps to. */
  toIdsParam: () => string;
}

function toEntry(bike: BikeCardDto | BikeDetail): CompareEntry {
  return {
    id: bike.id,
    slug: bike.slug,
    name: bike.name,
    brand: bike.brand,
    priceUsd: bike.priceUsd,
  };
}

export const useCompare = create<CompareState>((set, get) => ({
  bikes: [],

  isSelected: (id) => get().bikes.some((bike) => bike.id === id),

  isFull: () => get().bikes.length >= MAX_COMPARE,

  toggle: (bike) =>
    set((state) => {
      if (state.bikes.some((entry) => entry.id === bike.id)) {
        return { bikes: state.bikes.filter((entry) => entry.id !== bike.id) };
      }
      // Silently ignoring the fourth pick keeps the button honest: it is
      // already disabled once three are in the tray.
      if (state.bikes.length >= MAX_COMPARE) return state;
      return { bikes: [...state.bikes, toEntry(bike)] };
    }),

  remove: (id) => set((state) => ({ bikes: state.bikes.filter((bike) => bike.id !== id) })),

  clear: () => set({ bikes: [] }),

  replaceAll: (bikes) => set({ bikes: bikes.slice(0, MAX_COMPARE) }),

  toIdsParam: () => get().bikes.map((bike) => bike.id).join(','),
}));

/** Parses the `ids=` query param into at most three positive integers. */
export function parseIdsParam(value: string | null): number[] {
  if (!value) return [];

  const ids = value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  return Array.from(new Set(ids)).slice(0, MAX_COMPARE);
}

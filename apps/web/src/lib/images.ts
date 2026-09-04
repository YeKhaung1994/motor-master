/**
 * Model photography lives in `apps/web/public/bikes/<slug>.jpg`. Resolving it by
 * convention means an imported catalogue shows its pictures without the data
 * carrying image URLs — and `BikeImage` falls back to a placeholder when a file
 * is not there yet. An explicit `imageUrl` from the API wins when one is set.
 */
export function bikeImageSrc(slug: string, imageUrl?: string | null): string {
  return imageUrl ?? `/bikes/${slug}.jpg`;
}

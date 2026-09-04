import { useQuery } from '@tanstack/react-query';

export interface ImageCredit {
  slug: string;
  model: string;
  file: string;
  title: string;
  artist: string | null;
  license: string | null;
  licenseUrl: string | null;
  source: string;
}

/**
 * Photography is reused under CC BY-SA and similar licences, which require the
 * credit to travel with the image — so it has to be on the page, not only in a
 * file in the repository.
 */
export function useImageCredits() {
  return useQuery({
    queryKey: ['image-credits'],
    queryFn: async (): Promise<ImageCredit[]> => {
      const response = await fetch('/bikes/credits.json');
      if (!response.ok) return [];
      return (await response.json()) as ImageCredit[];
    },
    staleTime: Infinity,
  });
}

export function useImageCredit(slug: string | undefined) {
  const { data } = useImageCredits();
  return slug ? data?.find((credit) => credit.slug === slug) : undefined;
}

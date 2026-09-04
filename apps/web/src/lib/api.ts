const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/** What went wrong, and what the reader can do about it. */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status: number,
    details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export type QueryValue = string | number | boolean | undefined | null | string[];

function toSearchParams(query: Record<string, QueryValue>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      // Repeated params: class=Naked&class=Sport
      value.forEach((entry) => params.append(key, entry));
    } else {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `?${search}` : '';
}

export async function apiGet<T>(
  path: string,
  query: Record<string, QueryValue> = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}${toSearchParams(query)}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiError("Couldn't reach motor-master. Check your connection and try again.", 0);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string; details?: Array<{ field: string; message: string }> }
      | null;

    throw new ApiError(
      body?.error ?? "Couldn't load that. Try again in a moment.",
      response.status,
      body?.details,
    );
  }

  return (await response.json()) as T;
}

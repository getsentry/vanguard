export type PaginatedResult<T> = {
  result: T;
  cursor: string;
  perPage: number;
  nextCursor: string;
  prevCursor: string;
};

// TODO(dcramer): how do you type this?
export async function paginate<T>(
  queryFn: Function,
  params: { [key: string]: any },
  cursor?: string | null,
  perPage: number = 50,
): Promise<PaginatedResult<T>> {
  let [offset, limit] = cursor
    ? cursor.split(":", 2).map((s) => parseInt(s, 10))
    : [0, 0];
  if (!offset) offset = 0;
  if (!limit) limit = perPage ?? 50;

  const result = await queryFn({
    ...params,
    offset,
    limit: limit + 1,
  });
  const nextCursor = result.length > limit ? `${offset + limit}:${limit}` : ``;
  const prevCursor =
    offset > 0 ? `${Math.max(offset - limit, 0)}:${limit}` : ``;
  return {
    result: result.slice(0, limit),
    cursor: `${offset}:${limit}`,
    perPage: limit,
    nextCursor,
    prevCursor,
  };
}

export interface ListQueryOptions {
  sortable: readonly string[]
  defaultSort: string
  defaultLimit?: number
  defaultAscending?: boolean
}

export interface ListQuery {
  page: number
  limit: number
  offset: number
  sortCol: string
  ascending: boolean
}

/** Parse page/limit/sort/dir from an admin list request, with an allowlisted
 *  sort column (never lets an unvalidated column reach `.order()`). */
export function parseListQuery(
  searchParams: URLSearchParams,
  { sortable, defaultSort, defaultLimit = 20, defaultAscending = false }: ListQueryOptions,
): ListQuery {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.max(1, parseInt(searchParams.get('limit') ?? String(defaultLimit), 10) || defaultLimit)
  const offset = (page - 1) * limit
  const sortParam = searchParams.get('sort') ?? defaultSort
  const sortCol = sortable.includes(sortParam) ? sortParam : defaultSort
  const dirParam = searchParams.get('dir')
  const ascending = dirParam ? dirParam === 'asc' : defaultAscending
  return { page, limit, offset, sortCol, ascending }
}

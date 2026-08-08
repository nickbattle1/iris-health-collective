import { computed, reactive, ref, watch } from 'vue'

/* sorting, per column filtering and paging for D.3.

   the brief asks for search by individual column, not one box over everything,
   so each column carries its own term and they narrow together. the export
   then takes whatever is left after the filters rather than the whole
   collection, which is the bit that makes it useful.

   40 providers and a few hundred bookings fit in memory, so all of this is
   client side. past a few thousand rows the sort and page would move into the
   firestore query. */

export function useDataTable(rows, columns, options = {}) {
  const filters = reactive({})
  const sortKey = ref(options.sortKey ?? columns[0].key)
  const sortDir = ref(options.sortDir ?? 'asc')
  const page = ref(1)
  const pageSize = ref(options.pageSize ?? 10)

  const value = (row, column) =>
    column.value ? column.value(row) : (row[column.key] ?? '')

  const text = (row, column) => String(value(row, column) ?? '').toLowerCase()

  const filtered = computed(() =>
    (rows.value ?? []).filter((row) =>
      columns.every((column) => {
        const term = (filters[column.key] ?? '').trim().toLowerCase()
        return !term || text(row, column).includes(term)
      }),
    ),
  )

  const sorted = computed(() => {
    const column = columns.find((c) => c.key === sortKey.value)
    if (!column) return filtered.value

    // copy first, sort mutates and the source is a computed
    return [...filtered.value].sort((a, b) => {
      const left = value(a, column)
      const right = value(b, column)

      // numbers and dates compare properly, everything else falls back to a
      // locale compare so names sort the way a person expects
      const result =
        left instanceof Date && right instanceof Date
          ? left - right
          : typeof left === 'number' && typeof right === 'number'
            ? left - right
            : String(left).localeCompare(String(right), 'en-AU', { sensitivity: 'base' })

      return sortDir.value === 'asc' ? result : -result
    })
  })

  const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize.value)))

  const paged = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return sorted.value.slice(start, start + pageSize.value)
  })

  // filtering down to three rows while sitting on page 4 shows an empty table
  watch([filtered, pageSize], () => {
    if (page.value > pageCount.value) page.value = pageCount.value
  })

  function toggleSort(key) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  function clearFilters() {
    for (const key of Object.keys(filters)) filters[key] = ''
  }

  const activeFilters = computed(
    () => Object.values(filters).filter((term) => (term ?? '').trim()).length,
  )

  // what the export writes: everything the filters left, not just this page
  const exportRows = computed(() =>
    sorted.value.map((row) =>
      Object.fromEntries(columns.map((column) => [column.key, value(row, column)])),
    ),
  )

  return {
    filters,
    sortKey,
    sortDir,
    page,
    pageSize,
    filtered,
    sorted,
    paged,
    pageCount,
    activeFilters,
    exportRows,
    toggleSort,
    clearFilters,
  }
}

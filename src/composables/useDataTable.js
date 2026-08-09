import { computed, reactive, ref, watch } from 'vue'

/* sorting, per column filtering and paging for D.3.

   the brief asks for search by individual column, not one box over everything,
   so each column carries its own term and they narrow together. the export
   then takes whatever is left after the filters rather than the whole
   collection, which is the bit that makes it useful.

   a column filter is a list of the values that column actually holds, not a
   text box. staff were being asked to guess both the wording and the spelling
   of something already printed on the screen in front of them, and a typo just
   returns nothing with no clue why. a column with a value per row, a written
   comment or a booking reference, has no list worth showing, so those fall
   back to typing.

   40 providers and a few hundred bookings fit in memory, so all of this is
   client side. past a few thousand rows the sort and page would move into the
   firestore query. */

// beyond this a dropdown is worse than a text box: scrolling a hundred
// references to find one is not picking from a list
const MAX_OPTIONS = 40

export function useDataTable(rows, columns, config = {}) {
  // seeded with every column, so a select bound to one has an empty string to
  // sit on rather than undefined, which shows as no option chosen at all
  const filters = reactive(Object.fromEntries(columns.map((column) => [column.key, ''])))
  const sortKey = ref(config.sortKey ?? columns[0].key)
  const sortDir = ref(config.sortDir ?? 'asc')
  const page = ref(1)
  const pageSize = ref(config.pageSize ?? 10)

  const value = (row, column) =>
    column.value ? column.value(row) : (row[column.key] ?? '')

  /* what the cell actually shows. the filter has to work on this rather than
     on the value underneath: the topic column stores "complaint" and prints
     "Making a complaint", and an option picked off the printed list has to
     match the row it came from. */
  const display = (row, column) => {
    const raw = value(row, column)
    const shown = column.format ? column.format(raw, row) : raw
    return shown == null ? '' : String(shown)
  }

  /* null for a column that gets a text box instead. a column can ask for one
     with filter: 'text', and one with too many distinct values is given one
     whether it asked or not.

     whatever is currently chosen stays on the list even once nothing matches
     it, so changing the reporting period cannot leave a filter applied with a
     dropdown showing nothing selected. */
  const options = computed(() => {
    const built = {}

    for (const column of columns) {
      if (column.filter === 'text') {
        built[column.key] = null
        continue
      }

      const found = new Set()
      for (const row of rows.value ?? []) {
        const shown = display(row, column)
        if (shown) found.add(shown)
      }
      if (filters[column.key]) found.add(filters[column.key])

      built[column.key] =
        found.size && found.size <= (column.maxOptions ?? MAX_OPTIONS)
          ? [...found].sort((a, b) => a.localeCompare(b, 'en-AU', { sensitivity: 'base' }))
          : null
    }

    return built
  })

  const filtered = computed(() =>
    (rows.value ?? []).filter((row) =>
      columns.every((column) => {
        const term = (filters[column.key] ?? '').trim()
        if (!term) return true

        // one picked off the list is a whole value, one typed is a fragment
        const shown = display(row, column)
        return options.value[column.key]
          ? shown === term
          : shown.toLowerCase().includes(term.toLowerCase())
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
    options,
    display,
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

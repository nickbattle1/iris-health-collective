<script setup>
import { computed, ref, watch } from 'vue'
import { useDataTable } from '@/composables/useDataTable'
import { downloadCsv, toCsv } from '@/lib/csv'
import { DATE_RANGES, withinRange } from '@/lib/dateRange'

/* the table both admin screens use. sortable headers, a search box per column,
   a reporting period, paging, and a CSV of whatever survived the filters.

   the period sits above the column filters rather than inside them, because
   "this month" is a question about the whole table and typing a month name
   into a date column would only ever match however that column happens to be
   formatted.

   accessibility, since a table is easy to get wrong: aria-sort on the header
   cell tells a screen reader which column is sorted and which way, the sort
   control is a real button inside the th rather than a click handler on the
   th, and the row count is announced when the filters change. */

const props = defineProps({
  rows: { type: Array, required: true },
  columns: { type: Array, required: true }, // [{ key, label, value?, format?, sortable? }]
  caption: { type: String, required: true },
  exportName: { type: String, default: 'export' },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Nothing to show.' },
  pageSize: { type: Number, default: 10 },
  // the Date field the period applies to. without one there is nothing
  // sensible to measure a period against, so the control stays hidden
  dateKey: { type: String, default: '' },
  dateLabel: { type: String, default: 'date' },
})

const range = ref('all')

const rowsRef = computed(() => {
  if (!props.dateKey || range.value === 'all') return props.rows
  const now = new Date()
  return props.rows.filter((row) => withinRange(row[props.dateKey], range.value, now))
})

const table = useDataTable(rowsRef, props.columns, { pageSize: props.pageSize })

const {
  filters, options, display, sortKey, sortDir, page, paged, sorted, pageCount,
  activeFilters, exportRows, toggleSort, clearFilters,
} = table

// showing page 4 of a year, then narrowing to this week, leaves an empty table
watch(range, () => {
  page.value = 1
})

const ariaSort = (key) =>
  sortKey.value !== key ? 'none' : sortDir.value === 'asc' ? 'ascending' : 'descending'

// the period goes in the filename, so a folder of exports still says which
// month each one covers once they are off the screen that made them
function exportCsv() {
  const stamp = new Date().toISOString().slice(0, 10)
  const period = range.value === 'all' ? '' : `-this-${range.value}`
  downloadCsv(
    `${props.exportName}${period}-${stamp}.csv`,
    toCsv(exportRows.value, props.columns),
  )
}
</script>

<template>
  <div>
    <div class="table-toolbar">
      <p class="mb-0 fw-semibold" role="status" aria-live="polite">
        <span v-if="loading">Loading</span>
        <span v-else>
          {{ sorted.length }} {{ sorted.length === 1 ? 'row' : 'rows' }}
          <span v-if="dateKey && range !== 'all'" class="text-muted fw-normal">
            {{ DATE_RANGES[range].toLowerCase() }}
          </span>
          <span v-if="activeFilters" class="text-muted fw-normal">after filtering</span>
        </span>
      </p>

      <div class="d-flex flex-wrap align-items-center gap-2">
        <button
          v-if="activeFilters"
          type="button"
          class="btn btn-link fw-semibold p-0"
          @click="clearFilters"
        >
          Clear column filters
        </button>

        <div v-if="dateKey" class="range-row">
          <label class="fw-semibold small mb-0" :for="`range-${exportName}`">
            Showing<span class="visually-hidden"> rows by {{ dateLabel }}</span>
          </label>
          <select
            :id="`range-${exportName}`"
            v-model="range"
            class="form-select form-select-sm range-select"
          >
            <option v-for="(label, value) in DATE_RANGES" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>

        <button
          type="button"
          class="btn-iris-outline btn-sm"
          :disabled="!sorted.length"
          @click="exportCsv"
        >
          <i class="bi bi-download" aria-hidden="true"></i> Export CSV
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table align-middle data-table">
        <caption class="visually-hidden">{{ caption }}</caption>

        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" scope="col" :aria-sort="ariaSort(column.key)">
              <button
                v-if="column.sortable !== false"
                type="button"
                class="sort-btn"
                @click="toggleSort(column.key)"
              >
                {{ column.label }}
                <i
                  class="bi"
                  :class="
                    sortKey === column.key
                      ? sortDir === 'asc'
                        ? 'bi-caret-up-fill'
                        : 'bi-caret-down-fill'
                      : 'bi-chevron-expand'
                  "
                  aria-hidden="true"
                ></i>
                <span class="visually-hidden">, sort by {{ column.label }}</span>
              </button>
              <span v-else>{{ column.label }}</span>
            </th>
            <th v-if="$slots.actions" scope="col">Actions</th>
          </tr>

          <tr class="filter-row">
            <td v-for="column in columns" :key="column.key">
              <label class="visually-hidden" :for="`filter-${exportName}-${column.key}`">
                Filter by {{ column.label }}
              </label>

              <select
                v-if="options[column.key]"
                :id="`filter-${exportName}-${column.key}`"
                v-model="filters[column.key]"
                class="form-select form-select-sm"
              >
                <option value="">All</option>
                <option v-for="choice in options[column.key]" :key="choice" :value="choice">
                  {{ choice }}
                </option>
              </select>

              <!-- a comment or a reference is different on every row, so there
                   is no list to offer and typing is the only thing that helps -->
              <input
                v-else
                :id="`filter-${exportName}-${column.key}`"
                v-model="filters[column.key]"
                type="search"
                class="form-control form-control-sm"
                placeholder="Type to filter"
              />
            </td>
            <td v-if="$slots.actions"></td>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="text-muted py-4">
              Loading...
            </td>
          </tr>

          <tr v-else-if="!paged.length">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="text-muted py-4">
              {{ activeFilters ? 'No rows match those filters.' : emptyText }}
            </td>
          </tr>

          <tr v-for="(row, index) in paged" v-else :key="row.id ?? index">
            <td v-for="column in columns" :key="column.key">{{ display(row, column) }}</td>
            <td v-if="$slots.actions"><slot name="actions" :row="row"></slot></td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="pageCount > 1" aria-label="Table pages" class="table-pager">
      <button type="button" class="btn-iris-outline btn-sm" :disabled="page === 1" @click="page--">
        Previous<span class="visually-hidden"> page</span>
      </button>
      <span class="fw-semibold">Page {{ page }} of {{ pageCount }}</span>
      <button
        type="button"
        class="btn-iris-outline btn-sm"
        :disabled="page === pageCount"
        @click="page++"
      >
        Next<span class="visually-hidden"> page</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.table-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.data-table thead th {
  background: var(--iris-purple-50);
  color: var(--iris-purple-900);
  vertical-align: bottom;
  white-space: nowrap;
}

.sort-btn {
  border: 0;
  background: none;
  padding: 0;
  font-weight: 700;
  color: inherit;
  cursor: pointer;
}

/* the control carries no visible label. the column it belongs to is the one
   above it and the hidden label spells that out for a screen reader.

   the min width stops six controls squeezing each other into nothing, the
   table scrolls sideways instead. wider than it was, because a dropdown has to
   show enough of the chosen value to be worth choosing */
.filter-row td {
  background: var(--iris-surface-muted);
  padding: 0.4rem 0.5rem;
  min-width: 9.5rem;
}

.table-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-sm {
  min-height: 40px;
  padding: 0.35rem 0.9rem;
  font-size: 0.9rem;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.range-select {
  width: auto;
  min-height: 40px;
  font-weight: 700;
  color: var(--iris-purple-900);
}
</style>

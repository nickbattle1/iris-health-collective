<script setup>
import { computed } from 'vue'
import { useDataTable } from '@/composables/useDataTable'
import { downloadCsv, toCsv } from '@/lib/csv'

/* the table both admin screens use. sortable headers, a search box per column,
   paging, and a CSV of whatever survived the filters.

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
})

const rowsRef = computed(() => props.rows)
const table = useDataTable(rowsRef, props.columns, { pageSize: props.pageSize })

const {
  filters, sortKey, sortDir, page, paged, sorted, pageCount, activeFilters, exportRows,
  toggleSort, clearFilters,
} = table

const cell = (row, column) => {
  const raw = column.value ? column.value(row) : row[column.key]
  return column.format ? column.format(raw, row) : raw
}

const ariaSort = (key) =>
  sortKey.value !== key ? 'none' : sortDir.value === 'asc' ? 'ascending' : 'descending'

function exportCsv() {
  const stamp = new Date().toISOString().slice(0, 10)
  downloadCsv(`${props.exportName}-${stamp}.csv`, toCsv(exportRows.value, props.columns))
}
</script>

<template>
  <div>
    <div class="table-toolbar">
      <p class="mb-0 fw-semibold" role="status" aria-live="polite">
        <span v-if="loading">Loading</span>
        <span v-else>
          {{ sorted.length }} {{ sorted.length === 1 ? 'row' : 'rows' }}
          <span v-if="activeFilters" class="text-muted fw-normal">after filtering</span>
        </span>
      </p>

      <div class="d-flex flex-wrap gap-2">
        <button
          v-if="activeFilters"
          type="button"
          class="btn btn-link fw-semibold p-0"
          @click="clearFilters"
        >
          Clear column filters
        </button>
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
              <input
                :id="`filter-${exportName}-${column.key}`"
                v-model="filters[column.key]"
                type="search"
                class="form-control form-control-sm"
                placeholder="Filter"
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
            <td v-for="column in columns" :key="column.key">{{ cell(row, column) }}</td>
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

/* the placeholder is just "Filter", the column it belongs to is obvious from
   the header above it, and the hidden label spells it out for a screen reader.
   the min width stops six inputs squeezing each other into nothing, the table
   scrolls sideways instead */
.filter-row td {
  background: var(--iris-surface-muted);
  padding: 0.4rem 0.5rem;
  min-width: 7.5rem;
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
</style>

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as resourceService from '@/services/resourceService'
import { useSavedResources } from '@/composables/useSavedResources'

export const RESOURCE_CATEGORIES = {
  'health-guides': 'Health and wellbeing',
  'families-allies': 'For families and allies',
  multilingual: 'Other languages',
  'digital-safety': 'Digital safety',
}

export const useResourceStore = defineStore('resources', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref('')
  const category = ref('')
  const savedOnly = ref(false)

  const { isSaved } = useSavedResources()

  async function load() {
    if (items.value.length) return
    loading.value = true
    error.value = ''
    try {
      items.value = await resourceService.fetchResources()
    } catch (err) {
      error.value = 'We could not load the guides. Please try again.'
      console.error('[resources] load', err)
    } finally {
      loading.value = false
    }
  }

  const results = computed(() =>
    items.value.filter(
      (item) =>
        (!category.value || item.category === category.value) &&
        (!savedOnly.value || isSaved(item.slug)),
    ),
  )

  // only categories that have something in them, so a filter never returns none
  const categories = computed(() => {
    const found = new Set(items.value.map((item) => item.category))
    return Object.entries(RESOURCE_CATEGORIES).filter(([key]) => found.has(key))
  })

  return { items, loading, error, category, savedOnly, results, categories, load }
})

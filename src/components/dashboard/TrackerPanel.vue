<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '@/composables/useDashboard'
import { useTheme } from '@/composables/useTheme'

const { theme } = useTheme()
const { dayProgress } = useDashboard()

const rows = computed(() => [
  {
    key: 'worship',
    label: 'Поклонения',
    ...dayProgress.value.worship,
    fillPercent: dayProgress.value.worship.percent,
    style: theme.value.trackerBars[0],
  },
  {
    key: 'tasks',
    label: 'Дела',
    ...dayProgress.value.tasks,
    fillPercent: dayProgress.value.tasks.percent,
    style: theme.value.trackerBars[1],
  },
])

const rowCaption = (row: (typeof rows.value)[number]) => {
  if (row.total === 0) return 'Нет записей'
  return `${row.done}/${row.total} ${row.percent}%`
}
</script>

<template>
  <section class="surface bottom-panel tracker-panel flex flex-col p-4">
    <h3 class="panel-title">Трекер</h3>

    <div class="tracker-list">
      <div v-for="row in rows" :key="row.key" class="tracker-row">
        <p class="tracker-row-label">{{ row.label }}</p>
        <div class="tracker-track" :aria-label="`${row.label}: ${rowCaption(row)}`">
          <div
            class="tracker-fill"
            :style="{
              width: `${row.fillPercent}%`,
              background: row.style.background,
              boxShadow: row.style.shadow,
            }"
          />
          <span class="tracker-caption">{{ rowCaption(row) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

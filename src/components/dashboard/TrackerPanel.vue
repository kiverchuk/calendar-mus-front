<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const bars = [
  { label: 'Поклонения', index: 0 },
  { label: 'Дела', index: 1 },
] as const

const { theme } = useTheme()
</script>

<template>
  <section class="surface bottom-panel flex flex-col p-4">
    <h3 class="panel-title">Трекер</h3>
    <div class="flex flex-1 flex-col justify-center gap-4">
      <div v-for="bar in bars" :key="bar.label">
        <p class="mb-2 text-center text-sm" :style="{ color: 'var(--muted)' }">{{ bar.label }}</p>
        <div
          class="tracker-bar"
          :style="{
            background: theme.trackerBars[bar.index].background,
            boxShadow: theme.trackerBars[bar.index].shadow,
          }"
        />
      </div>
    </div>
  </section>
</template>

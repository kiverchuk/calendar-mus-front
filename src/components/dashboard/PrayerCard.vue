<script setup lang="ts">
import { computed } from 'vue'
import PrayerRow from '@/components/dashboard/PrayerRow.vue'
import { useDashboard } from '@/composables/useDashboard'
import { useTheme } from '@/composables/useTheme'
import type { PrayerCard } from '@/types/dashboard'

const props = defineProps<{
  prayer: PrayerCard
  index: number
}>()

const { cardRows, rowKey, addNewInput } = useDashboard()
const { theme } = useTheme()

const rows = computed(() => cardRows(props.index))
const visual = computed(() => theme.value.prayerVisuals?.[props.index])
const cardStyle = computed(() => ({
  background: visual.value?.background,
  boxShadow: visual.value?.boxShadow,
}))
</script>

<template>
  <section class="mx-auto mb-2 flex w-full max-w-[16rem] flex-col">
    <h3 class="prayer-title">{{ prayer.title }}</h3>
    <p class="prayer-time">{{ prayer.time }}</p>
    <div class="prayer-card" :style="cardStyle">
      <div class="prayer-card-content">
        <TransitionGroup name="list-item" tag="div">
          <PrayerRow
            v-for="(row, rowIndex) in rows"
            :key="rowKey(row)"
            :row="row"
            :card-index="index"
            :row-index="rowIndex"
          />
        </TransitionGroup>
        <button type="button" class="add-btn" :aria-label="`Добавить элемент в ${prayer.title}`" @click="addNewInput(index)">
          +
        </button>
      </div>
    </div>
  </section>
</template>

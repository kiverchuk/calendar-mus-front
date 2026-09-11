<script setup lang="ts">
import PrayerCard from '@/components/dashboard/PrayerCard.vue'
import { useDashboard } from '@/composables/useDashboard'

const { prayers } = useDashboard()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-3">
    <PrayerCard v-for="(prayer, index) in prayers" :key="prayer.title" :prayer="prayer" :index="index" />
  </div>
</template>

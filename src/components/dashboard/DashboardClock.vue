<script setup lang="ts">
import { useDashboard } from '@/composables/useDashboard'

const { clockTime } = useDashboard()
</script>

<template>
  <div class="flex items-center justify-center">
    <div class="clock-text">{{ clockTime }}</div>
  </div>
</template>

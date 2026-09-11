<script setup lang="ts">
import { provideTheme } from '@/composables/useTheme'
import IslamicDashboard from '@/components/dashboard/IslamicDashboard.vue'

provideTheme()
</script>

<template>
  <IslamicDashboard />
</template>

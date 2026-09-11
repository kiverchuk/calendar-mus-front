<script setup lang="ts">
import { computed } from 'vue'
import ThemeSelect from '@/components/ThemeSelect.vue'
import BottomGrid from '@/components/dashboard/BottomGrid.vue'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import PrayerBoard from '@/components/dashboard/PrayerBoard.vue'
import TaskActionMenu from '@/components/dashboard/TaskActionMenu.vue'
import { provideDashboard } from '@/composables/useDashboard'
import { useTheme } from '@/composables/useTheme'
import { themeStyle } from '@/themes/style'

provideDashboard()

const { theme } = useTheme()
const style = computed(() => themeStyle(theme.value))
</script>

<template>
  <div class="dashboard" :data-theme="theme.id" :style="style">
    <div class="texture-overlay" />
    <div class="dashboard-shell">
      <ThemeSelect />
      <DashboardHeader />
      <PrayerBoard />
      <BottomGrid />
      <TaskActionMenu />
    </div>
  </div>
</template>

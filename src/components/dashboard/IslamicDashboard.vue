<script setup lang="ts">
import { computed } from 'vue'
import BottomGrid from '@/components/dashboard/BottomGrid.vue'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import PrayerBoard from '@/components/dashboard/PrayerBoard.vue'
import TaskActionMenu from '@/components/dashboard/TaskActionMenu.vue'
import GoalsPanel from '@/components/goals/GoalsPanel.vue'
import SettingsModal from '@/components/settings/SettingsModal.vue'
import { provideDashboard } from '@/composables/useDashboard'
import { provideGoals } from '@/composables/useGoals'
import { provideLocation } from '@/composables/useLocation'
import { provideSettings } from '@/composables/useSettings'
import { useTheme } from '@/composables/useTheme'
import { themeStyle } from '@/themes/style'

provideDashboard()
provideGoals()
provideLocation()
provideSettings()

const { theme } = useTheme()
const style = computed(() => themeStyle(theme.value))
</script>

<template>
  <div id="calmus-app" class="dashboard" :data-theme="theme.id" :style="style">
    <div class="texture-overlay" />
    <div class="dashboard-shell">
      <DashboardHeader />
      <PrayerBoard />
      <BottomGrid />
      <GoalsPanel />
      <TaskActionMenu />
      <SettingsModal />
    </div>
  </div>
</template>

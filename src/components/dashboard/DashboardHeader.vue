<script setup lang="ts">
import DashboardCalendar from '@/components/dashboard/DashboardCalendar.vue'
import DashboardClock from '@/components/dashboard/DashboardClock.vue'
import SettingsBar from '@/components/settings/SettingsBar.vue'
</script>

<template>
  <div class="header-overlay">
    <SettingsBar />
    <div class="clock-slot">
      <DashboardClock />
    </div>
    <div class="calendar-slot">
      <DashboardCalendar />
    </div>
  </div>
</template>

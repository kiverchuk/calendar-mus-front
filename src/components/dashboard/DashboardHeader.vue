<script setup lang="ts">
import DashboardCalendar from '@/components/dashboard/DashboardCalendar.vue'
import DashboardClock from '@/components/dashboard/DashboardClock.vue'
</script>

<template>
  <div class="header-overlay grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
    <div class="clock-slot">
      <DashboardClock />
    </div>
    <div class="flex justify-center lg:justify-end">
      <DashboardCalendar />
    </div>
  </div>
</template>

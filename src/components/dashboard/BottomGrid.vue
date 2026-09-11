<script setup lang="ts">
import NotesPanel from '@/components/dashboard/NotesPanel.vue'
import ReminderPanel from '@/components/dashboard/ReminderPanel.vue'
import TrackerPanel from '@/components/dashboard/TrackerPanel.vue'
</script>

<template>
  <div class="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
    <ReminderPanel />
    <NotesPanel />
    <TrackerPanel />
  </div>
</template>

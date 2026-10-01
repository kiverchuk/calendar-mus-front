<script setup lang="ts">
import { defaultReminder } from '@/data/reminder'

const reminder = defaultReminder
</script>

<template>
  <section class="surface bottom-panel flex flex-col px-4 py-4" aria-label="Напоминание">
    <h3 class="panel-title">Напоминание</h3>
    <div class="reminder-body">
      <p class="reminder-text">{{ reminder.text }}</p>
      <p v-if="reminder.signature" class="reminder-signature">{{ reminder.signature }}</p>
    </div>
  </section>
</template>

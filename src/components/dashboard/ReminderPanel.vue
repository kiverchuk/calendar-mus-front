<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')
</script>

<template>
  <section class="surface bottom-panel flex flex-col px-4 py-4">
    <h3 class="panel-title">Напоминание</h3>
    <textarea v-model="text" class="reminder-textarea flex-1" placeholder="Введите напоминание" aria-label="Напоминание" />
  </section>
</template>

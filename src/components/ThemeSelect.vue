<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { themes, themeId, setTheme } = useTheme()

const onChange = (event: Event) => {
  setTheme((event.target as HTMLSelectElement).value)
}
</script>

<template>
  <label class="theme-select">
    <span>Тема</span>
    <select :value="themeId" aria-label="Тема" @change="onChange">
      <option v-for="item in themes" :key="item.id" :value="item.id">
        {{ item.label }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { activeHints, type ApiHint } from '@/api/hints'

const reminders = ref<ApiHint[]>([])
const index = ref(0)
let timer = 0

const current = computed(() => reminders.value[index.value] ?? null)

const localDateTime = () => {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const asList = (value: ApiHint[] | Record<string, ApiHint> | null | undefined) => {
  if (!value) return []
  const list = Array.isArray(value) ? value : Object.values(value)
  return list.filter((hint) => hint.text?.trim())
}

const load = async () => {
  try {
    const response = await activeHints(localDateTime())
    const next = asList(response.data.active_hints)
    const currentId = reminders.value[index.value]?.id
    reminders.value = next
    const kept = next.findIndex((hint) => hint.id === currentId)
    index.value = kept >= 0 ? kept : 0
  } catch {
    reminders.value = []
    index.value = 0
  }
}

onMounted(() => {
  void load()
  timer = window.setInterval(() => {
    void load()
  }, 30_000)
})

onUnmounted(() => {
  window.clearInterval(timer)
})
</script>

<template>
  <section class="surface bottom-panel reminder-panel flex flex-col px-4 py-4" aria-label="Напоминание">
    <h3 class="panel-title">Напоминание</h3>
    <div class="reminder-body">
      <template v-if="current">
        <p class="reminder-text">{{ current.text }}</p>
        <p v-if="current.signature" class="reminder-signature">{{ current.signature }}</p>
      </template>
    </div>
    <div v-if="reminders.length > 1" class="reminder-dots" role="tablist" aria-label="Напоминания этого часа">
      <button
        v-for="(hint, dotIndex) in reminders"
        :key="hint.id"
        type="button"
        class="reminder-dot"
        :class="{ 'is-active': dotIndex === index }"
        role="tab"
        :aria-selected="dotIndex === index"
        :aria-label="`Напоминание ${dotIndex + 1}`"
        @click="index = dotIndex"
      />
    </div>
  </section>
</template>

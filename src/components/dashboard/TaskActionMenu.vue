<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useDashboard } from '@/composables/useDashboard'

const { taskMenu, menuTaskStatus, closeTaskMenu, setMenuTaskStatus, editTaskFromMenu } = useDashboard()

const statusActions = computed(() => {
  if (menuTaskStatus.value === 'done') {
    return [
      { label: 'Снять выполнение', status: 'none' as const },
      { label: 'Отметить просроченным', status: 'pending' as const },
    ]
  }
  if (menuTaskStatus.value === 'pending') {
    return [
      { label: 'Отметить выполненным', status: 'done' as const },
      { label: 'Снять просрочку', status: 'none' as const },
    ]
  }
  return [
    { label: 'Отметить выполненным', status: 'done' as const },
    { label: 'Отметить просроченным', status: 'pending' as const },
  ]
})

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeTaskMenu()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="taskMenu" class="task-menu-layer" @click="closeTaskMenu" @contextmenu.prevent>
    <div class="task-menu" :style="{ left: `${taskMenu.x}px`, top: `${taskMenu.y}px` }" role="menu" @click.stop>
      <button
        v-for="action in statusActions"
        :key="action.label"
        type="button"
        class="task-menu-item"
        @click="setMenuTaskStatus(action.status)"
      >
        {{ action.label }}
      </button>
      <button type="button" class="task-menu-item" @click="editTaskFromMenu">Изменить</button>
    </div>
  </div>
</template>

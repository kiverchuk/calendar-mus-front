<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, type ComponentPublicInstance } from 'vue'
import { useGoals } from '@/composables/useGoals'
import type { GoalItem } from '@/types/goals'

const SUBTASK_PREVIEW = 5

const props = defineProps<{
  goal: GoalItem
}>()

const {
  goalProgress,
  formatRange,
  toggleGoal,
  deleteGoal,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  reorderSubtask,
} = useGoals()

const draftSubtask = ref('')
const addingSubtask = ref(false)
const expanded = ref(false)
const confirmDelete = ref(false)
const listRef = ref<ComponentPublicInstance | HTMLElement | null>(null)
const dragId = ref<string | null>(null)
const dragOffsetY = ref(0)

const progress = computed(() => goalProgress(props.goal))
const range = computed(() => formatRange(props.goal))

/** Невыполненные в порядке создания/приоритета, выполненные в конце. */
const sortedSubtasks = computed(() => {
  const open = props.goal.subtasks.filter((item) => !item.done)
  const done = props.goal.subtasks.filter((item) => item.done)
  return [...open, ...done]
})

const visibleSubtasks = computed(() =>
  expanded.value ? sortedSubtasks.value : sortedSubtasks.value.slice(0, SUBTASK_PREVIEW),
)

const hiddenCount = computed(() => Math.max(0, sortedSubtasks.value.length - SUBTASK_PREVIEW))
const canToggleList = computed(() => sortedSubtasks.value.length > SUBTASK_PREVIEW)

let startY = 0
let pointerId: number | null = null

const listRoot = () => {
  const value = listRef.value
  if (!value) return null
  return value instanceof HTMLElement ? value : (value.$el as HTMLElement | null)
}

const openVisibleIds = () => visibleSubtasks.value.filter((item) => !item.done).map((item) => item.id)

const rowElements = () => {
  const root = listRoot()
  if (!root) return [] as HTMLElement[]
  return [...root.querySelectorAll<HTMLElement>('.goal-subtask.is-draggable')]
}

const clearDrag = () => {
  dragId.value = null
  dragOffsetY.value = 0
  pointerId = null
  startY = 0
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

const onPointerMove = (event: PointerEvent) => {
  if (!dragId.value || pointerId === null || event.pointerId !== pointerId) return
  dragOffsetY.value = event.clientY - startY

  const ids = openVisibleIds()
  const fromIndex = ids.indexOf(dragId.value)
  if (fromIndex < 0) return

  const rows = rowElements()
  if (!rows.length) return

  let targetIndex = fromIndex
  for (let index = 0; index < rows.length; index += 1) {
    if (index === fromIndex) continue
    const rect = rows[index].getBoundingClientRect()
    const middle = rect.top + rect.height / 2
    if (fromIndex < index && event.clientY > middle) targetIndex = index
    if (fromIndex > index && event.clientY < middle) targetIndex = index
  }

  if (targetIndex === fromIndex) return
  const targetId = ids[targetIndex]
  if (!targetId) return

  reorderSubtask(props.goal.id, dragId.value, targetId)
  void nextTick(() => {
    startY = event.clientY
    dragOffsetY.value = 0
  })
}

const onPointerUp = (event: PointerEvent) => {
  if (pointerId === null || event.pointerId !== pointerId) return
  clearDrag()
}

const onHandlePointerDown = (subtaskId: string, done: boolean, event: PointerEvent) => {
  if (done || event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  dragId.value = subtaskId
  startY = event.clientY
  dragOffsetY.value = 0
  pointerId = event.pointerId
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

const startAddSubtask = () => {
  addingSubtask.value = true
  draftSubtask.value = ''
}

const cancelAddSubtask = () => {
  addingSubtask.value = false
  draftSubtask.value = ''
}

const submitSubtask = () => {
  if (!addSubtask(props.goal.id, draftSubtask.value)) return
  draftSubtask.value = ''
  addingSubtask.value = false
}

const askDeleteGoal = () => {
  confirmDelete.value = true
}

const cancelDeleteGoal = () => {
  confirmDelete.value = false
}

const confirmDeleteGoal = () => {
  deleteGoal(props.goal.id)
  confirmDelete.value = false
}

const onConfirmKeydown = (event: KeyboardEvent) => {
  if (!confirmDelete.value) return
  if (event.key === 'Escape') cancelDeleteGoal()
}

const rowStyle = (subtaskId: string) => {
  if (dragId.value !== subtaskId) return undefined
  return {
    transform: `translate3d(0, ${dragOffsetY.value}px, 0)`,
    zIndex: 5,
    transition: 'none',
    touchAction: 'none',
  }
}

onMounted(() => window.addEventListener('keydown', onConfirmKeydown))
onBeforeUnmount(() => {
  clearDrag()
  window.removeEventListener('keydown', onConfirmKeydown)
})
</script>

<template>
  <article class="goal-card" :class="{ 'is-done': goal.done }">
    <header class="goal-card-head">
      <div class="goal-card-titles">
        <button
          type="button"
          class="goal-check"
          :class="{ 'is-active': goal.done }"
          :aria-label="goal.done ? 'Снять выполнение цели' : 'Отметить цель выполненной'"
          @click="toggleGoal(goal.id)"
        >
          <span aria-hidden="true">{{ goal.done ? '✓' : '' }}</span>
        </button>
        <div class="min-w-0">
          <h4 class="goal-card-title" :class="{ 'is-struck': goal.done }">{{ goal.text }}</h4>
          <p v-if="range" class="goal-card-range">{{ range }}</p>
        </div>
      </div>
      <button type="button" class="goal-icon-btn" aria-label="Удалить цель" @click="askDeleteGoal">✕</button>
    </header>

    <Teleport to="#calmus-app">
      <div v-if="confirmDelete" class="goal-confirm-layer" @click="cancelDeleteGoal">
        <div
          class="goal-confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Подтверждение удаления"
          @click.stop
        >
          <h4 class="goal-confirm-title">Удалить цель?</h4>
          <p class="goal-confirm-text">
            «{{ goal.text }}» будет удалена вместе со всеми подзадачами. Это действие нельзя отменить.
          </p>
          <div class="goal-confirm-actions">
            <button type="button" class="goals-add-btn is-ghost" @click="cancelDeleteGoal">Отмена</button>
            <button type="button" class="goals-add-btn" @click="confirmDeleteGoal">Удалить</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="goal-progress" :aria-label="`Прогресс ${progress.percent}%`">
      <div class="goal-progress-fill" :style="{ width: `${progress.percent}%` }" />
      <span class="goal-progress-label">{{ progress.percent }}%</span>
    </div>

    <div class="goal-subtasks">
      <TransitionGroup
        ref="listRef"
        name="goal-sub"
        tag="div"
        class="goal-subtasks-list"
        :class="{ 'is-sorting': !!dragId }"
        :css="!dragId"
      >
        <div
          v-for="subtask in visibleSubtasks"
          :key="subtask.id"
          class="goal-subtask"
          :class="{
            'is-done': subtask.done,
            'is-draggable': !subtask.done,
            'is-dragging': dragId === subtask.id,
          }"
          :style="rowStyle(subtask.id)"
        >
          <button
            v-if="!subtask.done"
            type="button"
            class="goal-drag-handle"
            aria-label="Переместить подзадачу"
            @pointerdown="onHandlePointerDown(subtask.id, subtask.done, $event)"
          >
            ⋮⋮
          </button>
          <button
            type="button"
            class="goal-check goal-check-sm"
            :class="{ 'is-active': subtask.done }"
            :aria-label="subtask.done ? 'Снять выполнение подзадачи' : 'Отметить подзадачу'"
            @click="toggleSubtask(goal.id, subtask.id)"
          >
            <span aria-hidden="true">{{ subtask.done ? '✓' : '' }}</span>
          </button>
          <span class="goal-subtask-text" :class="{ 'is-struck': subtask.done }">{{ subtask.text }}</span>
          <button
            type="button"
            class="goal-icon-btn goal-icon-btn-sm"
            aria-label="Удалить подзадачу"
            @click="deleteSubtask(goal.id, subtask.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>

      <button
        v-if="canToggleList"
        type="button"
        class="goal-subtasks-toggle"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Свернуть' : `Ещё ${hiddenCount}` }}
      </button>

      <div v-if="addingSubtask" class="goal-subtask-form">
        <input
          v-model="draftSubtask"
          type="text"
          class="goal-input"
          placeholder="Подзадача"
          maxlength="120"
          @keydown.enter.prevent="submitSubtask"
          @keydown.esc.prevent="cancelAddSubtask"
        />
        <button type="button" class="goal-form-btn" aria-label="Сохранить подзадачу" @click="submitSubtask">
          +
        </button>
        <button type="button" class="goal-form-btn is-ghost" aria-label="Отмена" @click="cancelAddSubtask">
          ✕
        </button>
      </div>

      <button
        v-else
        type="button"
        class="goal-add-sub"
        aria-label="Добавить подзадачу"
        @click="startAddSubtask"
      >
        +
      </button>
    </div>
  </article>
</template>

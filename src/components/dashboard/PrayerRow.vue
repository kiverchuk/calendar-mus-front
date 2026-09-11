<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '@/composables/useDashboard'
import { useTheme } from '@/composables/useTheme'
import { fixedRowBackground } from '@/themes/style'
import type { CardRow } from '@/types/dashboard'

const props = defineProps<{
  row: CardRow
  cardIndex: number
  rowIndex: number
}>()

const {
  rowText,
  rowTime,
  rowStatus,
  statusTitle,
  isRowExpanded,
  isTaskContinuation,
  onRowClick,
  onBadgeClick,
  openTaskMenu,
  editorText,
  editorTime,
  timeError,
  onTaskTextInput,
  handleTimeKeydown,
  handleTimeBeforeInput,
  handleTimeInput,
  placeTimeCaret,
  handleExpandedBlur,
} = useDashboard()
const { theme } = useTheme()

const expanded = computed(() => isRowExpanded(props.cardIndex, props.row))
const status = computed(() => rowStatus(props.row))
const continued = computed(() => isTaskContinuation(props.cardIndex, props.row))
const struck = computed(() => status.value === 'done' || status.value === 'pending')
const rowDomKey = computed(() => `${props.cardIndex}:${props.row.kind === 'task' ? props.row.task.id : props.row.input.id}`)

let pressTimer: ReturnType<typeof setTimeout> | null = null
let pressPoint = { x: 0, y: 0 }

const cancelPress = () => {
  if (!pressTimer) return
  clearTimeout(pressTimer)
  pressTimer = null
}

const openMenuAt = (x: number, y: number) => {
  if (props.row.kind !== 'task') return
  openTaskMenu(props.cardIndex, props.row.task.id, x, y)
}

const onContextMenu = (event: MouseEvent) => {
  if (props.row.kind !== 'task') return
  event.preventDefault()
  cancelPress()
  openMenuAt(event.clientX, event.clientY)
}

const onTouchStart = (event: TouchEvent) => {
  if (props.row.kind !== 'task') return
  const touch = event.touches[0]
  if (!touch) return
  pressPoint = { x: touch.clientX, y: touch.clientY }
  cancelPress()
  pressTimer = setTimeout(() => {
    pressTimer = null
    openMenuAt(pressPoint.x, pressPoint.y)
  }, 500)
}

const onTouchMove = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (!touch) return
  if (Math.hypot(touch.clientX - pressPoint.x, touch.clientY - pressPoint.y) > 12) cancelPress()
}
const rowStyle = computed(() => {
  if (props.row.kind !== 'fixed') return undefined
  const background = fixedRowBackground(theme.value, props.cardIndex, props.rowIndex, rowText(props.row))
  return background ? { background } : undefined
})
</script>

<template>
  <div class="list-item-container relative mb-1" :data-row-key="rowDomKey">
    <div
      class="collapsed-input-block"
      :class="[
        expanded ? 'collapsed-hidden' : 'collapsed-visible',
        row.kind === 'fixed' ? 'row-fixed' : 'row-task',
        continued ? 'row-task-next' : '',
        struck ? 'is-struck' : '',
      ]"
      :style="rowStyle"
      @click="onRowClick(cardIndex, row)"
      @contextmenu="onContextMenu"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="cancelPress"
      @touchcancel="cancelPress"
    >
      <span class="row-label" :class="{ 'is-empty': !rowText(row) }" :title="rowText(row)">{{ rowText(row) || 'Текст' }}</span>
      <span v-if="rowTime(row)" class="row-time">{{ rowTime(row) }}</span>
    </div>

    <button
      v-if="status !== 'none'"
      v-show="row.kind === 'fixed' || !expanded"
      type="button"
      class="task-status-badge"
      :class="status === 'done' ? 'task-status-done' : 'task-status-pending'"
      :aria-label="statusTitle(row)"
      :title="statusTitle(row)"
      @click.stop="onBadgeClick(row)"
    >
      <span aria-hidden="true">{{ status === 'done' ? '✓' : '✕' }}</span>
    </button>

    <div
      v-if="row.kind === 'task'"
      class="expandable-block mx-1.5"
      :class="expanded ? 'expandable-block-open' : 'expandable-block-closed'"
    >
      <div class="editor-box">
        <textarea
          :value="editorText(row)"
          placeholder="Введите текст"
          aria-label="Текст элемента расписания"
          @input="onTaskTextInput(row, $event)"
          @blur="handleExpandedBlur(cardIndex, row, $event)"
        />
        <input
          class="editor-time"
          :class="{ 'is-invalid': timeError(row) }"
          :value="editorTime(row)"
          placeholder="00:00 - 00:00"
          inputmode="numeric"
          autocomplete="off"
          spellcheck="false"
          :aria-invalid="timeError(row) ? 'true' : 'false'"
          @keydown="handleTimeKeydown(row, $event)"
          @beforeinput="handleTimeBeforeInput(row, $event)"
          @input="handleTimeInput(row, $event)"
          @mouseup="placeTimeCaret(row, $event)"
          @blur="handleExpandedBlur(cardIndex, row, $event)"
        />
        <p v-if="timeError(row)" class="editor-time-error">{{ timeError(row) }}</p>
      </div>
    </div>
  </div>
</template>

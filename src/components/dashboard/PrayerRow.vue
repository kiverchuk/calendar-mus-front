<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { worshipNameSuggestions } from '@/data/prayers'
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
  isWorshipRow,
  onRowClick,
  onBadgeClick,
  openTaskMenu,
  editorText,
  editorTime,
  editorKind,
  timeError,
  onTaskTextInput,
  applyWorshipSuggestion,
  onTaskKindChange,
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
const worship = computed(() => isWorshipRow(props.row))
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
const titleEl = ref<HTMLTextAreaElement | null>(null)
const titleWrapped = ref(false)

const measureTitleWrap = (el: HTMLTextAreaElement) => {
  const value = el.value
  if (!value) return false
  if (value.includes('\n')) return true
  const style = getComputedStyle(el)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const letter = parseFloat(style.letterSpacing)
  const extra = Number.isFinite(letter) ? letter * Math.max(0, value.length - 1) : 0
  const pad = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  return ctx.measureText(value).width + extra > el.clientWidth - pad - 1
}

const syncTitleWrap = () => {
  titleWrapped.value = titleEl.value ? measureTitleWrap(titleEl.value) : false
}

const onTitleInput = (event: Event) => {
  onTaskTextInput(props.row, event)
  titleWrapped.value = measureTitleWrap(event.target as HTMLTextAreaElement)
}

watch(
  () => [expanded.value, editorText(props.row)] as const,
  () => nextTick(syncTitleWrap),
)

const worshipSuggestions = computed(() => {
  if (!expanded.value || props.row.kind !== 'task' || titleWrapped.value) return []
  const query = editorText(props.row).trim().toLocaleLowerCase('ru')
  if (!query || query.includes('\n')) return []
  return worshipNameSuggestions.filter((name) => {
    const normalized = name.toLocaleLowerCase('ru')
    return normalized.startsWith(query) && normalized !== query
  })
})

const rowStyle = computed(() => {
  if (props.row.kind !== 'fixed' && !worship.value) return undefined
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
        row.kind === 'fixed' || worship ? 'row-fixed' : 'row-task',
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
        <div class="editor-title">
          <textarea
            ref="titleEl"
            :value="editorText(row)"
            placeholder="Введите текст"
            aria-label="Текст элемента расписания"
            :aria-expanded="worshipSuggestions.length > 0"
            aria-autocomplete="list"
            @input="onTitleInput"
            @blur="handleExpandedBlur(cardIndex, row, $event)"
          />
          <ul v-if="worshipSuggestions.length" class="editor-suggest" role="listbox" aria-label="Подсказки поклонений">
            <span class="editor-suggest-caret" aria-hidden="true"></span>
            <li v-for="name in worshipSuggestions" :key="name">
              <button
                type="button"
                class="editor-suggest-item"
                role="option"
                @mousedown.prevent
                @click="applyWorshipSuggestion(row, name)"
              >
                {{ name }}
              </button>
            </li>
          </ul>
        </div>
        <div class="editor-kind" role="group" aria-label="Тип записи">
          <button
            type="button"
            class="editor-kind-btn"
            :class="{ 'is-active': editorKind(row) === 'task' }"
            @mousedown.prevent
            @click="onTaskKindChange(row, 'task')"
          >
            Задача
          </button>
          <button
            type="button"
            class="editor-kind-btn"
            :class="{ 'is-active': editorKind(row) === 'worship' }"
            @mousedown.prevent
            @click="onTaskKindChange(row, 'worship')"
          >
            Поклонение
          </button>
        </div>
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

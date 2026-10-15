import { computed, inject, nextTick, onMounted, onUnmounted, provide, ref, watch, type InjectionKey } from 'vue'
import { browserTimezone, isServerId, toDateKey } from '@/api/date'
import { createNote, deleteNote as deleteNoteRequest, listNotes, updateNote } from '@/api/notes'
import { listCompletions, prayerTimes, syncCompletion } from '@/api/prayers'
import { createScheduleTask, deleteScheduleTask, listScheduleTasks, updateScheduleTask } from '@/api/schedule'
import { useLocation } from '@/composables/useLocation'
import { getInitialInputsForPrayer, prayers, worshipSlotOrder } from '@/data/prayers'
import type { CalendarDay, CardRow, Note, PrayerCard, Task, TaskKind, TaskStatus } from '@/types/dashboard'

const MINUTES_IN_DAY = 24 * 60
const CLICK_DEBOUNCE_DELAY = 500
const STATUS_ORDER: TaskStatus[] = ['none', 'done', 'pending']

export interface TaskMenuState {
  cardIndex: number
  taskId: string
  x: number
  y: number
}

const SLOT_POS = [0, 1, 3, 4, 8, 9, 11, 12]
const REVERSE_TIME_ERROR = 'Интервал наоборот'

function emptySlots() {
  return Array.from({ length: 8 }, () => '')
}

function fieldMax(field: number) {
  return field % 2 === 0 ? 24 : 59
}

function slotsFromValue(value: string) {
  const slots = emptySlots()
  if (value.length === 13 && value[2] === ':' && value[5] === ' ') {
    SLOT_POS.forEach((pos, index) => {
      const char = value[pos]
      if (char && /\d/.test(char)) slots[index] = char
    })
    return slots
  }
  const digits = value.replace(/\D/g, '').slice(0, 8)
  for (let index = 0; index < digits.length; index += 1) slots[index] = digits[index]
  return slots
}

function renderMask(slots: string[]) {
  if (slots.every((slot) => !slot)) return ''
  const digit = (index: number) => slots[index] || '_'
  return `${digit(0)}${digit(1)}:${digit(2)}${digit(3)} - ${digit(4)}${digit(5)}:${digit(6)}${digit(7)}`
}

function nearestSlot(position: number) {
  return SLOT_POS.reduce(
    (best, pos, index) => (Math.abs(pos - position) < Math.abs(SLOT_POS[best] - position) ? index : best),
    0,
  )
}

function hourBounds(tens: string, units: string) {
  if (!tens && !units) return null
  if (tens && units) {
    const value = Number(tens + units)
    return { min: value, max: value, complete: true }
  }
  if (tens) {
    const first = Number(tens)
    if (first * 10 > 24) return { min: first, max: first, complete: true }
    return { min: first * 10, max: Math.min(24, first * 10 + 9), complete: false }
  }
  const second = Number(units)
  return { min: second, max: Math.min(24, 20 + second), complete: false }
}

function minuteBounds(tens: string, units: string) {
  if (!tens && !units) return null
  if (tens && units) {
    const value = Number(tens + units)
    return { min: value, max: value, complete: true }
  }
  if (tens) {
    const first = Number(tens)
    if (first * 10 > 59) return { min: first, max: first, complete: true }
    return { min: first * 10, max: Math.min(59, first * 10 + 9), complete: false }
  }
  const second = Number(units)
  return { min: second, max: 50 + second, complete: false }
}

function timeOrderError(slots: string[]) {
  const startHour = hourBounds(slots[0], slots[1])
  const startMinute = minuteBounds(slots[2], slots[3])
  if (!startHour?.complete || !startMinute?.complete) return ''
  const start = startHour.min * 60 + startMinute.min
  const endHour = hourBounds(slots[4], slots[5])
  if (!endHour) return ''
  if (endHour.max * 60 + 59 < start) return REVERSE_TIME_ERROR
  if (!endHour.complete || endHour.min !== startHour.min) return ''
  const endMinute = minuteBounds(slots[6], slots[7])
  if (!endMinute) return ''
  if (endHour.min * 60 + endMinute.max < start) return REVERSE_TIME_ERROR
  return ''
}

function applyDigit(slots: string[], slot: number, digit: string) {
  const next = slots.slice()
  const field = Math.floor(slot / 2)
  const tens = field * 2
  const units = tens + 1
  const max = fieldMax(field)
  const isTens = slot % 2 === 0

  if (isTens && Number(digit) * 10 > max) {
    next[tens] = '0'
    next[units] = digit
    const stay = timeOrderError(next) ? tens : Math.min(units + 1, 7)
    return { slots: next, next: stay }
  }

  if (isTens) {
    if (next[units] && Number(digit + next[units]) > max) next[units] = ''
    next[tens] = digit
    return { slots: next, next: units }
  }

  if (!next[tens]) {
    if (Number(digit) * 10 > max) {
      next[tens] = '0'
      next[units] = digit
      return { slots: next, next: timeOrderError(next) ? tens : Math.min(units + 1, 7) }
    }
    next[tens] = digit
    return { slots: next, next: units }
  }

  if (Number(next[tens] + digit) > max) return { slots, next: slot }
  next[units] = digit
  return { slots: next, next: Math.min(units + 1, 7) }
}

function finalizeTime(value: string) {
  const slots = slotsFromValue(value)
  const part = (field: number) => {
    const tens = slots[field * 2]
    const units = slots[field * 2 + 1]
    if (!tens && !units) return ''
    if (tens && units) return String(Number(tens + units)).padStart(2, '0')
    return String(Number(tens || units)).padStart(2, '0')
  }
  const startHour = part(0)
  const startMinute = part(1)
  const endHour = part(2)
  const endMinute = part(3)
  if (!startHour && !startMinute) return ''
  let formatted = `${startHour || '00'}:${startMinute || '00'}`
  if (endHour || endMinute) formatted += ` - ${endHour || '00'}:${endMinute || '00'}`
  return formatted
}

function createDashboard() {
  const currentDate = ref(new Date())
  const selectedDate = ref(new Date())
  const currentTime = ref(new Date())
  const { location } = useLocation()
  const boardPrayers = ref<PrayerCard[]>(prayers.map((item) => ({ ...item })))
  const fixedInputs = ref(prayers.map((prayer) => getInitialInputsForPrayer(prayer)))
  const tasks = ref<Task[]>([])
  const expandedKey = ref<string | null>(null)
  const editDraft = ref<{
    taskId: string
    text: string
    time: string
    kind: TaskKind
    error: string
  } | null>(null)
  const notes = ref<Note[]>([])

  const currentMonth = computed(() => currentDate.value.getMonth())
  const currentYear = computed(() => currentDate.value.getFullYear())
  const monthNames = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ]
  const currentMonthName = computed(() => monthNames[currentMonth.value])
  const currentMonthNameWithYear = computed(() => `${monthNames[currentMonth.value]} ${currentYear.value}`)

  const calendarDays = computed<CalendarDay[]>(() => {
    const firstDay = new Date(currentYear.value, currentMonth.value, 1)
    const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
    const startDate = new Date(firstDay)
    const dayOfWeek = firstDay.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - mondayOffset)

    const endDate = new Date(lastDay)
    const lastDayOfWeek = lastDay.getDay()
    const sundayOffset = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek
    endDate.setDate(endDate.getDate() + sundayOffset)

    const days: CalendarDay[] = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push({
        date: new Date(d),
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === currentMonth.value,
        isToday: d.toDateString() === new Date().toDateString(),
        isSelected: d.toDateString() === selectedDate.value.toDateString(),
      })
    }
    return days
  })

  const prayerStartMinutes = computed(() =>
    boardPrayers.value.map((prayer) => {
      const [h, m] = prayer.time.split(':').map(Number)
      return h * 60 + (m || 0)
    }),
  )

  const cardInterval = (cardIndex: number) => {
    const starts = prayerStartMinutes.value
    const start = starts[cardIndex]
    const end = cardIndex + 1 < starts.length ? starts[cardIndex + 1] : starts[0] + MINUTES_IN_DAY
    return { start, end }
  }

  const parseTimeRange = (value: string) => {
    const parts = value.match(/(\d{1,2}):(\d{2})/g)
    if (!parts || parts.length === 0) return null
    const toMin = (source: string) => {
      const [h, m] = source.split(':').map(Number)
      if (h > 24 || m > 59) return null
      return h * 60 + m
    }
    const first = toMin(parts[0])
    if (first === null) return null
    if (parts.length === 1) return { start: first, end: first }
    const second = toMin(parts[1])
    if (second === null || second < first) return null
    return { start: first, end: second }
  }

  const rangesOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
    if (aStart === aEnd) return aStart >= bStart && aStart < bEnd
    return aStart < bEnd && bStart < aEnd
  }

  const taskOverlapsCard = (task: Task, cardIndex: number) => {
    if (task.start === null || task.end === null) return false
    const { start: cs, end: ce } = cardInterval(cardIndex)
    return [0, MINUTES_IN_DAY, -MINUTES_IN_DAY].some((shift) =>
      rangesOverlap(task.start! + shift, task.end! + shift, cs, ce),
    )
  }

  const taskStartsOnCard = (task: Task, cardIndex: number) => {
    if (task.start === null || task.end === null) return task.draftCard === cardIndex
    const { start: cs, end: ce } = cardInterval(cardIndex)
    return [0, MINUTES_IN_DAY].some((shift) => {
      const start = task.start! + shift
      return start >= cs && start < ce
    })
  }

  const isTaskContinuation = (cardIndex: number, row: CardRow) =>
    row.kind === 'task' && !taskStartsOnCard(row.task, cardIndex)

  const tasksForCard = (cardIndex: number) =>
    tasks.value.filter((task) => {
      if (taskOverlapsCard(task, cardIndex)) return true
      if ((task.start === null || task.end === null) && task.draftCard === cardIndex) return true
      return expandedKey.value === `${cardIndex}:${task.id}`
    })

  const normalizeTitle = (value: string) => value.trim().toLocaleLowerCase('ru')

  const cardRows = (cardIndex: number): CardRow[] => {
    const order = (worshipSlotOrder[boardPrayers.value[cardIndex]?.title] ?? ['НАМАЗ']).map(normalizeTitle)
    const rank = new Map(order.map((name, index) => [name, index]))
    const cardTasks = tasksForCard(cardIndex)

    type Entry = { row: CardRow; priority: number | null; start: number | null; worship: boolean }

    const entries: Entry[] = fixedInputs.value[cardIndex]
      .filter((input) => normalizeTitle(input.text) === 'намаз')
      .map((input) => ({
        row: { kind: 'fixed' as const, input },
        priority: rank.get('намаз') ?? 0,
        start: null,
        worship: true,
      }))

    for (const task of cardTasks) {
      const name = normalizeTitle(task.text)
      const worship = task.kind === 'worship'
      entries.push({
        row: { kind: 'task', task },
        priority: worship ? (rank.get(name) ?? null) : null,
        start: task.start,
        worship,
      })
    }

    const byTime = (a: Entry, b: Entry) => {
      if (a.start === null && b.start === null) return 0
      if (a.start === null) return 1
      if (b.start === null) return -1
      return a.start - b.start
    }

    const worshipRows = entries
      .filter((item) => item.worship)
      .sort((a, b) => (a.priority ?? order.length) - (b.priority ?? order.length) || byTime(a, b))
    const taskRows = entries.filter((item) => !item.worship).sort(byTime)

    return [...worshipRows, ...taskRows].map((item) => item.row)
  }

  const isWorshipRow = (row: CardRow) => row.kind === 'task' && row.task.kind === 'worship'

  const rowKey = (row: CardRow) => (row.kind === 'task' ? row.task.id : row.input.id)
  const rowText = (row: CardRow) => (row.kind === 'task' ? row.task.text : row.input.text)
  const rowTime = (row: CardRow) => (row.kind === 'task' ? row.task.time : row.input.time)
  const rowStatus = (row: CardRow): TaskStatus => (row.kind === 'task' ? row.task.status : row.input.status)

  const statusTitle = (row: CardRow) => {
    const status = rowStatus(row)
    const name = status === 'done' ? 'Выполнено' : status === 'pending' ? 'Просрочено' : 'Без статуса'
    return `${name} (нажмите, чтобы сменить статус)`
  }

  const schedulePayload = (task: Task) => ({
    date: toDateKey(selectedDate.value),
    text: task.text,
    time: task.time,
    start: task.start,
    end: task.end,
    status: task.status,
    kind: task.kind,
  })

  const persistTask = async (task: Task) => {
    if (!task.text.trim()) return
    try {
      if (isServerId(task.id)) {
        await updateScheduleTask(task.id, schedulePayload(task))
        return
      }
      const response = await createScheduleTask(schedulePayload(task))
      task.id = String(response.data.task.id)
    } catch {
      /* оставляем локальную правку, если сервер недоступен */
    }
  }

  const persistNamaz = (inputId: string, status: TaskStatus) => {
    const cardIndex = fixedInputs.value.findIndex((rows) => rows.some((row) => row.id === inputId))
    if (cardIndex < 0) return
    void syncCompletion(cardIndex + 1, toDateKey(selectedDate.value), status === 'done').catch(() => undefined)
  }

  const setStatus = (row: CardRow, status: TaskStatus) => {
    if (row.kind === 'task') {
      row.task.status = status
      void persistTask(row.task)
      return
    }
    row.input.status = status
    if (normalizeTitle(row.input.text) === 'намаз') persistNamaz(row.input.id, status)
  }

  const cycleStatus = (row: CardRow) => {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(rowStatus(row)) + 1) % STATUS_ORDER.length]
    setStatus(row, next)
  }

  const isRowExpanded = (cardIndex: number, row: CardRow) =>
    row.kind === 'task' && expandedKey.value === `${cardIndex}:${row.task.id}`

  let timeCaret: { start: number; end: number } | null = null
  let timeKeyHandled = false

  const writeTime = (input: HTMLInputElement, slots: string[], slot: number | null) => {
    if (!editDraft.value) return
    const formatted = renderMask(slots)
    editDraft.value.time = formatted
    editDraft.value.error = timeOrderError(slots)
    input.value = formatted
    if (!formatted || slot === null) {
      timeCaret = { start: formatted.length, end: formatted.length }
    } else {
      const start = SLOT_POS[slot]
      timeCaret = { start, end: Math.min(start + 1, formatted.length) }
    }
    input.setSelectionRange(timeCaret.start, timeCaret.end)
    const caret = timeCaret
    const restore = () => {
      if (document.activeElement !== input) return
      input.setSelectionRange(caret.start, caret.end)
    }
    nextTick(() => {
      restore()
      requestAnimationFrame(restore)
    })
  }

  const activeTimeInput = (row: CardRow, event: Event) => {
    if (row.kind !== 'task' || editDraft.value?.taskId !== row.task.id) return null
    return event.target as HTMLInputElement
  }

  const isUnfilledDraft = (task: Task) => {
    const draft = editDraft.value
    const text = (draft?.taskId === task.id ? draft.text : task.text).trim()
    const time = finalizeTime(draft?.taskId === task.id ? draft.time : task.time)
    return !text && !time
  }

  const discardTask = (taskId: string) => {
    if (isServerId(taskId)) void deleteScheduleTask(taskId).catch(() => undefined)
    tasks.value = tasks.value.filter((item) => item.id !== taskId)
    if (editDraft.value?.taskId === taskId) editDraft.value = null
    if (expandedKey.value?.endsWith(`:${taskId}`)) expandedKey.value = null
  }

  const commitTaskEdit = (task: Task) => {
    const draft = editDraft.value
    if (!draft || draft.taskId !== task.id) return true
    const time = finalizeTime(draft.time)
    draft.time = time
    const error = timeOrderError(slotsFromValue(time))
    draft.error = error
    if (error) return false
    task.text = draft.text
    task.time = time
    task.kind = draft.kind
    const parsed = parseTimeRange(time)
    if (parsed) {
      task.start = parsed.start
      task.end = parsed.end
      task.draftCard = null
    }
    void persistTask(task)
    return true
  }

  const editorText = (row: CardRow) => {
    if (row.kind !== 'task') return ''
    return editDraft.value?.taskId === row.task.id ? editDraft.value.text : row.task.text
  }

  const editorTime = (row: CardRow) => {
    if (row.kind !== 'task') return ''
    return editDraft.value?.taskId === row.task.id ? editDraft.value.time : row.task.time
  }

  const editorKind = (row: CardRow): TaskKind => {
    if (row.kind !== 'task') return 'task'
    return editDraft.value?.taskId === row.task.id ? editDraft.value.kind : row.task.kind
  }

  const timeError = (row: CardRow) => {
    if (row.kind !== 'task') return ''
    return editDraft.value?.taskId === row.task.id ? editDraft.value.error : ''
  }

  const onTaskKindChange = (row: CardRow, kind: TaskKind) => {
    if (row.kind !== 'task' || editDraft.value?.taskId !== row.task.id) return
    editDraft.value.kind = kind
    const key = expandedKey.value
    nextTick(() => {
      if (!key || expandedKey.value !== key) return
      const container = document.querySelector(`[data-row-key="${CSS.escape(key)}"]`)
      const target = container?.querySelector('textarea') as HTMLTextAreaElement | null
      target?.focus({ preventScroll: true })
    })
  }

  const placeTimeCaret = (row: CardRow, event: Event) => {
    const input = activeTimeInput(row, event)
    if (!input || !editDraft.value?.time) return
    const slot = nearestSlot(input.selectionStart ?? 0)
    const start = SLOT_POS[slot]
    timeCaret = { start, end: start + 1 }
    input.setSelectionRange(start, start + 1)
  }

  const handleTimeKeydown = (row: CardRow, event: KeyboardEvent) => {
    const input = activeTimeInput(row, event)
    if (!input) return
    const digit = event.key >= '0' && event.key <= '9'
    const remove = event.key === 'Backspace' || event.key === 'Delete'
    const arrow = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
    if (!digit && !remove && !arrow && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    timeKeyHandled = true
    queueMicrotask(() => {
      timeKeyHandled = false
    })
    const slots = slotsFromValue(editDraft.value?.time ?? '')
    const current = input.selectionStart === input.selectionEnd ? nearestSlot(input.selectionStart ?? 0) : nearestSlot(input.selectionStart ?? 0)

    if (event.key === 'Home') return writeTime(input, slots, 0)
    if (event.key === 'End') return writeTime(input, slots, 7)
    if (event.key === 'ArrowLeft') return writeTime(input, slots, Math.max(0, current - 1))
    if (event.key === 'ArrowRight') return writeTime(input, slots, Math.min(7, current + 1))
    if (remove) {
      const target = !slots[current] && event.key === 'Backspace' ? Math.max(0, current - 1) : current
      slots[target] = ''
      return writeTime(input, slots, target)
    }
    const applied = applyDigit(slots, current, event.key)
    writeTime(input, applied.slots, applied.next)
  }

  const handleTimeBeforeInput = (row: CardRow, event: InputEvent) => {
    const input = activeTimeInput(row, event)
    if (!input) return
    event.preventDefault()
    if (timeKeyHandled) {
      timeKeyHandled = false
      return
    }
    const slots = slotsFromValue(editDraft.value?.time ?? '')
    const slot = nearestSlot(input.selectionStart ?? 0)
    if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
      slots[slot] = ''
      writeTime(input, slots, slot)
      return
    }
    const digit = event.data?.replace(/\D/g, '').slice(0, 1)
    if (!digit) return
    const applied = applyDigit(slots, slot, digit)
    writeTime(input, applied.slots, applied.next)
  }

  const handleTimeInput = (row: CardRow, event: Event) => {
    const input = activeTimeInput(row, event)
    if (!input || !editDraft.value) return
    if (input.value === editDraft.value.time) return
    input.value = editDraft.value.time
    if (timeCaret) input.setSelectionRange(timeCaret.start, timeCaret.end)
  }

  const onTaskTextInput = (row: CardRow, event: Event) => {
    if (row.kind !== 'task' || editDraft.value?.taskId !== row.task.id) return
    editDraft.value.text = (event.target as HTMLTextAreaElement).value
  }

  const applyWorshipSuggestion = (row: CardRow, title: string) => {
    if (row.kind !== 'task' || editDraft.value?.taskId !== row.task.id) return
    editDraft.value.text = title
    editDraft.value.kind = 'worship'
  }

  const previousMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
  }

  const nextMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
  }

  const selectDate = (day: CalendarDay) => {
    selectedDate.value = new Date(day.date)
  }

  const addNewInput = (cardIndex: number) => {
    const id = `new-${Date.now()}-${Math.random()}`
    tasks.value.push({
      id,
      text: '',
      time: '',
      start: null,
      end: null,
      status: 'none',
      kind: 'task',
      draftCard: cardIndex,
    })
    nextTick(() => beginTaskEdit(cardIndex, id))
  }

  let statusClickTimer: ReturnType<typeof setTimeout> | null = null
  let statusClickKey: string | null = null
  let suppressClickUntil = 0
  const taskMenu = ref<TaskMenuState | null>(null)

  const findTask = (taskId: string) => tasks.value.find((task) => task.id === taskId)

  const beginTaskEdit = (cardIndex: number, taskId: string) => {
    const task = findTask(taskId)
    if (!task) return
    const key = `${cardIndex}:${taskId}`
    editDraft.value = { taskId, text: task.text, time: task.time, kind: task.kind, error: '' }
    expandedKey.value = key
    nextTick(() => {
      const container = document.querySelector(`[data-row-key="${CSS.escape(key)}"]`)
      const target = container?.querySelector('textarea')
      ;(target as HTMLElement | null)?.focus()
    })
  }

  const closeTaskMenu = () => {
    taskMenu.value = null
  }

  const openTaskMenu = (cardIndex: number, taskId: string, x: number, y: number) => {
    const width = 248
    const height = 204
    taskMenu.value = {
      cardIndex,
      taskId,
      x: Math.min(Math.max(8, x), window.innerWidth - width - 8),
      y: Math.min(Math.max(8, y), window.innerHeight - height - 8),
    }
    suppressClickUntil = Date.now() + 450
  }

  const menuTask = () => {
    const menu = taskMenu.value
    if (!menu) return null
    return findTask(menu.taskId) ?? null
  }

  const menuTaskStatus = computed(() => menuTask()?.status ?? 'none')

  const setMenuTaskStatus = (status: TaskStatus) => {
    const task = menuTask()
    if (task) {
      task.status = status
      void persistTask(task)
    }
    closeTaskMenu()
  }

  const editTaskFromMenu = () => {
    const menu = taskMenu.value
    if (!menu) return
    const { cardIndex, taskId } = menu
    closeTaskMenu()
    beginTaskEdit(cardIndex, taskId)
  }

  const deleteTaskFromMenu = () => {
    const menu = taskMenu.value
    if (!menu) return
    discardTask(menu.taskId)
    closeTaskMenu()
  }

  const onBadgeClick = (row: CardRow) => {
    if (statusClickTimer) {
      clearTimeout(statusClickTimer)
      statusClickTimer = null
      statusClickKey = null
    }
    cycleStatus(row)
  }

  const onRowClick = (cardIndex: number, row: CardRow) => {
    if (Date.now() < suppressClickUntil) return
    const key = `${cardIndex}:${rowKey(row)}`
    if (statusClickTimer && statusClickKey === key) return
    if (statusClickTimer) {
      clearTimeout(statusClickTimer)
      statusClickTimer = null
    }
    cycleStatus(row)
    statusClickKey = key
    statusClickTimer = setTimeout(() => {
      statusClickTimer = null
      statusClickKey = null
    }, CLICK_DEBOUNCE_DELAY)
  }

  const handleExpandedBlur = (cardIndex: number, row: CardRow, event: FocusEvent) => {
    if (row.kind !== 'task') return
    const taskId = row.task.id
    const container = (event.target as HTMLElement | null)?.closest('.list-item-container')
    setTimeout(() => {
      const activeElement = document.activeElement
      if (container && (!activeElement || !container.contains(activeElement))) {
        if (expandedKey.value !== `${cardIndex}:${taskId}`) return
        if (isUnfilledDraft(row.task)) {
          discardTask(taskId)
          return
        }
        if (!commitTaskEdit(row.task)) {
          const timeInput = container.querySelector('.editor-time')
          ;(timeInput as HTMLElement | null)?.focus()
          return
        }
        editDraft.value = null
        expandedKey.value = null
      }
    }, 100)
  }

  const findNoteIndex = (noteId: string) => notes.value.findIndex((note) => note.id === noteId)

  const focusNote = (noteId: string) => {
    const note = notes.value.find((item) => item.id === noteId)
    if (note) note.focused = true
  }

  const blurNote = (noteId: string) => {
    const noteIndex = findNoteIndex(noteId)
    if (noteIndex < 0) return
    const note = notes.value[noteIndex]
    if (!note.text.trim()) {
      if (isServerId(note.id)) void deleteNoteRequest(note.id).catch(() => undefined)
      notes.value.splice(noteIndex, 1)
      return
    }
    note.text = note.text.trim()
    note.focused = false
    void saveNote(note)
  }

  const saveNote = async (note: Note) => {
    try {
      if (isServerId(note.id)) {
        await updateNote(note.id, note.text)
        return
      }
      const response = await createNote(note.text)
      note.id = String(response.data.note.id)
    } catch {
      /* заметка остаётся на экране */
    }
  }

  const deleteNote = (noteId: string) => {
    if (isServerId(noteId)) void deleteNoteRequest(noteId).catch(() => undefined)
    const noteIndex = findNoteIndex(noteId)
    if (noteIndex >= 0) notes.value.splice(noteIndex, 1)
  }

  const addNewNote = () => {
    const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    notes.value.push({ id, focused: true, text: '' })
    nextTick(() => {
      const target = document.querySelector(`[data-note-id="${CSS.escape(id)}"]`) as HTMLTextAreaElement | null
      if (!target) return
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const makeProgress = (statuses: TaskStatus[]) => {
    const total = statuses.length
    const done = statuses.filter((status) => status === 'done').length
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)
    return { done, total, percent }
  }

  /** Пока задачи без даты — считаем текущий набор как день. Потом фильтр по selectedDate. */
  const dayProgress = computed(() => {
    const worshipStatuses = [
      ...fixedInputs.value.flat().map((item) => item.status),
      ...tasks.value.filter((task) => task.kind === 'worship').map((task) => task.status),
    ]
    const taskStatuses = tasks.value.filter((task) => task.kind === 'task').map((task) => task.status)
    return {
      worship: makeProgress(worshipStatuses),
      tasks: makeProgress(taskStatuses),
    }
  })

  const clockTime = computed(() =>
    currentTime.value.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  )

  const clockTimeShort = computed(() =>
    currentTime.value.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  )

  const clockDate = computed(() =>
    currentTime.value.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  )

  const loadNotes = async () => {
    try {
      const response = await listNotes()
      notes.value = response.data.notes.map((note) => ({
        id: String(note.id),
        text: note.text,
        focused: false,
      }))
    } catch {
      /* пустой список, если заметок ещё нет */
    }
  }

  const loadDay = async () => {
    const date = toDateKey(selectedDate.value)
    try {
      const [taskResponse, completionResponse] = await Promise.all([
        listScheduleTasks(date),
        listCompletions(date),
      ])
      tasks.value = taskResponse.data.tasks.map((task) => ({
        id: String(task.id),
        text: task.text,
        time: task.time,
        start: task.start,
        end: task.end,
        status: task.status,
        kind: task.kind,
        draftCard: null,
      }))
      const doneIds = new Set(completionResponse.data.prayer_ids)
      fixedInputs.value.forEach((rows, index) => {
        rows.forEach((row) => {
          if (normalizeTitle(row.text) === 'намаз') {
            row.status = doneIds.has(index + 1) ? 'done' : 'none'
          }
        })
      })
    } catch {
      /* оставляем текущий день */
    }
  }

  const loadPrayerTimes = async () => {
    const latitude = location.value.lat
    const longitude = location.value.lng
    if (latitude == null || longitude == null) return
    try {
      const response = await prayerTimes({
        latitude,
        longitude,
        timezone: browserTimezone(),
        date: toDateKey(selectedDate.value),
      })
      boardPrayers.value = boardPrayers.value.map((card, index) => {
        const slot = response.data.prayer_times[String(index + 1)]
        return slot?.start ? { ...card, time: slot.start } : card
      })
    } catch {
      /* остаются времена по умолчанию */
    }
  }

  let clockTimer: ReturnType<typeof setInterval> | null = null
  onMounted(() => {
    clockTimer = setInterval(() => {
      currentTime.value = new Date()
    }, 1000)
    void loadNotes()
    void loadDay()
    void loadPrayerTimes()
  })

  watch(selectedDate, () => {
    void loadDay()
    void loadPrayerTimes()
  })

  watch(
    () => [location.value.lat, location.value.lng] as const,
    () => {
      void loadPrayerTimes()
    },
  )
  onUnmounted(() => {
    if (clockTimer) clearInterval(clockTimer)
    if (statusClickTimer) clearTimeout(statusClickTimer)
  })

  return {
    prayers: boardPrayers,
    currentMonthName,
    currentMonthNameWithYear,
    calendarDays,
    dayProgress,
    notes,
    clockTime,
    clockTimeShort,
    clockDate,
    cardRows,
    rowKey,
    rowText,
    rowTime,
    rowStatus,
    statusTitle,
    isTaskContinuation,
    isWorshipRow,
    isRowExpanded,
    previousMonth,
    nextMonth,
    selectDate,
    addNewInput,
    onBadgeClick,
    onRowClick,
    openTaskMenu,
    closeTaskMenu,
    menuTaskStatus,
    setMenuTaskStatus,
    editTaskFromMenu,
    deleteTaskFromMenu,
    taskMenu,
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
    focusNote,
    blurNote,
    deleteNote,
    addNewNote,
  }
}

export type DashboardContext = ReturnType<typeof createDashboard>

const DashboardKey: InjectionKey<DashboardContext> = Symbol.for('calmus-dashboard')

let sharedDashboard: DashboardContext | null = null

export function provideDashboard() {
  if (!sharedDashboard) sharedDashboard = createDashboard()
  provide(DashboardKey, sharedDashboard)
  return sharedDashboard
}

export function useDashboard() {
  return inject(DashboardKey, null) ?? (sharedDashboard ??= createDashboard())
}

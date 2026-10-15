import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import { isServerId } from '@/api/date'
import {
  createGoal as createGoalRequest,
  createSubtask,
  deleteGoal as deleteGoalRequest,
  deleteSubtask as deleteSubtaskRequest,
  listGoals,
  reorderSubtasks,
  toggleGoal as toggleGoalRequest,
  type ApiGoal,
} from '@/api/goals'
import type { GoalDeadlinePreset, GoalItem, GoalSubtask } from '@/types/goals'

export interface GoalsContext {
  goals: Ref<GoalItem[]>
  creating: Ref<boolean>
  draftTitle: Ref<string>
  draftStart: Ref<string>
  draftEnd: Ref<string>
  startCreate: () => void
  cancelCreate: () => void
  applyPreset: (preset: GoalDeadlinePreset) => void
  createGoal: () => boolean
  deleteGoal: (goalId: string) => void
  toggleGoal: (goalId: string) => void
  addSubtask: (goalId: string, text: string) => boolean
  deleteSubtask: (goalId: string, subtaskId: string) => void
  toggleSubtask: (goalId: string, subtaskId: string) => void
  reorderSubtask: (goalId: string, fromId: string, toId: string) => void
  goalProgress: (goal: GoalItem) => { done: number; total: number; percent: number }
  formatRange: (goal: GoalItem) => string
}

const GoalsKey: InjectionKey<GoalsContext> = Symbol.for('calmus-goals')

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function toInputDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatRuDate(value: string | null) {
  if (!value) return ''
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return value
  return `${d}.${m}.${y}`
}

function addPreset(preset: GoalDeadlinePreset, from = new Date()) {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  if (preset === 'week') end.setDate(end.getDate() + 7)
  if (preset === 'month') end.setMonth(end.getMonth() + 1)
  if (preset === 'quarter') end.setMonth(end.getMonth() + 3)
  if (preset === 'year') end.setFullYear(end.getFullYear() + 1)
  return { start: toInputDate(start), end: toInputDate(end) }
}

function syncGoalDone(goal: GoalItem) {
  if (!goal.subtasks.length) return
  goal.done = goal.subtasks.every((item) => item.done)
}

function mapGoal(goal: ApiGoal): GoalItem {
  return {
    id: String(goal.id),
    text: goal.text,
    startDate: goal.start_date,
    endDate: goal.end_date,
    done: goal.is_completed,
    subtasks: (goal.subtasks ?? []).map((subtask) => ({
      id: String(subtask.id),
      text: subtask.text,
      done: subtask.is_completed,
    })),
  }
}

function createGoalsContext(): GoalsContext {
  const goals = ref<GoalItem[]>([])
  const creating = ref(false)
  const draftTitle = ref('')
  const draftStart = ref('')
  const draftEnd = ref('')

  const startCreate = () => {
    creating.value = true
    draftTitle.value = ''
    const range = addPreset('month')
    draftStart.value = range.start
    draftEnd.value = range.end
  }

  const cancelCreate = () => {
    creating.value = false
    draftTitle.value = ''
    draftStart.value = ''
    draftEnd.value = ''
  }

  const applyPreset = (preset: GoalDeadlinePreset) => {
    const range = addPreset(preset)
    draftStart.value = range.start
    draftEnd.value = range.end
  }

  const loadGoals = async () => {
    try {
      const response = await listGoals()
      goals.value = response.data.goals.map(mapGoal)
    } catch {
      /* цели появятся после успешного ответа */
    }
  }

  const createGoal = () => {
    const text = draftTitle.value.trim()
    if (!text) return false
    const tempId = uid('goal')
    const startDate = draftStart.value || null
    const endDate = draftEnd.value || null
    goals.value.push({
      id: tempId,
      text,
      startDate,
      endDate,
      done: false,
      subtasks: [],
    })
    cancelCreate()
    void createGoalRequest({ text, start_date: startDate, end_date: endDate })
      .then((response) => {
        const saved = mapGoal(response.data.goal)
        const current = goals.value.find((goal) => goal.id === tempId)
        if (current) {
          current.id = saved.id
          current.startDate = saved.startDate
          current.endDate = saved.endDate
        }
      })
      .catch(() => {
        goals.value = goals.value.filter((goal) => goal.id !== tempId)
      })
    return true
  }

  const findGoal = (goalId: string) => goals.value.find((goal) => goal.id === goalId)

  const packSubtasks = (goal: GoalItem) => {
    const open = goal.subtasks.filter((item) => !item.done)
    const done = goal.subtasks.filter((item) => item.done)
    goal.subtasks = [...open, ...done]
  }

  const deleteGoal = (goalId: string) => {
    if (isServerId(goalId)) void deleteGoalRequest(goalId).catch(() => undefined)
    goals.value = goals.value.filter((goal) => goal.id !== goalId)
  }

  const toggleGoal = (goalId: string) => {
    const goal = findGoal(goalId)
    if (!goal) return
    goal.done = !goal.done
    if (goal.subtasks.length) {
      goal.subtasks.forEach((subtask) => {
        subtask.done = goal.done
      })
      packSubtasks(goal)
    }
    if (isServerId(goalId)) void toggleGoalRequest(goalId).catch(() => undefined)
  }

  const addSubtask = (goalId: string, text: string) => {
    const goal = findGoal(goalId)
    const value = text.trim()
    if (!goal || !value) return false
    const subtask: GoalSubtask = { id: uid('sub'), text: value, done: false }
    const firstDone = goal.subtasks.findIndex((item) => item.done)
    if (firstDone === -1) goal.subtasks.push(subtask)
    else goal.subtasks.splice(firstDone, 0, subtask)
    if (goal.done) goal.done = false
    if (isServerId(goalId)) {
      void createSubtask(goalId, value)
        .then((response) => {
          subtask.id = String(response.data.subtask.id)
        })
        .catch(() => {
          goal.subtasks = goal.subtasks.filter((item) => item.id !== subtask.id)
        })
    }
    return true
  }

  const deleteSubtask = (goalId: string, subtaskId: string) => {
    const goal = findGoal(goalId)
    if (!goal) return
    if (isServerId(goalId) && isServerId(subtaskId)) {
      void deleteSubtaskRequest(goalId, subtaskId).catch(() => undefined)
    }
    goal.subtasks = goal.subtasks.filter((item) => item.id !== subtaskId)
    syncGoalDone(goal)
  }

  const toggleSubtask = (goalId: string, subtaskId: string) => {
    const goal = findGoal(goalId)
    const subtask = goal?.subtasks.find((item) => item.id === subtaskId)
    if (!goal || !subtask) return
    subtask.done = !subtask.done
    syncGoalDone(goal)
    packSubtasks(goal)
    if (isServerId(subtaskId)) void toggleGoalRequest(subtaskId).catch(() => undefined)
  }

  const reorderSubtask = (goalId: string, fromId: string, toId: string) => {
    const goal = findGoal(goalId)
    if (!goal || fromId === toId) return
    const open = goal.subtasks.filter((item) => !item.done)
    const done = goal.subtasks.filter((item) => item.done)
    const fromIndex = open.findIndex((item) => item.id === fromId)
    const toIndex = open.findIndex((item) => item.id === toId)
    if (fromIndex < 0 || toIndex < 0) return
    const [item] = open.splice(fromIndex, 1)
    open.splice(toIndex, 0, item)
    goal.subtasks = [...open, ...done]
    if (!isServerId(goalId)) return
    const ids = goal.subtasks.map((subtask) => subtask.id).filter(isServerId).map(Number)
    if (ids.length) void reorderSubtasks(goalId, ids).catch(() => undefined)
  }

  const goalProgress = (goal: GoalItem) => {
    if (!goal.subtasks.length) {
      return { done: goal.done ? 1 : 0, total: 1, percent: goal.done ? 100 : 0 }
    }
    const total = goal.subtasks.length
    const done = goal.subtasks.filter((item) => item.done).length
    return { done, total, percent: Math.round((done / total) * 100) }
  }

  const formatRange = (goal: GoalItem) => {
    const start = formatRuDate(goal.startDate)
    const end = formatRuDate(goal.endDate)
    if (start && end) return `${start} - ${end}`
    return start || end || ''
  }

  void loadGoals()

  return {
    goals,
    creating,
    draftTitle,
    draftStart,
    draftEnd,
    startCreate,
    cancelCreate,
    applyPreset,
    createGoal,
    deleteGoal,
    toggleGoal,
    addSubtask,
    deleteSubtask,
    toggleSubtask,
    reorderSubtask,
    goalProgress,
    formatRange,
  }
}

let sharedGoals: GoalsContext | null = null

function goalsContext() {
  if (!sharedGoals) sharedGoals = createGoalsContext()
  return sharedGoals
}

export function provideGoals() {
  const context = goalsContext()
  provide(GoalsKey, context)
  return context
}

export function useGoals() {
  return inject(GoalsKey, null) ?? goalsContext()
}

export const deadlinePresets: { id: GoalDeadlinePreset; label: string }[] = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'quarter', label: 'Квартал' },
  { id: 'year', label: 'Год' },
]

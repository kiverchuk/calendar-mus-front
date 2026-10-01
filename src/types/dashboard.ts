export type TaskStatus = 'none' | 'pending' | 'done'
export type TaskKind = 'task' | 'worship'

export interface PrayerCard {
  title: string
  time: string
}

export interface PrayerInput {
  id: string
  expanded: boolean
  time: string
  text: string
  isFixed: true
  status: TaskStatus
  isPinned?: boolean
}

export interface Task {
  id: string
  text: string
  time: string
  start: number | null
  end: number | null
  status: TaskStatus
  kind: TaskKind
  draftCard: number | null
}

export interface CardRowFixed {
  kind: 'fixed'
  input: PrayerInput
}

export interface CardRowTask {
  kind: 'task'
  task: Task
}

export type CardRow = CardRowFixed | CardRowTask

export interface CalendarDay {
  date: Date
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

export interface Note {
  id: string
  focused: boolean
  text: string
}

export type TaskStatus = 'none' | 'pending' | 'done'

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
  focused: boolean
  text: string
}

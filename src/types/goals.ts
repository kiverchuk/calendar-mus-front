export interface GoalSubtask {
  id: string
  text: string
  done: boolean
}

export interface GoalItem {
  id: string
  text: string
  startDate: string | null
  endDate: string | null
  done: boolean
  subtasks: GoalSubtask[]
}

export type GoalDeadlinePreset = 'week' | 'month' | 'quarter' | 'year'

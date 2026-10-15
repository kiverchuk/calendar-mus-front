import { apiRequest } from '@/api/client'

export interface ApiGoal {
  id: number
  text: string
  start_date: string | null
  end_date: string | null
  is_completed: boolean
  subtasks?: ApiGoal[]
}

export function listGoals() {
  return apiRequest<{ goals: ApiGoal[] }>('/goals')
}

export function createGoal(payload: { text: string; start_date: string | null; end_date: string | null }) {
  return apiRequest<{ goal: ApiGoal }>('/goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteGoal(id: string) {
  return apiRequest<null>(`/goals/${id}`, { method: 'DELETE' })
}

export function toggleGoal(id: string) {
  return apiRequest<unknown>(`/goals/${id}/toggle`, { method: 'POST' })
}

export function createSubtask(goalId: string, text: string) {
  return apiRequest<{ subtask: ApiGoal }>(`/goals/${goalId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export function deleteSubtask(goalId: string, subtaskId: string) {
  return apiRequest<null>(`/goals/${goalId}/subtasks/${subtaskId}`, { method: 'DELETE' })
}

export function reorderSubtasks(goalId: string, ids: number[]) {
  return apiRequest<null>(`/goals/${goalId}/subtasks/reorder`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

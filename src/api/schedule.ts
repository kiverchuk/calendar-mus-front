import { apiRequest } from '@/api/client'
import type { TaskKind, TaskStatus } from '@/types/dashboard'

export interface ApiScheduleTask {
  id: number
  date: string
  text: string
  time: string
  start: number | null
  end: number | null
  status: TaskStatus
  kind: TaskKind
}

export interface SchedulePayload {
  date: string
  text: string
  time: string
  start: number | null
  end: number | null
  status: TaskStatus
  kind: TaskKind
}

export function listScheduleTasks(date: string) {
  return apiRequest<{ tasks: ApiScheduleTask[] }>(`/schedule-tasks?date=${encodeURIComponent(date)}`)
}

export function createScheduleTask(payload: SchedulePayload) {
  return apiRequest<{ task: ApiScheduleTask }>('/schedule-tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateScheduleTask(id: string, payload: SchedulePayload) {
  return apiRequest<{ task: ApiScheduleTask }>(`/schedule-tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteScheduleTask(id: string) {
  return apiRequest<null>(`/schedule-tasks/${id}`, { method: 'DELETE' })
}

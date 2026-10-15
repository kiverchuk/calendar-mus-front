import { apiRequest } from '@/api/client'

export interface ApiNote {
  id: number
  text: string
}

export function listNotes() {
  return apiRequest<{ notes: ApiNote[] }>('/notes?per_page=100')
}

export function createNote(text: string) {
  return apiRequest<{ note: ApiNote }>('/notes', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export function updateNote(id: string, text: string) {
  return apiRequest<{ note: ApiNote }>(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ text }),
  })
}

export function deleteNote(id: string) {
  return apiRequest<null>(`/notes/${id}`, { method: 'DELETE' })
}

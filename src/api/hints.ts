import { apiRequest } from '@/api/client'

export interface ApiHint {
  id: number
  text: string
  signature?: string | null
  link?: string | null
  time_from?: string | null
  time_to?: string | null
}

export function activeHints(datetime: string) {
  return apiRequest<{ active_hints: ApiHint[] | Record<string, ApiHint> }>(
    `/hints/active?datetime=${encodeURIComponent(datetime)}`,
  )
}

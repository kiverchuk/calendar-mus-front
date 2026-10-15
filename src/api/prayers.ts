import { apiRequest } from '@/api/client'

export interface ApiPrayerTime {
  name: string
  start: string
  end: string
}

export function prayerTimes(query: { latitude: number; longitude: number; timezone: string; date: string }) {
  const params = new URLSearchParams({
    latitude: String(query.latitude),
    longitude: String(query.longitude),
    timezone: query.timezone,
    date: query.date,
  })
  return apiRequest<{ prayer_times: Record<string, ApiPrayerTime> }>(`/prayers/times?${params.toString()}`)
}

export function listCompletions(date: string) {
  return apiRequest<{ prayer_ids: number[] }>(`/prayers/completions?date=${encodeURIComponent(date)}`)
}

export function syncCompletion(prayerId: number, date: string, done: boolean) {
  return apiRequest<null>('/prayers/completion', {
    method: 'POST',
    body: JSON.stringify({ prayer_id: prayerId, date, done }),
  })
}

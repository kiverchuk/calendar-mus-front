export function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function isServerId(id: string) {
  return /^\d+$/.test(id)
}

export function browserTimezone() {
  const hours = -new Date().getTimezoneOffset() / 60
  if (!Number.isFinite(hours) || hours === 0) return 'UTC'
  const rounded = Math.trunc(hours)
  return `UTC${rounded > 0 ? '+' : ''}${rounded}`
}

export interface ReminderContent {
  text: string
  signature: string
}

/** Позже подменится ответом бэка: текст напоминания + подпись. */
export const defaultReminder: ReminderContent = {
  text: '«Воистину, молитва предписана верующим в определённое время»',
  signature: 'Коран 4:103',
}

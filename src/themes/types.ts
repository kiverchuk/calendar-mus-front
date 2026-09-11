export interface PrayerVisual {
  background: string
  boxShadow: string
  gradients: string[]
  namazGradient: string
}

export interface TrackerBarStyle {
  background: string
  shadow: string
}

/**
 * Тема меняет только палитру.
 * Структура экрана и поведение общие и не задаются темой.
 * Новая тема = новый файл с tokens и prayerVisuals, затем запись в themes.
 */
export interface DashboardTheme {
  id: string
  label: string
  tokens: Record<string, string>
  /** Нет — карточки и плашки берутся только из tokens, без градиентов темы 1. */
  prayerVisuals?: PrayerVisual[]
  trackerBars: [TrackerBarStyle, TrackerBarStyle]
}

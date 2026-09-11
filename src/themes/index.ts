import type { DashboardTheme } from '@/themes/types'
import { classicTheme } from '@/themes/classic'
import { glassTheme } from '@/themes/glass'

/**
 * Реестр палитр. Количество не ограничено: добавьте объект и включите его сюда.
 * Тема не меняет структуру экрана — только цвета.
 */
export const themes: DashboardTheme[] = [glassTheme, classicTheme]

export const defaultThemeId = themes[0]?.id ?? 'theme-1'

export function findTheme(id: string | null | undefined): DashboardTheme {
  return themes.find((theme) => theme.id === id) ?? themes[0]
}

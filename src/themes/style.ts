import type { DashboardTheme } from '@/themes/types'

export function themeStyle(theme: DashboardTheme): Record<string, string> {
  const style: Record<string, string> = {}
  for (const [key, value] of Object.entries(theme.tokens)) {
    style[`--${key}`] = value
  }
  return style
}

export function fixedRowBackground(
  theme: DashboardTheme,
  cardIndex: number,
  rowIndex: number,
  text: string,
): string | undefined {
  const visual = theme.prayerVisuals?.[cardIndex]
  if (!visual?.gradients?.length) return undefined
  if (text.trim().toUpperCase() === 'НАМАЗ' && visual.namazGradient) return visual.namazGradient
  return visual.gradients[rowIndex % visual.gradients.length]
}

import type { PrayerCard, PrayerInput } from '@/types/dashboard'

export const prayers: PrayerCard[] = [
  { title: 'Фаджр', time: '04:00' },
  { title: 'Зухр', time: '11:00' },
  { title: 'Аср', time: '16:00' },
  { title: 'Магриб', time: '19:00' },
  { title: 'Иша', time: '21:00' },
]

const fixed = (
  prayer: PrayerCard,
  key: string,
  text: string,
  pinned = false,
): PrayerInput => ({
  id: `${key}-${prayer.title}-${Date.now()}`,
  expanded: false,
  time: '',
  text,
  isFixed: true,
  status: 'none',
  ...(pinned ? { isPinned: true } : {}),
})

/** Порядок слотов поклонения внутри намаза. В списке остаётся только НАМАЗ. */
export const worshipSlotOrder: Record<string, string[]> = {
  Фаджр: ['Ратибат', 'НАМАЗ', 'Азкары'],
  Зухр: ['Ратибат', 'НАМАЗ', 'Азкары'],
  Аср: ['НАМАЗ', 'Ратибат'],
  Магриб: ['НАМАЗ', 'Ратибат'],
  Иша: ['НАМАЗ', 'Ратибат', 'Тахаджуд'],
}

export const getInitialInputsForPrayer = (prayer: PrayerCard): PrayerInput[] => [
  fixed(prayer, 'namaz', 'НАМАЗ'),
]

/** Подсказки названия: уникальные поклонения со слотов, в порядке появления. */
export const worshipNameSuggestions = [...new Set(Object.values(worshipSlotOrder).flat())]

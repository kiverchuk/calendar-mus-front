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

export const getInitialInputsForPrayer = (prayer: PrayerCard): PrayerInput[] => {
  switch (prayer.title) {
    case 'Фаджр':
    case 'Зухр':
      return [fixed(prayer, 'ratibat-1', 'Ратибат'), fixed(prayer, 'namaz-2', 'НАМАЗ'), fixed(prayer, 'azkary-3', 'Азкары')]
    case 'Аср':
    case 'Магриб':
      return [fixed(prayer, 'namaz-1', 'НАМАЗ'), fixed(prayer, 'ratibat-2', 'Ратибат')]
    case 'Иша':
      return [
        fixed(prayer, 'namaz-1', 'НАМАЗ'),
        fixed(prayer, 'ratibat-2', 'Ратибат'),
        fixed(prayer, 'tahajjud-3', 'Тахаджуд', true),
      ]
    default:
      return [fixed(prayer, 'fixed', 'Намаз')]
  }
}

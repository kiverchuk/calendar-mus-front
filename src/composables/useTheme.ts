import { computed, inject, provide, ref, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { defaultThemeId, findTheme, themes } from '@/themes'
import type { DashboardTheme } from '@/themes/types'

const STORAGE_KEY = 'calmus.theme'

export interface ThemeContext {
  themes: DashboardTheme[]
  themeId: Ref<string>
  theme: ComputedRef<DashboardTheme>
  setTheme: (id: string) => void
}

const ThemeKey: InjectionKey<ThemeContext> = 'calmus-theme'

function readStoredTheme(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? defaultThemeId
  } catch {
    return defaultThemeId
  }
}

function createThemeContext(): ThemeContext {
  const themeId = ref(findTheme(readStoredTheme()).id)
  const theme = computed(() => findTheme(themeId.value))

  const setTheme = (id: string) => {
    if (!themes.some((item) => item.id === id)) return
    themeId.value = id
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* private mode */
    }
  }

  return { themes, themeId, theme, setTheme }
}

let sharedTheme: ThemeContext | null = null

function themeContext(): ThemeContext {
  if (!sharedTheme) sharedTheme = createThemeContext()
  return sharedTheme
}

export function provideTheme(): ThemeContext {
  const context = themeContext()
  provide(ThemeKey, context)
  return context
}

export function useTheme(): ThemeContext {
  return inject(ThemeKey, null) ?? themeContext()
}

import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'

export type SettingsPanel = 'root' | 'account' | 'city' | 'theme' | 'map'

export interface SettingsContext {
  open: Ref<boolean>
  panel: Ref<SettingsPanel>
  openSettings: (next?: SettingsPanel) => void
  closeSettings: () => void
  openPanel: (next: SettingsPanel) => void
  backFromPanel: () => void
  backToRoot: () => void
}

const SettingsKey: InjectionKey<SettingsContext> = Symbol.for('calmus-settings')

function createSettingsContext(): SettingsContext {
  const open = ref(false)
  const panel = ref<SettingsPanel>('root')

  const openSettings = (next: SettingsPanel = 'root') => {
    panel.value =
      next === 'account' || next === 'city' || next === 'theme' || next === 'map' ? next : 'root'
    open.value = true
  }

  const closeSettings = () => {
    open.value = false
    panel.value = 'root'
  }

  const openPanel = (next: SettingsPanel) => {
    panel.value = next
  }

  const backFromPanel = () => {
    panel.value = panel.value === 'map' ? 'city' : 'root'
  }

  const backToRoot = () => {
    panel.value = 'root'
  }

  return { open, panel, openSettings, closeSettings, openPanel, backFromPanel, backToRoot }
}

let sharedSettings: SettingsContext | null = null

function settingsContext() {
  if (!sharedSettings) sharedSettings = createSettingsContext()
  return sharedSettings
}

export function provideSettings() {
  const context = settingsContext()
  provide(SettingsKey, context)
  return context
}

export function useSettings() {
  return inject(SettingsKey, null) ?? settingsContext()
}

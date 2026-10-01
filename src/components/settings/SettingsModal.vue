<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import AccountPanel from '@/components/settings/AccountPanel.vue'
import LocationMapPicker from '@/components/settings/LocationMapPicker.vue'
import { useLocation } from '@/composables/useLocation'
import { useSettings } from '@/composables/useSettings'
import { useTheme } from '@/composables/useTheme'

const { open, panel, closeSettings, openPanel, backFromPanel } = useSettings()
const { themes, themeId, setTheme } = useTheme()
const { location, loading, error, detectByGps, detectByIp, clearError } = useLocation()

watch(
  () => open.value && panel.value === 'city',
  (active) => {
    if (active) clearError()
  },
)

const title = computed(() => {
  if (panel.value === 'account') return 'Аккаунт'
  if (panel.value === 'city') return 'Город'
  if (panel.value === 'theme') return 'Темы'
  if (panel.value === 'map') return 'Точка на карте'
  return 'Настройки'
})

const sourceLabel = computed(() => {
  if (location.value.source === 'gps') return 'GPS'
  if (location.value.source === 'ip') return 'IP'
  if (location.value.source === 'map') return 'Карта'
  return 'не задан'
})

const modalWide = computed(() => panel.value === 'map')

const onOverlayClick = () => closeSettings()

const onKeydown = (event: KeyboardEvent) => {
  if (!open.value) return
  if (event.key !== 'Escape') return
  if (panel.value !== 'root') backFromPanel()
  else closeSettings()
}

const runDetect = async (kind: 'gps' | 'ip') => {
  const ok = kind === 'gps' ? await detectByGps() : await detectByIp()
  if (ok) closeSettings()
}

const pickTheme = (id: string) => {
  setTheme(id)
  closeSettings()
}

const onMapSaved = () => {
  closeSettings()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="open" class="settings-layer" @click="onOverlayClick">
    <div
      class="settings-modal"
      :class="{ 'settings-modal-wide': modalWide }"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click.stop
    >
      <div class="settings-modal-header">
        <button
          v-if="panel !== 'root'"
          type="button"
          class="settings-back"
          aria-label="Назад"
          @click="backFromPanel"
        >
          ←
        </button>
        <span v-else aria-hidden="true" />
        <h2 class="settings-modal-title">{{ title }}</h2>
        <button type="button" class="settings-close" aria-label="Закрыть" @click="closeSettings">×</button>
      </div>

      <div v-if="panel === 'root'" class="settings-modal-body">
        <button type="button" class="settings-section-btn" @click="openPanel('account')">Аккаунт</button>
        <button type="button" class="settings-section-btn" @click="openPanel('city')">Город</button>
        <button type="button" class="settings-section-btn" @click="openPanel('theme')">Темы</button>
      </div>

      <div v-else-if="panel === 'account'" class="settings-modal-body">
        <AccountPanel />
      </div>

      <div v-else-if="panel === 'city'" class="settings-modal-body">
        <p class="settings-hint">Сейчас: {{ location.city || 'не указан' }} · источник {{ sourceLabel }}</p>

        <div class="settings-actions">
          <button type="button" class="settings-section-btn" :disabled="loading" @click="runDetect('gps')">
            {{ loading ? 'Определяем…' : 'По GPS' }}
          </button>
          <button type="button" class="settings-section-btn" :disabled="loading" @click="runDetect('ip')">
            По IP
          </button>
        </div>

        <button type="button" class="settings-section-btn" :disabled="loading" @click="openPanel('map')">
          Точка на карте
        </button>

        <label class="settings-field">
          <span>Город</span>
          <input :value="location.city" type="text" disabled placeholder="Определяется автоматически" />
        </label>
        <label class="settings-field">
          <span>Регион</span>
          <input :value="location.region" type="text" disabled placeholder="Определяется автоматически" />
        </label>

        <p v-if="error" class="settings-error">{{ error }}</p>
      </div>

      <div v-else-if="panel === 'map'" class="settings-modal-body settings-modal-body-map">
        <LocationMapPicker @saved="onMapSaved" @cancel="openPanel('city')" />
      </div>

      <div v-else class="settings-modal-body">
        <button
          v-for="item in themes"
          :key="item.id"
          type="button"
          class="settings-section-btn"
          :class="{ 'is-active': item.id === themeId }"
          @click="pickTheme(item.id)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
  </div>
</template>

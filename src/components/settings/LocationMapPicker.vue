<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useLocation, type LocationCoords } from '@/composables/useLocation'

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const { loading, error, resolveMapCenter, setFromCoords, clearError } = useLocation()

const mapRoot = ref<HTMLElement | null>(null)
const ready = ref(false)
const picked = ref<LocationCoords | null>(null)

let map: L.Map | null = null
let marker: L.Marker | null = null

const pinIcon = L.divIcon({
  className: 'location-map-pin',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
})

const placeMarker = (coords: LocationCoords) => {
  picked.value = coords
  if (!map) return
  if (!marker) {
    marker = L.marker([coords.lat, coords.lng], { icon: pinIcon, draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const position = marker?.getLatLng()
      if (!position) return
      picked.value = { lat: position.lat, lng: position.lng }
    })
    return
  }
  marker.setLatLng([coords.lat, coords.lng])
}

const savePoint = async () => {
  if (!picked.value) return
  clearError()
  const ok = await setFromCoords(picked.value, 'map')
  if (ok) emit('saved')
}

onMounted(async () => {
  await nextTick()
  if (!mapRoot.value) return
  const center = await resolveMapCenter()
  map = L.map(mapRoot.value, {
    zoomControl: true,
    attributionControl: true,
  }).setView([center.lat, center.lng], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map)

  placeMarker(center)
  map.on('click', (event: L.LeafletMouseEvent) => {
    placeMarker({ lat: event.latlng.lat, lng: event.latlng.lng })
  })

  requestAnimationFrame(() => map?.invalidateSize())
  ready.value = true
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  marker = null
})
</script>

<template>
  <div class="location-map-panel">
    <p class="settings-hint">Кликните по карте или перетащите метку. Старт — точка по IP.</p>
    <div ref="mapRoot" class="location-map" />
    <p v-if="error" class="settings-error">{{ error }}</p>
    <div class="settings-actions">
      <button type="button" class="settings-section-btn" @click="emit('cancel')">Отмена</button>
      <button
        type="button"
        class="settings-section-btn settings-section-btn-primary"
        :disabled="!ready || !picked || loading"
        @click="savePoint"
      >
        {{ loading ? 'Сохраняем…' : 'Сохранить точку' }}
      </button>
    </div>
  </div>
</template>

import { computed, inject, provide, ref, type InjectionKey, type Ref } from 'vue'

export type LocationSource = 'gps' | 'ip' | 'map'

export interface LocationCoords {
  lat: number
  lng: number
}

export interface LocationState {
  city: string
  region: string
  lat: number | null
  lng: number | null
  source: LocationSource | null
}

export interface LocationContext {
  location: Ref<LocationState>
  label: Ref<string>
  loading: Ref<boolean>
  error: Ref<string>
  detectByGps: () => Promise<boolean>
  detectByIp: () => Promise<boolean>
  setFromCoords: (coords: LocationCoords, source?: LocationSource) => Promise<boolean>
  resolveMapCenter: () => Promise<LocationCoords>
  ensureDetected: () => Promise<void>
  clearError: () => void
}

const STORAGE_KEY = 'calmus.location'
const DEFAULT_COORDS: LocationCoords = { lat: 42.9849, lng: 47.5047 }
const LocationKey: InjectionKey<LocationContext> = Symbol.for('calmus-location')

function emptyLocation(): LocationState {
  return { city: '', region: '', lat: null, lng: null, source: null }
}

function readStored(): LocationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyLocation()
    const parsed = JSON.parse(raw) as Partial<LocationState> & { source?: string }
    const source =
      parsed.source === 'gps' || parsed.source === 'ip' || parsed.source === 'map'
        ? parsed.source
        : parsed.source === 'manual'
          ? 'map'
          : null
    return {
      city: typeof parsed.city === 'string' ? parsed.city : '',
      region: typeof parsed.region === 'string' ? parsed.region : '',
      lat: typeof parsed.lat === 'number' ? parsed.lat : null,
      lng: typeof parsed.lng === 'number' ? parsed.lng : null,
      source,
    }
  } catch {
    return emptyLocation()
  }
}

function persist(state: LocationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* private mode */
  }
}

function formatLabel(state: LocationState) {
  const city = state.city.trim()
  const region = state.region.trim()
  if (city && region && region.toLowerCase() !== city.toLowerCase()) return `${region}, ${city}`
  return city || region || 'Город не указан'
}

function pickPlace(address: Record<string, string | undefined>) {
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state_district ||
    ''
  const region = address.state || address.region || address.province || ''
  return { city, region }
}

async function reverseGeocode(latitude: number, longitude: number) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('zoom', '10')
  url.searchParams.set('addressdetails', '1')

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'Accept-Language': 'ru' },
  })
  if (!response.ok) throw new Error('geocode-failed')
  const data = (await response.json()) as { address?: Record<string, string | undefined> }
  return pickPlace(data.address || {})
}

async function fetchIpLocation() {
  const response = await fetch('https://ipapi.co/json/')
  if (!response.ok) throw new Error('ip-failed')
  const data = (await response.json()) as {
    city?: string
    region?: string
    latitude?: number
    longitude?: number
    error?: boolean
  }
  if (data.error) throw new Error('ip-failed')
  return data
}

function createLocationContext(): LocationContext {
  const location = ref<LocationState>(readStored())
  const loading = ref(false)
  const error = ref('')
  const label = computed(() => formatLabel(location.value))
  let autoTried = false
  let cachedIpCoords: LocationCoords | null = null

  const apply = (next: LocationState) => {
    location.value = next
    persist(next)
    error.value = ''
  }

  const setFromCoords = async (coords: LocationCoords, source: LocationSource = 'map') => {
    loading.value = true
    error.value = ''
    try {
      const place = await reverseGeocode(coords.lat, coords.lng)
      if (!place.city && !place.region) {
        error.value = 'Не удалось определить город для этой точки'
        return false
      }
      apply({
        city: place.city || place.region,
        region: place.region,
        lat: coords.lat,
        lng: coords.lng,
        source,
      })
      return true
    } catch {
      error.value = 'Не удалось определить город для этой точки'
      return false
    } finally {
      loading.value = false
    }
  }

  const detectByGps = async () => {
    if (!navigator.geolocation) {
      error.value = 'Геолокация недоступна в этом браузере'
      return false
    }
    loading.value = true
    error.value = ''
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      })
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
      loading.value = false
      return setFromCoords(coords, 'gps')
    } catch {
      error.value = 'Нет доступа к геолокации'
      loading.value = false
      return false
    }
  }

  const detectByIp = async () => {
    loading.value = true
    error.value = ''
    try {
      const data = await fetchIpLocation()
      if ((!data.city && !data.region) || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
        error.value = 'Не удалось определить город по IP'
        return false
      }
      cachedIpCoords = { lat: data.latitude, lng: data.longitude }
      apply({
        city: data.city || data.region || '',
        region: data.region || '',
        lat: data.latitude,
        lng: data.longitude,
        source: 'ip',
      })
      return true
    } catch {
      error.value = 'Не удалось определить город по IP'
      return false
    } finally {
      loading.value = false
    }
  }

  const resolveMapCenter = async () => {
    if (location.value.lat !== null && location.value.lng !== null) {
      return { lat: location.value.lat, lng: location.value.lng }
    }
    if (cachedIpCoords) return cachedIpCoords
    try {
      const data = await fetchIpLocation()
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        cachedIpCoords = { lat: data.latitude, lng: data.longitude }
        return cachedIpCoords
      }
    } catch {
      /* fallback below */
    }
    return DEFAULT_COORDS
  }

  const ensureDetected = async () => {
    if (autoTried || location.value.city || location.value.region) return
    autoTried = true
    const byGps = await detectByGps()
    if (!byGps) await detectByIp()
  }

  const clearError = () => {
    error.value = ''
  }

  return {
    location,
    label,
    loading,
    error,
    detectByGps,
    detectByIp,
    setFromCoords,
    resolveMapCenter,
    ensureDetected,
    clearError,
  }
}

let sharedLocation: LocationContext | null = null

function locationContext() {
  if (!sharedLocation) sharedLocation = createLocationContext()
  return sharedLocation
}

export function provideLocation() {
  const context = locationContext()
  provide(LocationKey, context)
  return context
}

export function useLocation() {
  return inject(LocationKey, null) ?? locationContext()
}

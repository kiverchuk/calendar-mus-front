<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import { useAuth } from '@/composables/useAuth'
import type { AuthMode, Gender } from '@/types/auth'

const props = withDefaults(
  defineProps<{
    initialMode?: AuthMode
  }>(),
  { initialMode: 'login' },
)

const auth = useAuth()
const route = useRoute()
const router = useRouter()

const mode = ref<AuthMode>(props.initialMode)
const loading = ref(false)
const message = ref('')
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  gender: 1 as Gender,
  token: '',
})

const title = computed(() => {
  if (mode.value === 'register') return 'Регистрация'
  if (mode.value === 'forgot') return 'Восстановление'
  if (mode.value === 'reset') return 'Новый пароль'
  return 'Авторизация'
})

const applyQuery = () => {
  const qMode = route.query.mode
  if (qMode === 'register' || qMode === 'forgot' || qMode === 'reset' || qMode === 'login') {
    mode.value = qMode
  } else {
    mode.value = props.initialMode
  }

  if (typeof route.query.email === 'string') form.email = route.query.email
  if (typeof route.query.token === 'string') form.token = route.query.token
}

watch(() => route.query, applyQuery, { immediate: true, deep: true })

const setMode = async (next: AuthMode) => {
  mode.value = next
  error.value = ''
  message.value = ''
  fieldErrors.value = {}

  const query = { ...route.query } as Record<string, string | string[] | undefined>
  if (next === 'login') delete query.mode
  else query.mode = next

  await router.replace({ query })
}

const firstError = (key: string) => fieldErrors.value[key]?.[0] || ''

const submit = async () => {
  loading.value = true
  error.value = ''
  message.value = ''
  fieldErrors.value = {}

  try {
    if (mode.value === 'login') {
      await auth.login(form.email, form.password)
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      await router.replace(redirect)
      return
    }

    if (mode.value === 'register') {
      await auth.register({
        name: form.name,
        email: form.email,
        password: form.password,
        gender: form.gender,
      })
      await router.replace('/')
      return
    }

    if (mode.value === 'forgot') {
      message.value = await auth.forgotPassword(form.email)
      return
    }

    const resetMessage = await auth.resetPassword({
      email: form.email,
      token: form.token,
      password: form.password,
      password_confirmation: form.password_confirmation,
    })
    form.password = ''
    form.password_confirmation = ''
    await setMode('login')
    message.value = resetMessage
  } catch (e) {
    if (e instanceof ApiError) {
      error.value = e.message
      fieldErrors.value = e.errors
    } else {
      error.value = 'Не удалось выполнить запрос'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-modal" role="dialog" aria-modal="true" :aria-label="title">
    <div class="auth-modal-header">
      <h1 class="auth-modal-title">{{ title }}</h1>
    </div>

    <form class="auth-modal-body" @submit.prevent="submit">
      <template v-if="mode === 'register'">
        <label class="settings-field">
          <span>Имя</span>
          <input v-model="form.name" type="text" autocomplete="name" required />
          <small v-if="firstError('name')" class="settings-error">{{ firstError('name') }}</small>
        </label>
      </template>

      <label v-if="mode !== 'reset' || form.email" class="settings-field">
        <span>Почта</span>
        <input
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
          :readonly="mode === 'reset'"
        />
        <small v-if="firstError('email')" class="settings-error">{{ firstError('email') }}</small>
      </label>

      <label v-if="mode === 'login' || mode === 'register' || mode === 'reset'" class="settings-field">
        <span>{{ mode === 'reset' ? 'Новый пароль' : 'Пароль' }}</span>
        <input
          v-model="form.password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          minlength="8"
          required
        />
        <small v-if="firstError('password')" class="settings-error">{{ firstError('password') }}</small>
      </label>

      <label v-if="mode === 'reset'" class="settings-field">
        <span>Повтор пароля</span>
        <input
          v-model="form.password_confirmation"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
        />
      </label>

      <div v-if="mode === 'register'" class="settings-field">
        <span>Пол</span>
        <div class="auth-gender">
          <button
            type="button"
            class="auth-gender-btn"
            :class="{ 'is-active': form.gender === 1 }"
            @click="form.gender = 1"
          >
            Муж.
          </button>
          <button
            type="button"
            class="auth-gender-btn auth-gender-btn-female"
            :class="{ 'is-active': form.gender === 2 }"
            @click="form.gender = 2"
          >
            Жен.
          </button>
        </div>
        <small v-if="firstError('gender')" class="settings-error">{{ firstError('gender') }}</small>
      </div>

      <input v-if="mode === 'reset'" v-model="form.token" type="hidden" />

      <p v-if="error" class="settings-error">{{ error }}</p>
      <p v-if="message" class="auth-success">{{ message }}</p>

      <button type="submit" class="settings-section-btn settings-section-btn-primary" :disabled="loading">
        {{
          loading
            ? 'Отправляем…'
            : mode === 'login'
              ? 'Войти'
              : mode === 'register'
                ? 'Создать'
                : mode === 'forgot'
                  ? 'Отправить ссылку'
                  : 'Сохранить пароль'
        }}
      </button>

      <div class="auth-links">
        <template v-if="mode === 'login'">
          <button type="button" class="auth-link" @click="setMode('register')">Регистрация</button>
          <button type="button" class="auth-link" @click="setMode('forgot')">Забыли пароль?</button>
        </template>
        <template v-else-if="mode === 'register'">
          <button type="button" class="auth-link" @click="setMode('login')">Уже есть аккаунт</button>
        </template>
        <template v-else>
          <button type="button" class="auth-link" @click="setMode('login')">Назад ко входу</button>
        </template>
      </div>
    </form>
  </div>
</template>

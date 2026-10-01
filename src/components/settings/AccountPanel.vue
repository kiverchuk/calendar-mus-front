<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import { useAuth } from '@/composables/useAuth'
import { useSettings } from '@/composables/useSettings'
import type { Gender } from '@/types/auth'

const emit = defineEmits<{
  saved: []
}>()

const router = useRouter()
const { user, updateProfile, logout } = useAuth()
const { closeSettings } = useSettings()

const loading = ref(false)
const error = ref('')
const success = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

const form = reactive({
  name: '',
  email: '',
  gender: 1 as Gender,
  password: '',
  password_confirmation: '',
})

const syncForm = () => {
  form.name = user.value?.name ?? ''
  form.email = user.value?.email ?? ''
  form.gender = user.value?.gender === 2 ? 2 : 1
  form.password = ''
  form.password_confirmation = ''
}

watch(user, syncForm, { immediate: true })

const firstError = (key: string) => fieldErrors.value[key]?.[0] || ''

const save = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  fieldErrors.value = {}

  try {
    const payload: {
      name: string
      email: string
      gender: Gender
      password?: string
      password_confirmation?: string
    } = {
      name: form.name,
      email: form.email,
      gender: form.gender,
    }

    if (form.password) {
      payload.password = form.password
      payload.password_confirmation = form.password_confirmation
    }

    await updateProfile(payload)
    success.value = 'Данные сохранены'
    form.password = ''
    form.password_confirmation = ''
    emit('saved')
  } catch (e) {
    if (e instanceof ApiError) {
      error.value = e.message
      fieldErrors.value = e.errors
    } else {
      error.value = 'Не удалось сохранить'
    }
  } finally {
    loading.value = false
  }
}

const onLogout = async () => {
  closeSettings()
  await logout()
  await router.push('/landing')
}
</script>

<template>
  <form class="account-panel" @submit.prevent="save">
    <label class="settings-field">
      <span>Имя</span>
      <input v-model="form.name" type="text" autocomplete="name" required />
      <small v-if="firstError('name')" class="settings-error">{{ firstError('name') }}</small>
    </label>

    <label class="settings-field">
      <span>Почта</span>
      <input v-model="form.email" type="email" autocomplete="email" required />
      <small v-if="firstError('email')" class="settings-error">{{ firstError('email') }}</small>
    </label>

    <div class="settings-field">
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

    <label class="settings-field">
      <span>Новый пароль</span>
      <input
        v-model="form.password"
        type="password"
        autocomplete="new-password"
        minlength="8"
        placeholder="Не менять"
      />
      <small v-if="firstError('password')" class="settings-error">{{ firstError('password') }}</small>
    </label>

    <label v-if="form.password" class="settings-field">
      <span>Повтор пароля</span>
      <input
        v-model="form.password_confirmation"
        type="password"
        autocomplete="new-password"
        minlength="8"
        required
      />
    </label>

    <p v-if="error" class="settings-error">{{ error }}</p>
    <p v-if="success" class="auth-success">{{ success }}</p>

    <button type="submit" class="settings-section-btn settings-section-btn-primary" :disabled="loading">
      {{ loading ? 'Сохраняем…' : 'Сохранить' }}
    </button>

    <button type="button" class="settings-section-btn" @click="onLogout">Выйти из аккаунта</button>
  </form>
</template>

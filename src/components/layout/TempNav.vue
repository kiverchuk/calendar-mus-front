<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated, logout } = useAuth()
const router = useRouter()

const onLogout = async () => {
  await logout()
  await router.push('/landing')
}
</script>

<template>
  <header class="temp-nav">
    <RouterLink class="temp-nav-brand" to="/landing">CalMus</RouterLink>
    <nav class="temp-nav-links">
      <RouterLink to="/">Главная</RouterLink>
      <RouterLink to="/landing">Вход</RouterLink>
      <button v-if="isAuthenticated" type="button" class="temp-nav-logout" @click="onLogout">
        Выйти
      </button>
    </nav>
  </header>
</template>

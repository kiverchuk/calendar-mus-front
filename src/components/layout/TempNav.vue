<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { isAuthenticated, logout } = useAuth()
const router = useRouter()

const onLogout = async () => {
  await logout()
  await router.push('/')
}
</script>

<template>
  <header class="temp-nav">
    <RouterLink class="temp-nav-brand" to="/">CalMus</RouterLink>
    <nav class="temp-nav-links">
      <RouterLink to="/">Главная</RouterLink>
      <RouterLink to="/cm">Календарь</RouterLink>
      <button v-if="isAuthenticated" type="button" class="temp-nav-logout" @click="onLogout">
        Выйти
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import TempNav from '@/components/layout/TempNav.vue'
import { useTheme } from '@/composables/useTheme'
import { themeStyle } from '@/themes/style'

const { theme } = useTheme()
const style = computed(() => themeStyle(theme.value))
</script>

<template>
  <div id="calmus-app" class="landing-page" :data-theme="theme.id" :style="style">
    <div class="texture-overlay" />
    <div class="landing-shell">
      <TempNav />
      <div class="landing-hero">
        <p class="landing-kicker">CalMus</p>
        <p class="landing-copy">Войдите или зарегистрируйтесь, чтобы открыть календарь.</p>
      </div>
      <AuthModal />
    </div>
  </div>
</template>

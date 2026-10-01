<script setup lang="ts">
import { provideAuth } from '@/composables/useAuth'
import { provideTheme } from '@/composables/useTheme'

provideTheme()
provideAuth()
</script>

<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useDashboard } from '@/composables/useDashboard'

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const { calendarDays, currentMonthNameWithYear, previousMonth, nextMonth, selectDate } = useDashboard()
</script>

<template>
  <div class="surface calendar-card overflow-hidden p-3">
    <div class="calendar-header">
      <button type="button" class="nav-btn" aria-label="Предыдущий месяц" @click="previousMonth">‹</button>
      <span>{{ currentMonthNameWithYear }}</span>
      <button type="button" class="nav-btn" aria-label="Следующий месяц" @click="nextMonth">›</button>
    </div>
    <div class="weekday-row grid grid-cols-7 pb-2">
      <div v-for="weekday in weekdays" :key="weekday" class="weekday">
        {{ weekday }}
      </div>
    </div>
    <div class="grid grid-cols-7 gap-y-1">
      <button
        v-for="day in calendarDays"
        :key="day.date.toISOString()"
        type="button"
        class="day"
        :class="{
          'is-outside': !day.isCurrentMonth,
          'is-today': day.isToday && !day.isSelected,
          'is-selected': day.isSelected,
        }"
        @click="selectDate(day)"
      >
        {{ day.day }}
      </button>
    </div>
  </div>
</template>

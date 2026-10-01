<script setup lang="ts">
import GoalCard from '@/components/goals/GoalCard.vue'
import { deadlinePresets, useGoals } from '@/composables/useGoals'

const {
  goals,
  creating,
  draftTitle,
  draftStart,
  draftEnd,
  startCreate,
  cancelCreate,
  applyPreset,
  createGoal,
} = useGoals()

const onCreate = () => {
  createGoal()
}
</script>

<template>
  <section class="surface goals-panel">
    <div class="goals-panel-head">
      <h3 class="panel-title goals-panel-title">Долгосрочное планирование</h3>
      <button
        v-if="!creating"
        type="button"
        class="goals-add-btn"
        @click="startCreate"
      >
        + Добавить цель
      </button>
    </div>

    <div v-if="creating" class="goals-create">
      <input
        v-model="draftTitle"
        type="text"
        class="goal-input goals-create-title"
        placeholder="Название цели..."
        maxlength="160"
      />

      <div class="goals-deadline">
        <span class="goals-deadline-label">Дедлайн</span>
        <div class="goals-deadline-row">
          <input v-model="draftStart" type="date" class="goal-input goals-date" />
          <span class="goals-deadline-sep">—</span>
          <input v-model="draftEnd" type="date" class="goal-input goals-date" />
        </div>
        <div class="goals-presets">
          <button
            v-for="preset in deadlinePresets"
            :key="preset.id"
            type="button"
            class="goals-preset-btn"
            @click="applyPreset(preset.id)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <div class="goals-create-actions">
        <button type="button" class="goals-add-btn" @click="onCreate">Создать</button>
        <button type="button" class="goals-add-btn is-ghost" @click="cancelCreate">Отмена</button>
      </div>
    </div>

    <div v-else-if="!goals.length" class="goals-empty">
      <p class="goals-empty-text">Нажмите «Добавить цель», чтобы начать планирование</p>
    </div>

    <div v-else class="goals-board">
      <GoalCard v-for="goal in goals" :key="goal.id" :goal="goal" />
    </div>
  </section>
</template>

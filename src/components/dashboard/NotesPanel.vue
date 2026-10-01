<script setup lang="ts">
import { useDashboard } from '@/composables/useDashboard'

const { notes, focusNote, blurNote, deleteNote, addNewNote } = useDashboard()
</script>

<template>
  <section class="surface bottom-panel flex flex-col px-4 py-4">
    <h3 class="panel-title">Заметки</h3>
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="notes-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        <p v-if="!notes.length" class="notes-empty">Пока нет заметок</p>
        <div v-for="(note, noteIndex) in notes" :key="note.id" class="relative mb-2">
          <textarea
            v-model="note.text"
            class="note-input"
            :class="note.focused ? 'note-expanded' : 'note-collapsed'"
            :data-note-id="note.id"
            placeholder="Введите текст"
            :aria-label="`Заметка ${noteIndex + 1}`"
            @focus="focusNote(note.id)"
            @blur="blurNote(note.id)"
          />
          <Transition name="fade">
            <button
              v-if="note.focused"
              type="button"
              class="delete-note"
              :aria-label="`Удалить заметку ${noteIndex + 1}`"
              @mousedown.prevent="deleteNote(note.id)"
            >
              ✕
            </button>
          </Transition>
        </div>
      </div>
      <button type="button" class="note-add" aria-label="Добавить заметку" @click="addNewNote">
        <span class="mr-2 text-lg">+</span>
        Добавить заметку
      </button>
    </div>
  </section>
</template>

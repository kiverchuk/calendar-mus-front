import type { DashboardTheme } from '@/themes/types'
import { structureTokens } from '@/themes/structure'

const namazGradient = 'linear-gradient(90deg, #5bb8a6 0%, #4ecdc4 48%, #45b7d1 100%)'

export const glassTheme: DashboardTheme = {
  id: 'theme-1',
  label: 'Тема 1',
  trackerBars: [
    {
      background: 'linear-gradient(90deg, #34d399, #4ade80, #86efac)',
      shadow: '0 4px 12px rgba(52, 211, 153, 0.3)',
    },
    {
      background: 'linear-gradient(90deg, #38bdf8, #22d3ee, #67e8f9)',
      shadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
    },
  ],
  prayerVisuals: [
    {
      boxShadow: '0 0 20px rgba(244, 114, 182, 0.4), 0 0 40px rgba(244, 114, 182, 0.15)',
      background:
        'radial-gradient(circle at 20% 30%, rgba(244, 114, 182, 0.45) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(251, 113, 133, 0.35) 0%, transparent 45%), radial-gradient(circle at 50% 90%, rgba(249, 168, 212, 0.3) 0%, transparent 40%), rgba(255,255,255,0.45)',
      gradients: [
        'linear-gradient(90deg, #f472b6, #fb7185)',
        'linear-gradient(90deg, #f9a8d4, #c084fc)',
        'linear-gradient(90deg, #fda4af, #f472b6)',
      ],
      namazGradient,
    },
    {
      boxShadow: '0 0 20px rgba(74, 222, 128, 0.4), 0 0 40px rgba(74, 222, 128, 0.15)',
      background:
        'radial-gradient(circle at 30% 25%, rgba(0, 244, 224, 0.45) 0%, transparent 50%), radial-gradient(circle at 75% 65%, rgba(74, 222, 128, 0.35) 0%, transparent 45%), radial-gradient(circle at 15% 80%, rgba(52, 211, 153, 0.3) 0%, transparent 40%), rgba(255,255,255,0.45)',
      gradients: [
        'linear-gradient(90deg, #34d399, #4ade80)',
        'linear-gradient(90deg, #6ee7b7, #a3e635)',
        'linear-gradient(90deg, #86efac, #34d399)',
      ],
      namazGradient,
    },
    {
      boxShadow: '0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.15)',
      background:
        'radial-gradient(circle at 70% 20%, rgba(251, 191, 36, 0.45) 0%, transparent 50%), radial-gradient(circle at 25% 75%, rgba(251, 146, 60, 0.35) 0%, transparent 45%), radial-gradient(circle at 80% 85%, rgba(253, 224, 71, 0.3) 0%, transparent 40%), rgba(255,255,255,0.45)',
      gradients: [
        'linear-gradient(90deg, #fbbf24, #f59e0b)',
        'linear-gradient(90deg, #fb923c, #f472b6)',
        'linear-gradient(90deg, #fde047, #84cc16)',
      ],
      namazGradient,
    },
    {
      boxShadow: '0 0 20px rgba(96, 165, 250, 0.4), 0 0 40px rgba(96, 165, 250, 0.15)',
      background:
        'radial-gradient(circle at 25% 35%, rgba(96, 165, 250, 0.45) 0%, transparent 50%), radial-gradient(circle at 80% 25%, rgba(56, 189, 248, 0.35) 0%, transparent 45%), radial-gradient(circle at 40% 85%, rgba(99, 102, 241, 0.3) 0%, transparent 40%), rgba(255,255,255,0.45)',
      gradients: [
        'linear-gradient(90deg, #60a5fa, #818cf8)',
        'linear-gradient(90deg, #38bdf8, #6366f1)',
        'linear-gradient(90deg, #93c5fd, #60a5fa)',
      ],
      namazGradient,
    },
    {
      boxShadow: '0 0 20px rgba(167, 139, 250, 0.4), 0 0 40px rgba(167, 139, 250, 0.15)',
      background:
        'radial-gradient(circle at 65% 30%, rgba(167, 139, 250, 0.45) 0%, transparent 50%), radial-gradient(circle at 20% 70%, rgba(192, 132, 252, 0.35) 0%, transparent 45%), radial-gradient(circle at 75% 80%, rgba(216, 180, 254, 0.3) 0%, transparent 40%), rgba(255,255,255,0.45)',
      gradients: [
        'linear-gradient(90deg, #a78bfa, #c084fc)',
        'linear-gradient(90deg, #c4b5fd, #f0abfc)',
        'linear-gradient(90deg, #d8b4fe, #a78bfa)',
      ],
      namazGradient,
    },
  ],
  tokens: {
    ...structureTokens,
    'page-bg': '#f4f3ee',
    'page-image': "url('/bg.png')",
    'page-repeat': 'repeat',
    'page-size': 'auto',
    'page-blend': 'screen',
    'texture-image': "url('/Texture.png')",
    'texture-opacity': '0.68',
    'texture-blend': 'multiply',
    'text': '#1f2937',
    'muted': '#9ca3af',
    'panel-bg': 'rgba(255, 255, 255, 0.5)',
    'panel-border': '1px solid rgba(255, 255, 255, 0.5)',
    'panel-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
    'bottom-panel-bg':
      'radial-gradient(circle at 16% 18%, rgba(255, 255, 255, 0.78) 0%, transparent 34%), radial-gradient(circle at 82% 18%, rgba(91, 184, 166, 0.3) 0%, transparent 42%), radial-gradient(circle at 78% 78%, rgba(69, 183, 209, 0.24) 0%, transparent 42%), radial-gradient(circle at 22% 84%, rgba(166, 125, 216, 0.18) 0%, transparent 38%), rgba(255, 255, 255, 0.58)',
    'heading-color': '#1f2937',
    'clock-color': '#1f2937',
    'calendar-header-bg': 'linear-gradient(135deg, #5bb8a6, #4ecdc4, #45b7d1)',
    'calendar-header-color': '#ffffff',
    'nav-btn-bg': 'rgba(255, 255, 255, 0.3)',
    'nav-btn-color': '#ffffff',
    'weekday-color': '#6b7280',
    'day-color': '#374151',
    'day-outside': '#d1d5db',
    'today-bg': 'linear-gradient(135deg, #a8e063, #56ab2f)',
    'today-color': '#ffffff',
    'selected-bg': '#5bb8a6',
    'selected-color': '#ffffff',
    'prayer-title-color': '#1f2937',
    'prayer-time-color': '#9ca3af',
    'card-bg': 'rgba(255, 255, 255, 0.45)',
    'card-border': '1px solid rgba(255, 255, 255, 0.5)',
    'card-shadow': 'none',
    'fixed-row-bg': 'transparent',
    'fixed-row-color': '#ffffff',
    'fixed-time-color': 'rgba(255, 255, 255, 0.8)',
    'task-row-bg': 'rgba(255, 255, 255, 0.5)',
    'task-row-color': '#374151',
    'task-row-border': '1px solid #d1d5db',
    'task-dash': '#4b5563',
    'task-time-color': '#6b7280',
    'editor-bg': 'rgba(255, 255, 255, 0.8)',
    'editor-border': '1px solid #e5e7eb',
    'editor-color': '#374151',
    'add-btn-bg': 'transparent',
    'add-btn-color': '#9ca3af',
    'add-btn-border': '2px solid #d1d5db',
    'note-bg': 'rgba(255, 255, 255, 0.3)',
    'note-color': '#1f2937',
    'note-ring': 'rgba(255, 255, 255, 0.4)',
    'note-btn-bg': 'rgba(255, 255, 255, 0.3)',
    'note-btn-color': '#1f2937',
    'placeholder': 'rgba(107, 114, 128, 0.6)',
    'badge-border': '#ffffff',
    'status-done': '#22c55e',
    'status-overdue': '#ef4444',
    'scrollbar-thumb': 'rgba(255, 255, 255, 0.5)',
    'scrollbar-track': 'transparent',
    'card-scrollbar': 'rgba(0, 0, 0, 0.15)',
  },
}

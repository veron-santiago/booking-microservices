import { useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { DAYS, groupByDay, flattenByDay } from '../../utils/schedule'

// Controlled editor. `value` is a flat [{dayOfWeek, startTime, endTime}] list,
// `onChange` receives the updated flat list.
function WeeklyScheduleEditor({ value, onChange, disabled = false }) {
  const byDay = useMemo(() => groupByDay(value), [value])

  const emit = (nextByDay) => {
    onChange(flattenByDay(nextByDay))
  }

  const addInterval = (dayKey) => {
    const next = { ...byDay, [dayKey]: [...(byDay[dayKey] || []), { startTime: '09:00', endTime: '18:00' }] }
    emit(next)
  }

  const removeInterval = (dayKey, index) => {
    const next = { ...byDay, [dayKey]: byDay[dayKey].filter((_, i) => i !== index) }
    emit(next)
  }

  const updateInterval = (dayKey, index, field, fieldValue) => {
    const next = {
      ...byDay,
      [dayKey]: byDay[dayKey].map((interval, i) =>
        i === index ? { ...interval, [field]: fieldValue } : interval,
      ),
    }
    emit(next)
  }

  return (
    <div className="space-y-3">
      {DAYS.map((day) => {
        const intervals = byDay[day.key] || []
        return (
          <div
            key={day.key}
            className="rounded-xl border-2 border-indigo-200/60 bg-white/70 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">{day.label}</span>
              {intervals.length === 0 && (
                <span className="text-xs font-medium text-slate-400">Cerrado</span>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {intervals.map((interval, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="time"
                    step={60}
                    value={interval.startTime}
                    onChange={(e) => updateInterval(day.key, index, 'startTime', e.target.value)}
                    disabled={disabled}
                    className="rounded-lg border-2 border-indigo-200/60 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  />
                  <span className="text-slate-400">—</span>
                  <input
                    type="time"
                    step={60}
                    value={interval.endTime}
                    onChange={(e) => updateInterval(day.key, index, 'endTime', e.target.value)}
                    disabled={disabled}
                    className="rounded-lg border-2 border-indigo-200/60 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeInterval(day.key, index)}
                    disabled={disabled}
                    className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                    aria-label="Eliminar intervalo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addInterval(day.key)}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Agregar horario
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default WeeklyScheduleEditor

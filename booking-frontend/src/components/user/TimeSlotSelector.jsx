import { useMemo } from 'react'
import { Clock } from 'lucide-react'

function parseTimeToMinutes(timeString) {
  if (!timeString) return null
  const [hours, minutes] = String(timeString).substring(0, 5).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return hours * 60 + minutes
}

function formatMinutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const STEP_MINUTES = 30

// Generates the start times at which a booking of `durationMinutes` fully fits
// inside one of the available intervals. `minStartMinutes` filters out past slots.
function generateSlots(availableIntervals, durationMinutes, minStartMinutes) {
  const slots = []
  const seen = new Set()

  ;(Array.isArray(availableIntervals) ? availableIntervals : []).forEach((interval) => {
    const openMinutes = parseTimeToMinutes(interval.startTime)
    const closeMinutes = parseTimeToMinutes(interval.endTime)
    if (openMinutes === null || closeMinutes === null) return

    for (let current = openMinutes; current + durationMinutes <= closeMinutes; current += STEP_MINUTES) {
      if (minStartMinutes != null && current < minStartMinutes) continue
      const value = formatMinutesToTime(current)
      if (!seen.has(value)) {
        seen.add(value)
        slots.push({ value, label: value })
      }
    }
  })

  slots.sort((a, b) => a.value.localeCompare(b.value))
  return slots
}

function TimeSlotSelector({
  selectedDate,
  selectedTime,
  onTimeSelect,
  availableIntervals,
  intervalMinutes = 60,
  loading = false,
}) {
  const minStartMinutes = useMemo(() => {
    if (!selectedDate) return null
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    if (selectedDate !== todayKey) return null
    return today.getHours() * 60 + today.getMinutes()
  }, [selectedDate])

  const timeSlots = useMemo(
    () => generateSlots(availableIntervals, intervalMinutes, minStartMinutes),
    [availableIntervals, intervalMinutes, minStartMinutes],
  )

  if (!selectedDate) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-indigo-400 mb-3" />
        <p className="text-sm text-slate-600">
          Selecciona una fecha para ver los horarios disponibles
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 p-6 text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 mb-3"></div>
        <p className="text-sm text-slate-600">Cargando disponibilidad...</p>
      </div>
    )
  }

  if (timeSlots.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-indigo-400 mb-3" />
        <p className="text-sm text-slate-600">
          No hay horarios disponibles para esta fecha y duración
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Clock className="h-4 w-4 text-indigo-500" />
        <span>Horarios disponibles</span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {timeSlots.map((slot) => {
          const isSelected = selectedTime === slot.value
          return (
            <button
              key={slot.value}
              type="button"
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-300 ring-2 ring-indigo-400'
                  : 'bg-gradient-to-br from-white to-indigo-50/30 text-slate-700 border-2 border-indigo-200/60 shadow-sm hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-200/40'
              }`}
              onClick={() => onTimeSelect(slot.value)}
            >
              {slot.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TimeSlotSelector

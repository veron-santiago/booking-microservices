// Weekly schedule + exceptions helpers shared by club and facility editors.

export const DAYS = [
  { key: 'MONDAY', label: 'Lunes' },
  { key: 'TUESDAY', label: 'Martes' },
  { key: 'WEDNESDAY', label: 'Miércoles' },
  { key: 'THURSDAY', label: 'Jueves' },
  { key: 'FRIDAY', label: 'Viernes' },
  { key: 'SATURDAY', label: 'Sábado' },
  { key: 'SUNDAY', label: 'Domingo' },
]

const DAY_LABELS = DAYS.reduce((acc, d) => {
  acc[d.key] = d.label
  return acc
}, {})

export function dayLabel(key) {
  return DAY_LABELS[key] || key
}

// Backend sends LocalTime as "HH:mm" or "HH:mm:ss"; the <input type=time> uses "HH:mm".
export function normalizeTime(value) {
  if (!value) return ''
  return String(value).substring(0, 5)
}

// Groups a flat [{dayOfWeek, startTime, endTime}] list into { MONDAY: [{startTime, endTime}], ... }.
export function groupByDay(openingHours) {
  const byDay = {}
  DAYS.forEach((d) => {
    byDay[d.key] = []
  })

  ;(Array.isArray(openingHours) ? openingHours : []).forEach((h) => {
    const day = h.dayOfWeek
    if (!byDay[day]) byDay[day] = []
    byDay[day].push({
      startTime: normalizeTime(h.startTime),
      endTime: normalizeTime(h.endTime),
    })
  })

  Object.keys(byDay).forEach((day) => {
    byDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
  })

  return byDay
}

// Flattens { MONDAY: [...] } back to [{dayOfWeek, startTime, endTime}].
export function flattenByDay(byDay) {
  const result = []
  DAYS.forEach((d) => {
    ;(byDay[d.key] || []).forEach((interval) => {
      result.push({
        dayOfWeek: d.key,
        startTime: interval.startTime,
        endTime: interval.endTime,
      })
    })
  })
  return result
}

// Validates a list of {startTime, endTime} intervals belonging to the same day.
// Returns an error string, or null when valid.
export function validateIntervals(intervals) {
  const list = Array.isArray(intervals) ? intervals : []

  for (const interval of list) {
    if (!interval.startTime || !interval.endTime) {
      return 'Completá la hora de inicio y de fin en todos los intervalos.'
    }
    if (interval.startTime >= interval.endTime) {
      return 'La hora de inicio debe ser anterior a la de fin.'
    }
  }

  const sorted = [...list].sort((a, b) => a.startTime.localeCompare(b.startTime))
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].startTime < sorted[i - 1].endTime) {
      return 'Los intervalos de un mismo día no pueden solaparse.'
    }
  }

  return null
}

// Validates the whole weekly schedule grouped by day.
export function validateWeekly(byDay) {
  for (const day of DAYS) {
    const error = validateIntervals(byDay[day.key] || [])
    if (error) {
      return `${day.label}: ${error}`
    }
  }
  return null
}

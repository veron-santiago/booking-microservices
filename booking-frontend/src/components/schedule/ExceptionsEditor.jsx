import { useState } from 'react'
import { Plus, Trash2, CalendarClock } from 'lucide-react'
import { normalizeTime, validateIntervals } from '../../utils/schedule'

const TYPE_LABELS = {
  CLOSED: 'Cerrado',
  CUSTOM_HOURS: 'Horario especial',
  BLOCKED: 'Bloqueo parcial',
}

function formatDate(value) {
  if (!value) return '-'
  const [year, month, day] = String(value).split('T')[0].split('-')
  if (!year || !month || !day) return String(value)
  return `${day}/${month}/${year}`
}

// Renders existing exceptions and a form to add a new one.
// `allowBlocked` enables the facility-only BLOCKED type.
function ExceptionsEditor({ exceptions, onAdd, onDelete, allowBlocked = false, disabled = false }) {
  const [date, setDate] = useState('')
  const [type, setType] = useState('CLOSED')
  const [note, setNote] = useState('')
  const [intervals, setIntervals] = useState([{ startTime: '09:00', endTime: '18:00' }])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const needsIntervals = type === 'CUSTOM_HOURS' || type === 'BLOCKED'

  const resetForm = () => {
    setDate('')
    setType('CLOSED')
    setNote('')
    setIntervals([{ startTime: '09:00', endTime: '18:00' }])
    setError('')
  }

  const addIntervalRow = () => setIntervals((prev) => [...prev, { startTime: '09:00', endTime: '18:00' }])
  const removeIntervalRow = (index) => setIntervals((prev) => prev.filter((_, i) => i !== index))
  const updateIntervalRow = (index, field, value) =>
    setIntervals((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))

  const handleAdd = async () => {
    setError('')

    if (!date) {
      setError('Seleccioná una fecha.')
      return
    }

    let payloadIntervals = []
    if (needsIntervals) {
      const validationError = validateIntervals(intervals)
      if (validationError) {
        setError(validationError)
        return
      }
      payloadIntervals = intervals
    }

    setSaving(true)
    try {
      await onAdd({ date, type, note: note.trim() || null, intervals: payloadIntervals })
      resetForm()
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo guardar la excepción.')
    } finally {
      setSaving(false)
    }
  }

  const sorted = [...(Array.isArray(exceptions) ? exceptions : [])].sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  )

  return (
    <div className="space-y-4">
      {sorted.length ? (
        <div className="space-y-2">
          {sorted.map((exc) => (
            <div
              key={exc.id ?? exc.date}
              className="flex items-start justify-between gap-3 rounded-xl border-2 border-indigo-200/60 bg-white/70 p-3 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CalendarClock className="h-4 w-4 text-indigo-500" />
                  {formatDate(exc.date)}
                  <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {TYPE_LABELS[exc.type] || exc.type}
                  </span>
                </div>
                {Array.isArray(exc.intervals) && exc.intervals.length > 0 && (
                  <div className="mt-1 text-xs text-slate-600">
                    {exc.intervals
                      .map((i) => `${normalizeTime(i.startTime)} - ${normalizeTime(i.endTime)}`)
                      .join(' , ')}
                  </div>
                )}
                {exc.note && <div className="mt-1 text-xs italic text-slate-500">{exc.note}</div>}
              </div>
              <button
                type="button"
                onClick={() => onDelete(exc.id)}
                disabled={disabled || !exc.id}
                className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                aria-label="Eliminar excepción"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-500">No hay excepciones configuradas.</div>
      )}

      <div className="rounded-xl border-2 border-dashed border-indigo-200/60 bg-indigo-50/40 p-4">
        <div className="text-sm font-semibold text-slate-900">Agregar excepción</div>

        {error && (
          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={disabled || saving}
              className="w-full rounded-lg border-2 border-indigo-200/60 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={disabled || saving}
              className="w-full rounded-lg border-2 border-indigo-200/60 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="CLOSED">Cerrado</option>
              <option value="CUSTOM_HOURS">Horario especial</option>
              {allowBlocked && <option value="BLOCKED">Bloqueo parcial</option>}
            </select>
          </div>
        </div>

        {needsIntervals && (
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-slate-600">
              {type === 'BLOCKED' ? 'Períodos a bloquear' : 'Horarios de ese día'}
            </div>
            {intervals.map((interval, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="time"
                  step={60}
                  value={interval.startTime}
                  onChange={(e) => updateIntervalRow(index, 'startTime', e.target.value)}
                  disabled={disabled || saving}
                  className="rounded-lg border-2 border-indigo-200/60 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                />
                <span className="text-slate-400">—</span>
                <input
                  type="time"
                  step={60}
                  value={interval.endTime}
                  onChange={(e) => updateIntervalRow(index, 'endTime', e.target.value)}
                  disabled={disabled || saving}
                  className="rounded-lg border-2 border-indigo-200/60 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                />
                {intervals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIntervalRow(index)}
                    disabled={disabled || saving}
                    className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                    aria-label="Eliminar intervalo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addIntervalRow}
              disabled={disabled || saving}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Agregar intervalo
            </button>
          </div>
        )}

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-slate-600">Motivo (opcional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: mantenimiento, torneo, feriado"
            disabled={disabled || saving}
            className="w-full rounded-lg border-2 border-indigo-200/60 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || saving}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-300 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Agregar excepción'}
        </button>
      </div>
    </div>
  )
}

export default ExceptionsEditor

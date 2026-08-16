import { useState, useEffect } from 'react'
import { Calendar, AlertCircle } from 'lucide-react'
import userService from '../../services/userService'
import TimeSlotSelector from './TimeSlotSelector'

const DURATION_OPTIONS = [
  { value: 60, label: '60 minutos' },
  { value: 90, label: '90 minutos' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
]

function BookingModal({ sportsFacilityId, open, onClose, onSuccess }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableIntervals, setAvailableIntervals] = useState([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  useEffect(() => {
    if (!open) {
      setSelectedDate('')
      setSelectedTime('')
      setDurationMinutes(60)
      setError('')
      setLoading(false)
      setAvailableIntervals([])
      setLoadingAvailability(false)
    }
  }, [open])

  useEffect(() => {
    if (!open || !sportsFacilityId || !selectedDate) {
      setAvailableIntervals([])
      return
    }

    let cancelled = false
    const fetchAvailability = async () => {
      setLoadingAvailability(true)
      try {
        const data = await userService.getAvailability(sportsFacilityId, selectedDate)
        if (!cancelled) setAvailableIntervals(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setAvailableIntervals([])
      } finally {
        if (!cancelled) setLoadingAvailability(false)
      }
    }

    fetchAvailability()
    return () => {
      cancelled = true
    }
  }, [open, sportsFacilityId, selectedDate])

  const getMinDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 1)
    const year = maxDate.getFullYear()
    const month = String(maxDate.getMonth() + 1).padStart(2, '0')
    const day = String(maxDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const validateForm = () => {
    if (!selectedDate) {
      setError('Selecciona una fecha')
      return false
    }

    if (!selectedTime) {
      setError('Selecciona un horario')
      return false
    }

    const selected = new Date(`${selectedDate}T${selectedTime}`)
    const now = new Date()
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 1)

    if (selected < now) {
      setError('La fecha y hora no pueden ser anteriores a ahora')
      return false
    }

    if (selected > maxDate) {
      setError('La fecha no puede ser superior a un mes')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)

    try {
      const date = new Date(`${selectedDate}T${selectedTime}`)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      const formattedStart = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

      const payload = {
        sportsFacilityId,
        start: formattedStart,
        durationMinutes,
      }

      await userService.createBooking(payload)

      setLoading(false)
      onSuccess?.()
      onClose()
    } catch (err) {
      setLoading(false)
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al crear reserva'
      setError(errorMessage)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-auto rounded-3xl bg-gradient-to-br from-white/95 to-blue-50/90 shadow-2xl shadow-indigo-300/50 ring-1 ring-indigo-300/60">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Nueva Reserva</h2>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/50 hover:text-slate-600"
              onClick={onClose}
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="date" className="mb-2 block text-sm font-medium text-slate-700">
                Fecha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedTime('')
                  }}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full rounded-xl border-2 border-indigo-200/60 bg-white pl-11 pr-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <TimeSlotSelector
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onTimeSelect={setSelectedTime}
              availableIntervals={availableIntervals}
              intervalMinutes={durationMinutes}
              loading={loadingAvailability}
            />

            <div>
              <label htmlFor="duration" className="mb-2 block text-sm font-medium text-slate-700">
                Duración
              </label>
              <select
                id="duration"
                value={durationMinutes}
                onChange={(e) => {
                  setDurationMinutes(Number(e.target.value))
                  setSelectedTime('')
                }}
                className="w-full rounded-xl border-2 border-indigo-200/60 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                disabled={loading}
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                className="flex-1 rounded-xl border-2 border-slate-200/60 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-300 transition-all duration-200 hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || loadingAvailability || !selectedDate || !selectedTime}
              >
                {loading ? 'Reservando...' : 'Reservar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BookingModal

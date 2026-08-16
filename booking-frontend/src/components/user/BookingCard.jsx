function BookingCard({ booking, onCancel }) {
  const bookingId = booking?.id ?? booking?._id ?? booking?.bookingId ?? booking?.uuid
  const start = booking?.start ?? booking?.startTime ?? booking?.from
  const endRaw = booking?.end ?? booking?.endTime ?? booking?.to
  const durationMinutes = booking?.durationMinutes ?? booking?.duration ?? null

  const startDate = start ? new Date(start) : null

  const endDate = endRaw
    ? new Date(endRaw)
    : (startDate && durationMinutes
        ? new Date(startDate.getTime() + durationMinutes * 60000)
        : null)

  const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime())

  const fecha = isValidDate(startDate)
    ? startDate.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '-'

  const horaInicio = isValidDate(startDate)
    ? startDate.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    : null

  const horaFin = isValidDate(endDate)
    ? endDate.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    : null

  return (
    <div className="rounded-xl border border-violet-300/60 bg-gradient-to-br from-violet-100/70 to-purple-100/70 p-4 shadow-md shadow-violet-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-400/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {booking?.clubName || 'Club'}
          </div>

          <div className="mt-1 text-sm text-slate-700">
            <span className="text-slate-600">
              Cancha: {booking?.facilityName || '-'}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-200/60 to-blue-200/60 px-2 py-1.5">
            <span className="text-xs font-medium text-indigo-700">Fecha:</span>
            <span className="text-sm font-semibold text-indigo-900">{fecha}</span>
          </div>

          <div className="mt-1 flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-200/60 to-teal-200/60 px-2 py-1.5">
            <span className="text-xs font-medium text-emerald-700">Horario:</span>
            <span className="text-sm font-semibold text-emerald-900">
              {horaInicio
                ? `${horaInicio}${horaFin ? ` - ${horaFin}` : ''}`
                : '-'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="shrink-0 rounded-lg border-2 border-red-300/60 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition-all duration-200 hover:border-red-400 hover:bg-red-100/60 hover:shadow-md hover:shadow-red-200/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => onCancel(bookingId)}
          disabled={!bookingId}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default BookingCard
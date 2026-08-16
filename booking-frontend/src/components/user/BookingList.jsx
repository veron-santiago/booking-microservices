import BookingCard from './BookingCard'

function BookingList({ bookings, onCancel }) {
  if (!bookings?.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-violet-300/60 bg-gradient-to-br from-violet-100/70 to-purple-100/70 p-6 text-center">
        <div className="text-sm font-medium text-slate-600">
          No tienes reservas.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <BookingCard key={booking?.id ?? booking?._id ?? booking?.bookingId ?? JSON.stringify(booking)} booking={booking} onCancel={onCancel} />
      ))}
    </div>
  )
}

export default BookingList


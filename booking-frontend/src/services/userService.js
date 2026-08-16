import api from './api'

const ensureArray = (value) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  return value.items || value.data || value.bookings || value.results || []
}

function mapSportTypeToBackendEnum(sportType) {
  const value = String(sportType || '').trim().toLowerCase()
  if (!value) return null

  switch (value) {
    case 'football':
      return 'FOOTBALL'
    case 'tennis':
      return 'TENNIS'
    case 'basket':
      return 'BASKETBALL'
    case 'paddle':
      return 'PADDLE'
    default:
      return String(sportType).trim()
  }
}

const userService = {
  async getUserBookings() {
    const response = await api.get('/booking/user')
    return ensureArray(response.data)
  },

  async createBooking(payload) {
    const response = await api.post('/booking', payload)
    return response.data
  },

  async cancelBooking(bookingId) {
    const response = await api.delete(`/booking/${bookingId}`)
    return response.data
  },

  async getAvailability(facilityId, date) {
    const response = await api.get('/booking/availability', {
      params: { facilityId, date },
    })
    return ensureArray(response.data)
  },

  async searchFacilities({ lat, lon, radius = 5, sportTypes = [], date }) {
    const response = await api.post('/search', {
      lat,
      lon,
      radius,
      sportTypes: sportTypes
        .map(mapSportTypeToBackendEnum)
        .filter(Boolean),
      date: date ? date.split('T')[0] : null,
    })

    return ensureArray(response.data)
  },
}

export default userService
import api from './api'

const ensureArray = (value) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []

  return (
    value.items ||
    value.data ||
    value.schedules ||
    value.sports ||
    value.sportsTypes ||
    value.facilities ||
    []
  )
}

const clubService = {
  async getClub() {
    const response = await api.get('/club')
    return response.data?.club ?? response.data
  },

  async getClubById(clubId) {
    const response = await api.get(`/club/${clubId}`)
    return response.data?.club ?? response.data
  },

  async getClubFacilities(clubId) {
    const response = await api.get(`/sportsfacility/club/${clubId}`)
    return ensureArray(response.data)
  },

  async getFacility(facilityId) {
    const response = await api.get(`/sportsfacility/${facilityId}`)
    return response.data
  },

  async getSportsTypes() {
    const response = await api.get('/sportsfacility/sports')

    const data = response.data

    if (Array.isArray(data)) return data

    if (Array.isArray(data?.sportsTypes)) return data.sportsTypes

    return ensureArray(data)
  },

  async createFacility({ sportType }) {
    const response = await api.post('/sportsfacility', { sportType })
    return response.data
  },

  async deleteFacility(facilityId) {
    const response = await api.delete(`/sportsfacility/${facilityId}`)
    return response.data
  },

  async updateSchedule({ openingHours }) {
    const response = await api.put('/club/schedule', { openingHours })
    return response.data?.club ?? response.data
  },

  async getClubExceptions() {
    const response = await api.get('/club/exceptions')
    return ensureArray(response.data)
  },

  async addClubException(payload) {
    const response = await api.post('/club/exceptions', payload)
    return response.data?.club ?? response.data
  },

  async deleteClubException(exceptionId) {
    const response = await api.delete(`/club/exceptions/${exceptionId}`)
    return response.data?.club ?? response.data
  },

  async updateFacilitySchedule(facilityId, { openingHours }) {
    const response = await api.put(`/sportsfacility/${facilityId}/schedule`, { openingHours })
    return response.data
  },

  async getFacilityExceptions(facilityId) {
    const response = await api.get(`/sportsfacility/${facilityId}/exceptions`)
    return ensureArray(response.data)
  },

  async addFacilityException(facilityId, payload) {
    const response = await api.post(`/sportsfacility/${facilityId}/exceptions`, payload)
    return response.data
  },

  async deleteFacilityException(facilityId, exceptionId) {
    const response = await api.delete(`/sportsfacility/${facilityId}/exceptions/${exceptionId}`)
    return response.data
  },

  async getClubBookings() {
    const response = await api.get('/booking/club')
    return ensureArray(response.data)
  },

  async updateClubLocation({ latitude, longitude, address }) {
    const response = await api.post('/club/location', { latitude, longitude, address })
    return response.data
  },
}

export default clubService
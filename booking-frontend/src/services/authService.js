import api from './api'

const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)

    return response.data
  },

  async registerUser(payload) {
    const response = await api.post('/auth/register-user', payload)

    return response.data
  },

  async registerClub(payload) {
    const response = await api.post('/auth/register-club', payload)

    return response.data
  },
}

export default authService

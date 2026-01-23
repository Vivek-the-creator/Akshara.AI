import api from './authService'

export const writingService = {
  // Upload image for writing analysis
  async uploadImage(file, title) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (title) {
        formData.append('title', title)
      }

      const response = await api.post('/writing/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Image upload failed' }
    }
  },

  // Create writing session
  async createSession(sessionData) {
    try {
      const response = await api.post('/writing/session', sessionData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create writing session' }
    }
  },

  // Get user's writing sessions
  async getSessions(skip = 0, limit = 10) {
    try {
      const response = await api.get(`/writing/sessions?skip=${skip}&limit=${limit}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to get writing sessions' }
    }
  },

  // Get specific writing session
  async getSession(sessionId) {
    try {
      const response = await api.get(`/writing/session/${sessionId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to get writing session' }
    }
  }
}

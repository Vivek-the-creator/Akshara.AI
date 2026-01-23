import api from './authService'

export const voicePracticeService = {
  // Get all available levels
  async getLevels() {
    try {
      const response = await api.get('/voice-practice/levels')
      return response.data
    } catch (error) {
      console.error('Failed to fetch levels:', error)
      throw error
    }
  },

  // Get content for a specific level
  async getLevelContent(level) {
    try {
      const response = await api.get(`/voice-practice/content/${level}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch level content:', error)
      throw error
    }
  },

  // Submit voice practice attempt
  async submitAttempt(attemptData) {
    try {
      const response = await api.post('/voice-practice/attempt', attemptData)
      return response.data
    } catch (error) {
      console.error('Failed to submit attempt:', error)
      throw error
    }
  },

  // Get user progress
  async getUserProgress(userId) {
    try {
      const response = await api.get(`/voice-practice/progress/${userId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch user progress:', error)
      throw error
    }
  },

  // Unlock a level
  async unlockLevel(userId, level) {
    try {
      const response = await api.post('/voice-practice/unlock-level', {
        user_id: userId,
        level: level
      })
      return response.data
    } catch (error) {
      console.error('Failed to unlock level:', error)
      throw error
    }
  }
}

export default voicePracticeService

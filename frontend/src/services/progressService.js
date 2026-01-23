import api from './api'

class ProgressService {
  async createOrUpdateProgress(progressData) {
    try {
      const response = await api.post('/progress/progress', progressData)
      return response.data
    } catch (error) {
      console.error('Error creating/updating progress:', error)
      throw error
    }
  }

  async getUserProgress(stage = null, category = null) {
    try {
      let url = '/progress/user'
      const params = new URLSearchParams()
      
      if (stage) params.append('stage', stage)
      if (category) params.append('category', category)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error('Error fetching user progress:', error)
      throw error
    }
  }

  async getLevelProgress(stage, category, levelNumber) {
    try {
      const response = await api.get(`/progress/level/${stage}/${category}/${levelNumber}`)
      return response.data
    } catch (error) {
      console.error('Error fetching level progress:', error)
      throw error
    }
  }

  async getProgressSummary() {
    try {
      const response = await api.get('/progress/summary')
      return response.data
    } catch (error) {
      console.error('Error fetching progress summary:', error)
      throw error
    }
  }

  // Helper functions
  calculateStars(attempts) {
    if (attempts <= 3) return 3
    if (attempts <= 7) return 2
    return 1
  }

  isLevelUnlocked(userProgress, currentLevel) {
    if (currentLevel === 1) return true
    
    const previousLevel = userProgress.find(p => p.level_number === currentLevel - 1)
    return previousLevel?.completed_at ? true : false
  }

  getNextUnlockedLevel(userProgress) {
    const completedLevels = userProgress
      .filter(p => p.completed_at)
      .map(p => p.level_number)
      .sort((a, b) => a - b)
    
    if (completedLevels.length === 0) return 1
    
    const lastCompleted = completedLevels[completedLevels.length - 1]
    return lastCompleted + 1
  }
}

export const progressService = new ProgressService()

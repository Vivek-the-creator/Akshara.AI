import api from './api'

export const aiService = {
  // Evaluate handwritten letter using AI
  async evaluateHandwriting(file, language, stage, levelNumber, expectedLetter) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('language', language)
      formData.append('stage', stage)
      formData.append('level_number', levelNumber.toString())
      formData.append('expected_letter', expectedLetter)

      const response = await api.post('/writing/evaluate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error) {
      console.error('Error evaluating handwriting:', error)
      throw error
    }
  },

  // Get evaluation history for a user
  async getEvaluationHistory() {
    try {
      const response = await api.get('/writing/evaluations')
      return response.data
    } catch (error) {
      console.error('Error fetching evaluation history:', error)
      throw error
    }
  },

  // Get specific evaluation details
  async getEvaluation(evaluationId) {
    try {
      const response = await api.get(`/writing/evaluations/${evaluationId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching evaluation:', error)
      throw error
    }
  }
}

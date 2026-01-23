import api from './api'

export const authService = {
  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Registration failed'
      console.error('Registration error:', errorMessage)
      throw { detail: errorMessage }
    }
  },

  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Login failed'
      console.error('Login error:', errorMessage)
      throw { detail: errorMessage }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to get user data'
      console.error('Get current user error:', errorMessage)
      throw { detail: errorMessage }
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(`/user/${userId}`)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to get user'
      console.error('Get user error:', errorMessage)
      throw { detail: errorMessage }
    }
  }
}

export const authUtils = {
  getToken() {
    return localStorage.getItem('token')
  },
  
  setToken(token) {
    localStorage.setItem('token', token)
  },
  
  removeToken() {
    localStorage.removeItem('token')
  },
  
  isAuthenticated() {
    return !!this.getToken()
  }
}

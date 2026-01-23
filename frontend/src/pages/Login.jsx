import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    age: '',
    learning_language: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('🔍 DEBUG: Submitting form...', { isLogin, formData })

    try {
      if (isLogin) {
        console.log('🔍 DEBUG: Attempting login...')
        await login({
          email: formData.email,
          password: formData.password
        })
      } else {
        // Convert age to integer if provided
        const registrationData = {
          ...formData,
          age: formData.age ? parseInt(formData.age, 10) : undefined
        }
        console.log('🔍 DEBUG: Attempting registration with data:', registrationData)
        await register(registrationData)
        console.log('🔍 DEBUG: Registration successful, attempting login...')
        // After successful registration, log the user in
        await login({
          email: formData.email,
          password: formData.password
        })
      }
      navigate('/dashboard')
    } catch (error) {
      console.error('❌ Registration/Login error:', error)
      console.error('❌ Error details:', {
        message: error.message,
        detail: error.detail,
        response: error.response?.data,
        status: error.response?.status
      })
      setError(error.detail || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="5"
                max="18"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="learning_language">Learning Language *</label>
              <select
                id="learning_language"
                name="learning_language"
                value={formData.learning_language}
                onChange={handleChange}
                required
              >
                <option value="">Select a language</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>
        
        <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setIsLogin(!isLogin)
            setError('')
          }}
          style={{ width: '100%' }}
        >
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  )
}

export default Login

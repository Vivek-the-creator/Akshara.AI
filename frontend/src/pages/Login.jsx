import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

const ORBITING_LETTERS = [
  { char: 'அ', lang: 'tamil', angle: 0, ring: 1 },
  { char: 'க', lang: 'tamil', angle: 45, ring: 1 },
  { char: 'ஷ', lang: 'tamil', angle: 90, ring: 1 },
  { char: 'ர', lang: 'tamil', angle: 135, ring: 1 },
  { char: 'ம', lang: 'tamil', angle: 180, ring: 1 },
  { char: 'ப', lang: 'tamil', angle: 225, ring: 1 },
  { char: 'ல', lang: 'tamil', angle: 270, ring: 1 },
  { char: 'न', lang: 'hindi', angle: 30, ring: 2 },
  { char: 'स', lang: 'hindi', angle: 120, ring: 2 },
  { char: 'त', lang: 'hindi', angle: 210, ring: 2 },
  { char: 'A', lang: 'english', angle: 60, ring: 3 },
  { char: 'Z', lang: 'english', angle: 150, ring: 3 },
]

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 2,
  delay: Math.random() * 5,
  duration: Math.random() * 6 + 6,
}))

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
  const [visible, setVisible] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const mascotRef = useRef(null)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    
    const updateOrbitPositions = () => {
      if (!mascotRef.current) return
      const time = Date.now() * 0.001
      ORBITING_LETTERS.forEach((letter, i) => {
        const element = mascotRef.current?.querySelector(`.orbit-letter-${i}`)
        if (element) {
          const ring = letter.ring
          const radius = 140 - (ring - 1) * 40
          const angle = (letter.angle + time * 30 * (ring % 2 === 0 ? 1 : -1)) * Math.PI / 180
          const x = 50 + (radius * Math.cos(angle)) / 2
          const y = 50 + (radius * Math.sin(angle)) / 2
          element.style.left = `${x}%`
          element.style.top = `${y}%`
        }
      })
    }
    
    const interval = setInterval(updateOrbitPositions, 50)
    return () => clearInterval(interval)
  }, [])

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

    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password
        })
      } else {
        const registrationData = {
          ...formData,
          age: formData.age ? parseInt(formData.age, 10) : undefined
        }
        await register(registrationData)
        await login({
          email: formData.email,
          password: formData.password
        })
      }
      navigate('/dashboard')
    } catch (error) {
      setError(error.detail || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`login-root ${visible ? 'login-visible' : ''}`}>
      {/* Aurora Background */}
      <div className="login-aurora-bg">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
        <div className="aurora aurora-4" />
        <div className="stars" />
        
        {/* Particles */}
        {PARTICLES.map(p => (
          <span
            key={p.id}
            className="login-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Left Panel - 3D Mascot */}
      <div className="login-left">
        <div className="mascot-3d-container">
          <div className="mascot-orbit-system" ref={mascotRef}>
            {/* Orbit rings */}
            <div className="orbit-ring orbit-ring-1" />
            <div className="orbit-ring orbit-ring-2" />
            <div className="orbit-ring orbit-ring-3" />
            
            {/* Orbiting letters */}
            {ORBITING_LETTERS.map((l, i) => (
              <div
                key={i}
                className={`orbiting-letter orbit-letter-${i} ${l.lang}`}
              >
                {l.char}
              </div>
            ))}
            
            {/* Central mascot */}
            <div className="mascot-center">
              <div className="mascot-core">
                🤖
                <div className="mascot-pulse" />
              </div>
              <div className="mascot-glow-3d" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Glass Login Card */}
      <div className="login-right">
        <div className="glass-card">
          <div className="card-content">
            {/* Card header */}
            <div className="card-header">
              <div className="brand-badge">
                <span className="emoji">✨</span>
                <span className="name">Akshara.AI</span>
              </div>
              <h1 className="card-title">{isLogin ? 'Welcome Back!' : 'Create Account'}</h1>
              <p className="card-subtitle">
                {isLogin ? 'Sign in to continue your learning journey' : 'Start your language adventure today'}
              </p>
            </div>

            {/* Form */}
            {error && <div className="glass-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="glass-input"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="full_name" className="form-label">Full Name</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      className="glass-input"
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="age" className="form-label">Age</label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      className="glass-input"
                      placeholder="Your age"
                      value={formData.age}
                      onChange={handleChange}
                      min="5"
                      max="18"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="learning_language" className="form-label">Learning Language *</label>
                    <select
                      id="learning_language"
                      name="learning_language"
                      className="glass-select"
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
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="glass-input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="glass-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                />
              </div>
              
              <button type="submit" className="glass-btn" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>
            
            {/* Toggle form */}
            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="toggle-form"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
              >
                {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
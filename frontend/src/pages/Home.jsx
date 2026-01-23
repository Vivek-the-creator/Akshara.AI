import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { user } = useAuth()

  return (
    <div className="card">
      <h1>Welcome to AI Language Learning Platform</h1>
      <p style={{ fontSize: '18px', color: '#666', margin: '20px 0' }}>
        An interactive platform designed to help children learn languages through AI-powered tools.
      </p>
      
      <div style={{ margin: '30px 0' }}>
        <h2>Features</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>📝 Writing Tutor with image upload capability</li>
          <li>🎤 Voice recognition for pronunciation practice</li>
          <li>📊 Personalized learning dashboard</li>
          <li>🤖 AI-powered feedback and suggestions</li>
        </ul>
      </div>

      <div style={{ margin: '30px 0' }}>
        <h2>Get Started</h2>
        {user ? (
          <div>
            <p>Welcome back, {user.username}! 👋</p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/dashboard" className="btn" style={{ marginRight: '10px' }}>
                Go to Dashboard
              </Link>
              <Link to="/writing" className="btn">
                Start Writing Practice
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p>Join us to start your language learning journey!</p>
            <div style={{ marginTop: '20px' }}>
              <Link to="/login" className="btn">
                Login / Register
              </Link>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>About This Platform</h3>
        <p>
          This is Phase 1 of our AI Language Learning Platform. Currently, we offer:
        </p>
        <ul>
          <li>User registration and authentication</li>
          <li>Basic dashboard with user information</li>
          <li>Image upload interface for writing analysis</li>
          <li>Microphone interface (speech features coming soon)</li>
        </ul>
        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
          Advanced AI features, OCR processing, and speech recognition will be implemented in future phases.
        </p>
      </div>
    </div>
  )
}

export default Home

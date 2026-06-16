import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Layout.css'

const MENU_ITEMS = [
  { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
  { icon: '🗺️', label: 'Learning Path', path: '/levels' },
  { icon: '✍️', label: 'Writing Tutor', path: '/writing' },
  { icon: '🎤', label: 'Speaking Tutor', path: '/voice-practice' },
  { icon: '🎮', label: 'Daily Practice', path: '/daily-practice' },
  { icon: '🏆', label: 'Achievements', path: '/achievements' },
  { icon: '👑', label: 'Leaderboard', path: '/leaderboard' },
  { icon: '👤', label: 'Profile', path: '/profile' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className={`layout-root ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/" className="logo">
            <span className="logo-icon">🤖</span>
            <span className="logo-text">Akshara<span className="logo-ai">.AI</span></span>
          </Link>
          
          <nav className="nav-menu">
            {MENU_ITEMS.map((item, i) => (
              <Link
                key={i}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Mini Assistant Card */}
        <div className="assistant-card">
          <div className="assistant-avatar">🤖</div>
          <div className="assistant-info">
            <p className="assistant-title">Your Assistant</p>
            <p className="assistant-text">Ready to help!</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <h1 className="header-title">
            {user?.full_name || user?.username || 'Learner'} 👋
          </h1>
          <div className="header-stats">
            <div className="stat-chip stat-streak">
              <span className="stat-icon">🔥</span>
              <span className="stat-value">7</span>
            </div>
            <div className="stat-chip stat-xp">
              <span className="stat-icon">⚡</span>
              <span className="stat-value">1,240 XP</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  )
}
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="nav">
      <div className="nav-container">
        <div>
          <Link to="/" style={{ fontSize: '20px', fontWeight: 'bold', textDecoration: 'none', color: '#007bff' }}>
            AI Language Learning
          </Link>
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/writing">Writing Tutor</Link>
              <button 
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ marginLeft: '10px' }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

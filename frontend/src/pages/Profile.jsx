import React from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import './Profile.css'

export default function Profile() {
  const { user } = useAuth()

  return (
    <Layout>
      <div className="profile">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account and learning preferences</p>

        <div className="profile-grid grid-24 grid-24-2">
          {/* Avatar Card */}
          <div className="profile-card glass-card">
            <div className="avatar-section">
              <div className="profile-avatar">
                {user?.avatar || user?.full_name?.[0] || user?.username?.[0] || '👤'}
              </div>
              <h2 className="profile-name">{user?.full_name || user?.username || 'Learner'}</h2>
              <p className="profile-level">Level 3 • 1,240 XP</p>
            </div>
          </div>

          {/* Stats Card */}
          <div className="profile-card glass-card">
            <h3 className="card-title">Learning Stats</h3>
            <div className="stats-list">
              <div className="stat-row">
                <span className="stat-label">Daily Streak</span>
                <span className="stat-value">7 days 🔥</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Lessons Completed</span>
                <span className="stat-value">24</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Hours Learned</span>
                <span className="stat-value">12.5h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-grid grid-24">
          {/* Personal Info */}
          <div className="profile-card glass-card">
            <h3 className="card-title">Personal Information</h3>
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Username</span>
                <span className="info-value">{user?.username || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">{user?.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Member Since</span>
                <span className="info-value">January 2024</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
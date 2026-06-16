import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import './Dashboard.css'

const STATS = [
  { icon: '🔥', label: 'Daily Streak', value: '7', color: '#ff6432' },
  { icon: '⭐', label: 'XP Points', value: '1,240', color: '#7B61FF' },
  { icon: '🏆', label: 'Level', value: '3', color: '#FFB84D' },
  { icon: '🎯', label: 'Weekly Goal', value: '65%', color: '#4ADE80' },
]

const QUICK_ACCESS = [
  { icon: '🤖', label: 'AI Tutor', path: '/levels' },
  { icon: '✍️', label: 'Writing Practice', path: '/writing' },
  { icon: '🎤', label: 'Speech Practice', path: '/voice-practice' },
  { icon: '📚', label: 'Vocabulary Games', path: '/daily-practice' },
]

const ACHIEVEMENTS = [
  { icon: '🔥', label: 'First Steps', earned: true },
  { icon: '📚', label: 'Word Collector', earned: true },
  { icon: '🎯', label: 'Quick Learner', earned: true },
  { icon: '🎤', label: 'Fluent Speaker', earned: false },
  { icon: '📝', label: 'Writing Expert', earned: false },
  { icon: '⭐', label: 'Streak Master', earned: false },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [xpAnim, setXpAnim] = useState(false)

  useEffect(() => {
    setTimeout(() => setXpAnim(true), 300)
  }, [])

  return (
    <Layout>
      <div className="dashboard">
        {/* Stats Row */}
        <div className="stats-grid grid-24 grid-24-4">
          {STATS.map((stat, i) => (
            <div key={i} className="stat-card glass-card">
              <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
              <div className="stat-info">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Learning */}
        <div className="continue-card glass-card">
          <div className="continue-header">
            <h2 className="section-sub">Continue Learning</h2>
            <span className="level-badge">Level 3</span>
          </div>
          <div className="continue-content">
            <h3 className="continue-title">Letters of Tamil</h3>
            <p className="continue-desc">Master the basic vowels and consonants</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: xpAnim ? '65%' : '0%' }} />
            </div>
            <button className="btn-premium btn-primary" onClick={() => navigate('/levels')}>
              Continue Lesson →
            </button>
          </div>
        </div>

        {/* Daily Mission */}
        <div className="mission-card glass-card">
          <div className="mission-illustration">🎯</div>
          <div className="mission-info">
            <h3 className="mission-title">Daily Mission</h3>
            <p className="mission-desc">Complete 3 lessons to earn rewards</p>
            <div className="mission-progress">
              <span>2/3 completed</span>
              <span className="mission-xp">+150 XP</span>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="quick-grid grid-24 grid-24-4">
          {QUICK_ACCESS.map((item, i) => (
            <button key={i} className="quick-card glass-card" onClick={() => navigate(item.path)}>
              <span className="quick-icon">{item.icon}</span>
              <span className="quick-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Achievements */}
        <div className="achievements-section">
          <h2 className="section-sub">Achievements</h2>
          <div className="achievements-grid grid-24 grid-24-6">
            {ACHIEVEMENTS.map((ach, i) => (
              <div key={i} className={`ach-card glass-card ${ach.earned ? 'earned' : 'locked'}`}>
                <div className="ach-icon">{ach.icon}</div>
                <p className="ach-label">{ach.label}</p>
                {ach.earned && <div className="ach-badge">✓</div>}
                {!ach.earned && <div className="ach-lock">🔒</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
import React from 'react'
import Layout from '../components/Layout'
import './Achievements.css'

const ACHIEVEMENTS = [
  { icon: '👣', title: 'First Steps', desc: 'Complete your first lesson', earned: true },
  { icon: '📚', title: 'Word Collector', desc: 'Learn 50 words', earned: true },
  { icon: '⚡', title: 'Quick Learner', desc: 'Complete 5 lessons in a day', earned: true },
  { icon: '🎤', title: 'Fluent Speaker', desc: 'Master pronunciation', earned: false },
  { icon: '📝', title: 'Writing Expert', desc: 'Get 90% writing accuracy', earned: false },
  { icon: '🔥', title: 'Streak Master', desc: '7 day streak', earned: false },
  { icon: '🌟', title: 'Language Champion', desc: 'Complete all lessons', earned: false },
  { icon: '🎯', title: 'Perfect Score', desc: '100% on a quiz', earned: false },
  { icon: '🚀', title: 'Space Explorer', desc: 'Reach level 5', earned: false },
]

export default function Achievements() {
  return (
    <Layout>
      <div className="achievements">
        <h1 className="page-title">Achievements</h1>
        <p className="page-subtitle">Track your progress and unlock rewards</p>

        <div className="achievements-grid grid-24 grid-24-3">
          {ACHIEVEMENTS.map((ach, i) => (
            <div key={i} className={`ach-card glass-card ${ach.earned ? 'earned' : 'locked'}`}>
              <div className="ach-icon-wrapper">
                <span className="ach-icon">{ach.icon}</span>
                {ach.earned && <div className="ach-glow" />}
              </div>
              <h3 className="ach-title">{ach.title}</h3>
              <p className="ach-desc">{ach.desc}</p>
              {ach.earned && <span className="ach-badge">Earned! ✓</span>}
              {!ach.earned && <span className="ach-lock">🔒 Locked</span>}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
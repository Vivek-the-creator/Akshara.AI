import React from 'react'
import Layout from '../components/Layout'
import './LevelSelection.css'

const LEVELS = [
  { id: 1, title: 'Village of Letters', icon: '🏡', status: 'done', desc: 'Learn basic vowels and consonants' },
  { id: 2, title: 'Forest of Words', icon: '🌲', status: 'active', desc: 'Build simple words' },
  { id: 3, title: 'Temple of Sentences', icon: '🛕', status: 'locked', desc: 'Form sentences' },
  { id: 4, title: 'Kingdom of Stories', icon: '🏰', status: 'locked', desc: 'Read stories' },
  { id: 5, title: 'Galaxy of Fluency', icon: '🌌', status: 'locked', desc: 'Master fluency' },
]

export default function LevelSelection() {
  return (
    <Layout>
      <div className="level-selection">
        <h1 className="page-title">Learning Path</h1>
        <p className="page-subtitle">Your journey through language mastery</p>
        
        <div className="levels-journey">
          {LEVELS.map((level, i) => (
            <React.Fragment key={level.id}>
              <div className={`level-node level-${level.status}`}>
                <div className="level-icon">{level.icon}</div>
                <div className="level-content">
                  <h3 className="level-title">{level.title}</h3>
                  <p className="level-desc">{level.desc}</p>
                  {level.status === 'active' && (
                    <button className="btn-premium btn-primary">Continue →</button>
                  )}
                  {level.status === 'locked' && (
                    <span className="locked-text">🔒 Locked</span>
                  )}
                </div>
                {level.status === 'done' && <div className="check-badge">✓</div>}
                {level.status === 'active' && <div className="pulse-ring" />}
              </div>
              {i < LEVELS.length - 1 && <div className="level-connector" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Layout>
  )
}
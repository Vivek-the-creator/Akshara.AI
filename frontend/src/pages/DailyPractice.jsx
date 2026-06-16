import React from 'react'
import Layout from '../components/Layout'
import './DailyPractice.css'

const MINI_GAMES = [
  { icon: '🔤', title: 'Word Match', desc: 'Match words with images', xp: 50 },
  { icon: '✏️', title: 'Fill in the Blank', desc: 'Complete the sentences', xp: 75 },
  { icon: '🖼️', title: 'Picture Vocabulary', desc: 'Learn from pictures', xp: 40 },
  { icon: '🔠', title: 'Letter Builder', desc: 'Build letters with blocks', xp: 60 },
  { icon: '❓', title: 'Quiz Challenge', desc: 'Test your knowledge', xp: 100 },
  { icon: '🎭', title: 'Story Time', desc: 'Interactive stories', xp: 80 },
]

export default function DailyPractice() {
  return (
    <Layout>
      <div className="daily-practice">
        <h1 className="page-title">Daily Practice</h1>
        <p className="page-subtitle">Complete mini-games to earn XP and rewards</p>

        <div className="games-grid grid-24 grid-24-3">
          {MINI_GAMES.map((game, i) => (
            <div key={i} className="game-card glass-card">
              <div className="game-icon">{game.icon}</div>
              <h3 className="game-title">{game.title}</h3>
              <p className="game-desc">{game.desc}</p>
              <div className="game-footer">
                <span className="game-xp">🏆 {game.xp} XP</span>
                <button className="game-btn">Play →</button>
              </div>
            </div>
          ))}
        </div>

        <div className="streak-banner glass-card">
          <div className="streak-content">
            <span className="streak-icon">🔥</span>
            <div>
              <h3 className="streak-title">Daily Streak: 7 Days!</h3>
              <p className="streak-desc">Keep up the amazing work! Come back tomorrow for more rewards.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
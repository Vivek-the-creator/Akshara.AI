import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './VoicePractice.css'

const VoicePracticeLevels = () => {
  const [levels, setLevels] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchLevelsAndProgress()
  }, [])

  const fetchLevelsAndProgress = async () => {
    try {
      // Get levels
      const levelsResponse = await fetch('/api/voice-practice/levels')
      const levelsData = await levelsResponse.json()
      
      // Get user progress (assuming user ID is stored in localStorage)
      const userId = localStorage.getItem('userId') || 'demo_user'
      const progressResponse = await fetch(`/api/voice-practice/progress/${userId}`)
      const progressData = await progressResponse.json()
      
      setLevels(levelsData.levels)
      setProgress(progressData.progress || {})
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setLoading(false)
    }
  }

  const handleLevelClick = (level) => {
    const levelProgress = progress[level.id] || {}
    
    if (level.id === 'beginner' || levelProgress.level_unlocked) {
      navigate(`/voice-practice/${level.id}`)
    } else {
      // Show tooltip for locked levels
      alert('Complete previous level to unlock')
    }
  }

  const getLevelStatus = (levelId) => {
    const levelProgress = progress[levelId] || {}
    if (levelProgress.level_completed) return 'completed'
    if (levelProgress.level_unlocked) return 'unlocked'
    return 'locked'
  }

  const getCompletionPercentage = (levelId) => {
    const levelProgress = progress[levelId] || {}
    return levelProgress.completion_percentage || 0
  }

  if (loading) {
    return <div className="loading">Loading voice practice levels...</div>
  }

  return (
    <div className="voice-practice-container">
      <div className="header">
        <h1>🎤 Voice Practice</h1>
        <p>Learn Tamil pronunciation with interactive voice exercises</p>
      </div>

      <div className="levels-grid">
        {levels.map((level) => {
          const status = getLevelStatus(level.id)
          const completion = getCompletionPercentage(level.id)
          const isLocked = status === 'locked'
          
          return (
            <div
              key={level.id}
              className={`level-card ${status}`}
              onClick={() => handleLevelClick(level)}
            >
              <div className="level-header">
                <h3>{level.display_name}</h3>
                <div className="level-icon">
                  {isLocked ? '🔒' : status === 'completed' ? '✅' : '🎯'}
                </div>
              </div>
              
              <p className="level-description">{level.description}</p>
              
              <div className="level-stats">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <span className="progress-text">
                  {completion.toFixed(0)}% Complete
                </span>
              </div>
              
              <div className="level-items">
                <span>{level.total_items} exercises</span>
              </div>
              
              {isLocked && (
                <div className="lock-tooltip">
                  Complete previous level to unlock
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VoicePracticeLevels

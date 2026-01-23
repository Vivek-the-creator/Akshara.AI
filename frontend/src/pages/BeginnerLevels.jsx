import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { progressService } from '../services/progressService'
import audioService from '../utils/audioUtils'

const BeginnerLevels = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [audioLoading, setAudioLoading] = useState(null)

  // Tamil Uyir Ezhuthugal (vowels) - 12 letters
  const uyirEzhuthugal = [
    { letter: 'அ', pronunciation: 'ah', level: 1 },
    { letter: 'ஆ', pronunciation: 'aa', level: 2 },
    { letter: 'இ', pronunciation: 'i', level: 3 },
    { letter: 'ஈ', pronunciation: 'ii', level: 4 },
    { letter: 'உ', pronunciation: 'u', level: 5 },
    { letter: 'ஊ', pronunciation: 'uu', level: 6 },
    { letter: 'எ', pronunciation: 'e', level: 7 },
    { letter: 'ஏ', pronunciation: 'ee', level: 8 },
    { letter: 'ஐ', pronunciation: 'ai', level: 9 },
    { letter: 'ஒ', pronunciation: 'o', level: 10 },
    { letter: 'ஓ', pronunciation: 'oo', level: 11 },
    { letter: 'ஔ', pronunciation: 'au', level: 12 }
  ]

  useEffect(() => {
    // Load user progress
    const loadProgress = async () => {
      try {
        const progressData = await progressService.getUserProgress('Beginner', 'Uyir Ezhuthugal')
        setProgress(progressData)
      } catch (error) {
        console.error('Error loading progress:', error)
        // Continue with empty progress on error
      } finally {
        setLoading(false)
      }
    }
    loadProgress()
  }, [])

  const isLevelUnlocked = (level) => {
    if (level === 1) return true // First level is always unlocked
    
    // Check if previous level is completed
    const previousLevel = level - 1
    const previousProgress = progress.find(p => p.level_number === previousLevel)
    return previousProgress?.completed_at ? true : false
  }

  const getStarsForLevel = (level) => {
    const levelProgress = progress.find(p => p.level_number === level)
    return levelProgress?.stars_awarded || 0
  }

  const isLevelCompleted = (level) => {
    const levelProgress = progress.find(p => p.level_number === level)
    return levelProgress?.completed_at ? true : false
  }

  const handleLevelClick = (levelData) => {
    if (isLevelUnlocked(levelData.level)) {
      navigate(`/practice/beginner/uyir-ezhuthugal/${levelData.level}`)
    }
  }

  const playPronunciation = async (letter, event) => {
    event.stopPropagation()
    
    try {
      if (!audioService.isSupported()) {
        alert('Speech synthesis is not supported in your browser. Please try Chrome, Edge, or Safari.')
        return
      }
      
      setAudioLoading(letter)
      
      await audioService.pronounceLetter(letter, user?.learning_language || 'Tamil')
      
    } catch (error) {
      console.error('Error playing pronunciation:', error)
      alert('Unable to play pronunciation. Please check your browser settings.')
    } finally {
      setAudioLoading(null)
    }
  }

  return (
    <div>
      {loading ? (
        <div className="card">
          <div className="loading">Loading your progress...</div>
        </div>
      ) : (
        <>
          <div className="card">
            <h1>Beginner Stage</h1>
            <div style={{ marginBottom: '30px' }}>
              <button 
                onClick={() => navigate('/levels')}
                style={{
                  background: 'none',
                  border: '1px solid #ccc',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ← Back to Stages
              </button>
            </div>

            <div style={{ backgroundColor: '#e8f5e8', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#2d5a2d' }}>
                உயிர் எழுத்துக்கள் (Uyir Ezhuthugal)
              </h2>
              <p style={{ margin: '0', color: '#4a7c4a' }}>
                Learn the basic vowel sounds in Tamil. Master each letter to unlock the next one.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
              {uyirEzhuthugal.map((item) => {
                const isUnlocked = isLevelUnlocked(item.level)
                const stars = getStarsForLevel(item.level)
                const isCompleted = isLevelCompleted(item.level)

                return (
                  <div
                    key={item.level}
                    onClick={() => handleLevelClick(item)}
                    style={{
                      padding: '25px 15px',
                      borderRadius: '12px',
                      backgroundColor: isUnlocked ? '#ffffff' : '#f8f9fa',
                      border: isUnlocked 
                        ? (isCompleted ? '2px solid #28a745' : '2px solid #007bff') 
                        : '2px solid #dee2e6',
                      cursor: isUnlocked ? 'pointer' : 'not-allowed',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      opacity: isUnlocked ? 1 : 0.6,
                      position: 'relative',
                      minHeight: '180px'
                    }}
                    onMouseEnter={(e) => {
                      if (isUnlocked) {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isUnlocked) {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {/* Level Number */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {item.level}
                    </div>

                    {/* Lock Icon for locked levels */}
                    {!isUnlocked && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        fontSize: '20px'
                      }}>
                        🔒
                      </div>
                    )}

                    {/* Letter Display */}
                    <div style={{ 
                      fontSize: '48px', 
                      fontWeight: 'bold', 
                      margin: '20px 0 10px 0',
                      color: isUnlocked ? '#2d5a2d' : '#999'
                    }}>
                      {item.letter}
                    </div>

                    {/* Pronunciation Button */}
                    {isUnlocked && (
                      <button
                        onClick={(e) => playPronunciation(item.letter, e)}
                        disabled={audioLoading === item.letter}
                        style={{
                          background: 'none',
                          border: '1px solid #007bff',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          cursor: audioLoading === item.letter ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 10px auto',
                          transition: 'all 0.3s ease',
                          opacity: audioLoading === item.letter ? 0.6 : 1,
                          backgroundColor: audioLoading === item.letter ? '#f0f0f0' : 'transparent'
                        }}
                        title={`Pronounce: ${item.pronunciation}`}
                      >
                        {audioLoading === item.letter ? '⏳' : '🔊'}
                      </button>
                    )}

                    {/* Stars Display */}
                    <div style={{ marginBottom: '10px' }}>
                      {[1, 2, 3].map((star) => (
                        <span 
                          key={star} 
                          style={{ 
                            fontSize: '16px', 
                            color: star <= stars ? '#ffc107' : '#ddd',
                            margin: '0 1px'
                          }}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>

                    {/* Status */}
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: isCompleted ? '#28a745' : (isUnlocked ? '#007bff' : '#6c757d')
                    }}>
                      {isCompleted ? 'COMPLETED' : (isUnlocked ? 'START' : 'LOCKED')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <h2>Your Progress</h2>
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Levels Completed</h4>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                    {progress.filter(p => p.completed_at).length} / {uyirEzhuthugal.length}
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Total Stars Earned</h4>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                    {progress.reduce((sum, p) => sum + (p.stars_awarded || 0), 0)}
                  </p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Current Level</h4>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                    {progress.filter(p => p.completed_at).length + 1}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default BeginnerLevels

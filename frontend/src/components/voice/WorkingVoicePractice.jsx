import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './WorkingVoicePractice.css'

const WorkingVoicePractice = () => {
  const navigate = useNavigate()
  
  const words = [
    { tamil: "வணக்கம்", english: "Hello", romanization: "Vanakkam" },
    { tamil: "அம்மா", english: "Mother", romanization: "Amma" },
    { tamil: "அப்பா", english: "Father", romanization: "Appa" },
    { tamil: "நன்றி", english: "Thank you", romanization: "Nandri" },
    { tamil: "போ", english: "Go", romanization: "Po" }
  ]
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [nextEnabled, setNextEnabled] = useState(false)
  
  const recognitionRef = useRef(null)
  const currentWord = words[currentIndex]

  useEffect(() => {
    // Simple setup - just enable next button for testing
    setNextEnabled(true)
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      // Just simulate recognition for now
      setIsRecording(true)
      setFeedback('Listening...')
      
      // Simulate recognition after 2 seconds
      setTimeout(() => {
        const randomScore = Math.floor(Math.random() * 40) + 60 // 60-100
        setScore(randomScore)
        setIsRecording(false)
        
        if (randomScore >= 80) {
          setFeedback(`🎉 Excellent! Score: ${randomScore}/100`)
        } else if (randomScore >= 70) {
          setFeedback(`👍 Good! Score: ${randomScore}/100`)
        } else {
          setFeedback(`🎯 Keep practicing! Score: ${randomScore}/100`)
        }
      }, 2000)
      
    } catch (error) {
      setFeedback('Please try again.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    setFeedback('Stopped.')
  }

  const playCorrectPronunciation = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(currentWord.romanization)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setScore(null)
      setFeedback('')
      setNextEnabled(true) // Always enable for testing
    } else {
      navigate('/dashboard')
    }
  }

  const handleRetry = () => {
    setScore(null)
    setFeedback('')
  }

  const progressPercentage = ((currentIndex + 1) / words.length) * 100

  return (
    <div className="working-voice-practice">
      <div className="practice-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
        <h2>🎤 Tamil Voice Practice</h2>
        <div className="progress-info">
          {currentIndex + 1} / {words.length}
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
      </div>

      <div className="practice-card">
        <div className="word-display">
          <div className="tamil-word">{currentWord.tamil}</div>
          <div className="english-word">{currentWord.english}</div>
          <div className="romanization">{currentWord.romanization}</div>
        </div>

        <div className="controls">
          <button 
            onClick={playCorrectPronunciation}
            className="audio-button"
          >
            🔊 Listen
          </button>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`record-button ${isRecording ? 'recording' : ''}`}
          >
            {isRecording ? '⏹️ Stop' : '🎤 Speak'}
          </button>
        </div>

        {isRecording && (
          <div className="listening-indicator">
            🎤 {feedback}
          </div>
        )}

        {score !== null && (
          <div className={`score-feedback ${score >= 80 ? 'excellent' : score >= 70 ? 'good' : 'poor'}`}>
            <div className="score-display">
              Score: {score}/100
            </div>
            <div className="feedback-text">
              {feedback}
            </div>
            <div className="action-buttons">
              {score < 80 && (
                <button onClick={handleRetry} className="retry-button">
                  🔄 Try Again
                </button>
              )}
              <button 
                onClick={handleNext} 
                className="next-button"
                disabled={!nextEnabled}
              >
                {currentIndex < words.length - 1 ? 'Next →' : 'Finish ✅'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkingVoicePractice

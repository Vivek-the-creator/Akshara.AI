import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './VoicePractice.css'

const VoicePracticeSession = () => {
  const { level } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [completedWords, setCompletedWords] = useState(new Set())
  
  const recognitionRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    fetchContent()
    setupSpeechRecognition()
  }, [level])

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/voice-practice/content/${level}`)
      const data = await response.json()
      setContent(data.content)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch content:', error)
      setLoading(false)
    }
  }

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'ta-IN' // Tamil language
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        const confidence = event.results[0][0].confidence
        
        handleSpeechResult(transcript, confidence)
      }
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setFeedback('Sorry, I couldn\'t understand. Please try again.')
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
        setIsRecording(false)
      }
    } else {
      console.warn('Speech recognition not supported')
    }
  }

  const handleSpeechResult = (transcript, confidence) => {
    const currentWord = content[currentIndex]
    if (!currentWord) return
    
    // Calculate pronunciation accuracy
    const accuracy = calculatePronunciationAccuracy(
      currentWord.tamil_text,
      transcript
    )
    
    const finalScore = (accuracy * 0.7 + confidence * 100 * 0.3) // Weighted score
    
    setScore(Math.round(finalScore))
    setCompletedWords(prev => new Set(prev).add(currentIndex))
    
    // Provide feedback
    if (finalScore >= 85) {
      setFeedback('🎉 Excellent pronunciation!')
    } else if (finalScore >= 70) {
      setFeedback('👍 Good pronunciation! Keep practicing.')
    } else {
      setFeedback('🎯 Try again. Listen carefully and repeat.')
    }
    
    // Save attempt to backend
    saveAttempt(currentWord, transcript, finalScore)
  }

  const calculatePronunciationAccuracy = (expected, spoken) => {
    // Simple Levenshtein distance-based similarity
    const expectedLower = expected.toLowerCase().trim()
    const spokenLower = spoken.toLowerCase().trim()
    
    if (expectedLower === spokenLower) return 100
    
    const distance = levenshteinDistance(expectedLower, spokenLower)
    const maxLength = Math.max(expectedLower.length, spokenLower.length)
    
    return Math.max(0, ((maxLength - distance) / maxLength) * 100)
  }

  const levenshteinDistance = (str1, str2) => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  const saveAttempt = async (word, spoken, finalScore) => {
    try {
      const userId = localStorage.getItem('userId') || 'demo_user'
      
      await fetch('/api/voice-practice/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          content_id: word.id,
          level: level,
          spoken_text: spoken,
          confidence_score: 80, // Placeholder
          pronunciation_accuracy: finalScore,
          completed: finalScore >= 80
        })
      })
    } catch (error) {
      console.error('Failed to save attempt:', error)
    }
  }

  const playAudio = () => {
    const currentWord = content[currentIndex]
    if (!currentWord) return
    
    // Use Web Speech API for TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.tamil_text)
      utterance.lang = 'ta-IN'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const startRecording = () => {
    if (!recognitionRef.current) {
      setFeedback('Speech recognition is not supported in your browser')
      return
    }
    
    setIsRecording(true)
    setIsListening(true)
    setScore(null)
    setFeedback('')
    
    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Failed to start recognition:', error)
      setIsRecording(false)
      setIsListening(false)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const nextWord = () => {
    if (currentIndex < content.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setScore(null)
      setFeedback('')
    } else {
      // Level completed
      navigate('/voice-practice')
    }
  }

  const retryWord = () => {
    setScore(null)
    setFeedback('')
  }

  if (loading) {
    return <div className="loading">Loading practice content...</div>
  }

  if (content.length === 0) {
    return <div className="error">No content available for this level.</div>
  }

  const currentWord = content[currentIndex]
  const progress = ((currentIndex + 1) / content.length) * 100

  return (
    <div className="voice-practice-session">
      <div className="session-header">
        <button onClick={() => navigate('/voice-practice')} className="back-button">
          ← Back to Levels
        </button>
        <h2>{level.charAt(0).toUpperCase() + level.slice(1)} Level</h2>
        <div className="progress-indicator">
          {currentIndex + 1} / {content.length}
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="practice-card">
        <div className="word-display">
          <div className="tamil-text">{currentWord.tamil_text}</div>
          <div className="english-translation">{currentWord.english_translation}</div>
          <div className="romanization">{currentWord.romanization}</div>
        </div>

        <div className="controls">
          <button 
            onClick={playAudio}
            className="audio-button"
            title="Listen to pronunciation"
          >
            🔊 Listen
          </button>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`record-button ${isRecording ? 'recording' : ''}`}
            disabled={isListening}
          >
            {isRecording ? '⏹️ Stop' : '🎤 Speak'}
          </button>
        </div>

        {isListening && (
          <div className="listening-indicator">
            🎤 Listening... Speak clearly in Tamil
          </div>
        )}

        {score !== null && (
          <div className={`score-feedback ${score >= 85 ? 'excellent' : score >= 70 ? 'good' : 'poor'}`}>
            <div className="score-display">
              Score: {score}/100
            </div>
            <div className="feedback-text">
              {feedback}
            </div>
            <div className="action-buttons">
              {score < 80 && (
                <button onClick={retryWord} className="retry-button">
                  🔄 Try Again
                </button>
              )}
              <button onClick={nextWord} className="next-button">
                {currentIndex < content.length - 1 ? 'Next →' : 'Complete Level ✅'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VoicePracticeSession

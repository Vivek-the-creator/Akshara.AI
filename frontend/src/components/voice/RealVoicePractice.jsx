import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './RealVoicePractice.css'

const RealVoicePractice = () => {
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
  const [recognitionError, setRecognitionError] = useState('')
  
  const recognitionRef = useRef(null)
  const currentWord = words[currentIndex]

  useEffect(() => {
    setupSpeechRecognition()
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition not supported. Please use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    
    // SIMPLE CONFIG - English only for reliability
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsRecording(true)
      setRecognitionError('')
      setFeedback('Listening... Say the word clearly')
    }

    recognition.onresult = (event) => {
      const result = event.results[0][0]
      const transcript = result.transcript.toLowerCase().trim()
      const confidence = result.confidence
      
      console.log('Recognized:', transcript, 'Confidence:', confidence)
      
      // Check if recognized word matches expected
      const expected = currentWord.romanization.toLowerCase()
      const similarity = calculateSimilarity(expected, transcript)
      const finalScore = Math.round(similarity * confidence * 100)
      
      setScore(finalScore)
      
      if (finalScore >= 80) {
        setFeedback(`🎉 Excellent! Score: ${finalScore}/100`)
      } else if (finalScore >= 60) {
        setFeedback(`👍 Good! Score: ${finalScore}/100`)
      } else {
        setFeedback(`🎯 Keep practicing! Score: ${finalScore}/100`)
      }
      
      setRecognitionError('')
    }

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error)
      setIsRecording(false)
      
      if (event.error === 'no-speech') {
        setRecognitionError('No speech detected. Please speak louder.')
        setFeedback('Try speaking clearly into the microphone.')
      } else if (event.error === 'not-allowed') {
        setRecognitionError('Microphone permission denied.')
        setFeedback('Please allow microphone access.')
      } else {
        setRecognitionError('Speech recognition failed.')
        setFeedback('Please try again.')
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
      setNextEnabled(true)
    }

    recognitionRef.current = recognition
  }

  const calculateSimilarity = (str1, str2) => {
    // Simple similarity check
    if (str1 === str2) return 1.0
    
    // Check if contains the expected word
    if (str1.includes(str2) || str2.includes(str1)) return 0.8
    
    // Levenshtein distance for partial matches
    const distance = levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)
    return maxLength === 0 ? 0 : (maxLength - distance) / maxLength
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

  const startRecording = async () => {
    if (!recognitionRef.current) {
      setRecognitionError('Recognition not ready. Please refresh.')
      return
    }

    // Reset state
    setScore(null)
    setFeedback('')
    setNextEnabled(false)
    setRecognitionError('')
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Start recognition
      recognitionRef.current.start()
      
    } catch (error) {
      setRecognitionError('Microphone access denied.')
      setFeedback('Please allow microphone access.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
  }

  const playCorrectPronunciation = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(currentWord.romanization)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setScore(null)
      setFeedback('')
      setNextEnabled(false)
      setRecognitionError('')
    } else {
      navigate('/dashboard')
    }
  }

  const handleRetry = () => {
    setScore(null)
    setFeedback('')
    setNextEnabled(false)
    setRecognitionError('')
  }

  const progressPercentage = ((currentIndex + 1) / words.length) * 100

  return (
    <div className="real-voice-practice">
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
            disabled={isRecording}
          >
            {isRecording ? '⏹️ Stop' : '🎤 Speak'}
          </button>
        </div>

        {isRecording && (
          <div className="listening-indicator">
            🎤 {feedback}
          </div>
        )}

        {recognitionError && (
          <div className="error-message">
            ❌ {recognitionError}
          </div>
        )}

        {score !== null && (
          <div className={`score-feedback ${score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'poor'}`}>
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

export default RealVoicePractice

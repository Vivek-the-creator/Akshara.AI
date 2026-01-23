import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './SimpleVoicePractice.css'

const SimpleVoicePractice = () => {
  const navigate = useNavigate()
  
  // Tamil words data
  const words = [
    { tamil: "வணக்கம்", english: "Hello", romanization: "Vanakkam" },
    { tamil: "அம்மா", english: "Mother", romanization: "Amma" },
    { tamil: "அப்பா", english: "Father", romanization: "Appa" },
    { tamil: "நன்றி", english: "Thank you", romanization: "Nandri" },
    { tamil: "போ", english: "Go", romanization: "Po" }
  ]
  
  // State management
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [nextEnabled, setNextEnabled] = useState(false)
  const [recognitionError, setRecognitionError] = useState('')
  
  // Refs
  const recognitionRef = useRef(null)
  const currentWord = words[currentIndex]

  useEffect(() => {
    setupSpeechRecognition()
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not supported. Please use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    
    // Try English first, then fallback to Tamil
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"  // Start with English
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setIsListening(true)
      setRecognitionError('')
      setFeedback('Listening...')
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal && result[0]) {
          if (result[0].confidence > maxConfidence) {
            maxConfidence = result[0].confidence
            finalTranscript = result[0].transcript
          }
        }
      }

      if (finalTranscript) {
        processSpeechResult(finalTranscript, maxConfidence)
      }
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      setIsRecording(false)
      
      if (event.error === 'no-speech') {
        // Try Tamil as fallback
        tryTamilRecognition()
      } else if (event.error === 'not-allowed') {
        setRecognitionError('Please allow microphone access.')
        setFeedback('Microphone permission denied.')
      } else {
        setRecognitionError('Speech recognition failed. Please try again.')
        setFeedback('Please try again.')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setIsRecording(false)
      setNextEnabled(true)
    }

    recognitionRef.current = recognition
  }

  const tryTamilRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const tamilRecognition = new SpeechRecognition()
    
    tamilRecognition.continuous = false
    tamilRecognition.interimResults = true
    tamilRecognition.lang = "ta-IN"
    tamilRecognition.maxAlternatives = 3

    tamilRecognition.onstart = () => {
      setIsListening(true)
      setFeedback('Trying Tamil recognition...')
    }

    tamilRecognition.onresult = (event) => {
      let finalTranscript = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal && result[0]) {
          if (result[0].confidence > maxConfidence) {
            maxConfidence = result[0].confidence
            finalTranscript = result[0].transcript
          }
        }
      }

      if (finalTranscript) {
        processSpeechResult(finalTranscript, maxConfidence)
      }
    }

    tamilRecognition.onerror = (event) => {
      setIsListening(false)
      setIsRecording(false)
      setRecognitionError('Could not recognize speech. Please try again.')
      setFeedback('Please speak clearly and try again.')
    }

    tamilRecognition.onend = () => {
      setIsListening(false)
      setIsRecording(false)
      setNextEnabled(true)
    }

    try {
      tamilRecognition.start()
    } catch (error) {
      setIsListening(false)
      setIsRecording(false)
      setRecognitionError('Recognition failed. Please try again.')
      setFeedback('Please try again.')
    }
  }

  const processSpeechResult = (transcript, confidence) => {
    const normalizedTranscript = transcript.toLowerCase().trim()
    const expectedRomanization = currentWord.romanization.toLowerCase().trim()
    
    // Calculate similarity
    const similarity = calculateSimilarity(expectedRomanization, normalizedTranscript)
    const finalScore = Math.round(similarity * Math.max(confidence, 0.5) * 100)
    
    setScore(finalScore)
    
    // Feedback
    if (finalScore >= 80) {
      setFeedback(`🎉 Excellent! Score: ${finalScore}/100`)
    } else if (finalScore >= 60) {
      setFeedback(`👍 Good! Score: ${finalScore}/100`)
    } else if (finalScore >= 40) {
      setFeedback(`😊 Nice try! Score: ${finalScore}/100`)
    } else {
      setFeedback(`🎯 Keep practicing! Score: ${finalScore}/100`)
    }
    
    setRecognitionError('')
  }

  const calculateSimilarity = (str1, str2) => {
    const distance = levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength
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
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Start with English recognition
      recognitionRef.current.lang = "en-US"
      recognitionRef.current.start()
      setIsRecording(true)
      
    } catch (error) {
      setRecognitionError('Microphone access denied.')
      setFeedback('Please allow microphone access.')
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        // Ignore stop errors
      }
    }
    setIsRecording(false)
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
    <div className="simple-voice-practice">
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
            title="Listen to correct pronunciation"
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
            🎤 {feedback}
          </div>
        )}

        {recognitionError && (
          <div className="error-message">
            ❌ {recognitionError}
          </div>
        )}

        {score !== null && (
          <div className={`score-feedback ${score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'}`}>
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

export default SimpleVoicePractice

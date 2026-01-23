import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './ReliableVoicePractice.css'

const ReliableVoicePractice = () => {
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
  
  // Speech recognition ref
  const recognitionRef = useRef(null)
  const currentWord = words[currentIndex]

  // STEP 1: SPEECH RECOGNITION SETUP
  useEffect(() => {
    setupSpeechRecognition()
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  const setupSpeechRecognition = () => {
    console.log('🎤 Setting up Speech Recognition...')
    
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    // Create recognition instance
    const recognition = new SpeechRecognition()
    
    // Configure recognition
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'ta-IN' // Tamil language
    recognition.maxAlternatives = 1

    // Event handlers
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started')
      setIsListening(true)
      setRecognitionError('')
      setFeedback('Listening... Speak clearly!')
    }

    recognition.onresult = (event) => {
      console.log('🎤 Speech recognition result:', event)
      const result = event.results[0][0]
      const transcript = result.transcript
      const confidence = result.confidence
      
      console.log('🎤 Recognized:', transcript)
      console.log('🎤 Confidence:', confidence)
      
      // Process the result
      processSpeechResult(transcript, confidence)
    }

    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error)
      setIsListening(false)
      setIsRecording(false)
      
      let errorMessage = ''
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking louder and clearer.'
          break
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access and try again.'
          break
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.'
          break
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed. Please try again.'
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}. Please try again.`
      }
      
      setRecognitionError(errorMessage)
      setFeedback(errorMessage)
    }

    recognition.onend = () => {
      console.log('🎤 Speech recognition ended')
      setIsListening(false)
      setIsRecording(false)
      setNextEnabled(true) // Enable next button after recognition completes
    }

    recognitionRef.current = recognition
    console.log('✅ Speech recognition setup complete')
  }

  // STEP 3: PRONUNCIATION SCORING
  const processSpeechResult = (transcript, confidence) => {
    console.log('🎯 Processing speech result...')
    console.log('🎯 Expected:', currentWord.tamil)
    console.log('🎯 Recognized:', transcript)
    
    // Normalize texts
    const expected = currentWord.tamil.toLowerCase().trim()
    const recognized = transcript.toLowerCase().trim()
    
    // Calculate similarity using Levenshtein distance
    const similarity = calculateSimilarity(expected, recognized)
    const finalScore = Math.round(similarity * confidence * 100)
    
    console.log('🎯 Similarity:', similarity)
    console.log('🎯 Final Score:', finalScore)
    
    setScore(finalScore)
    
    // STEP 3: VISUAL FEEDBACK
    let feedbackMessage = ''
    let feedbackClass = ''
    
    if (finalScore >= 80) {
      feedbackMessage = `🎉 Excellent! Score: ${finalScore}/100`
      feedbackClass = 'excellent'
    } else if (finalScore >= 50) {
      feedbackMessage = `👍 Good! Score: ${finalScore}/100`
      feedbackClass = 'good'
    } else {
      feedbackMessage = `🎯 Try again! Score: ${finalScore}/100`
      feedbackClass = 'poor'
    }
    
    setFeedback(feedbackMessage)
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

  // Control functions
  const startRecording = async () => {
    console.log('🎤 Starting recording...')
    
    if (!recognitionRef.current) {
      setRecognitionError('Speech recognition not initialized. Please refresh the page.')
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
      console.log('✅ Microphone permission granted')
      
      // Start recognition
      recognitionRef.current.start()
      setIsRecording(true)
      
    } catch (error) {
      console.error('❌ Microphone permission error:', error)
      setRecognitionError('Microphone access denied. Please allow microphone permissions in your browser.')
      setFeedback('Please allow microphone access to use voice practice.')
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const playCorrectPronunciation = () => {
    console.log('🔊 Playing correct pronunciation...')
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(currentWord.romanization)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onstart = () => console.log('🔊 Playing:', currentWord.romanization)
      utterance.onend = () => console.log('🔊 Audio finished')
      utterance.onerror = (event) => console.error('❌ Audio error:', event.error)
      
      window.speechSynthesis.speak(utterance)
    } else {
      setFeedback('Audio not supported in your browser')
    }
  }

  // STEP 4: NEXT BUTTON LOGIC
  const handleNext = () => {
    console.log('➡️ Moving to next word...')
    
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setScore(null)
      setFeedback('')
      setNextEnabled(false)
      setRecognitionError('')
    } else {
      // Practice completed
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
    <div className="reliable-voice-practice">
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
            🎤 Listening... Speak clearly in Tamil
          </div>
        )}

        {recognitionError && (
          <div className="error-message">
            ❌ {recognitionError}
          </div>
        )}

        {score !== null && (
          <div className={`score-feedback ${score >= 80 ? 'excellent' : score >= 50 ? 'good' : 'poor'}`}>
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

export default ReliableVoicePractice

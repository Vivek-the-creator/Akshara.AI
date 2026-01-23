import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './WorkingRealVoice.css'

const WorkingRealVoice = () => {
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
      setRecognitionError('Speech recognition not supported. Please use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    
    // Simple, reliable configuration
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('Recognition started')
      setIsRecording(true)
      setRecognitionError('')
      setFeedback('Listening... Say the word clearly')
    }

    recognition.onresult = (event) => {
      console.log('Recognition result:', event)
      
      try {
        const result = event.results[0][0]
        const transcript = result.transcript.toLowerCase().trim()
        const confidence = result.confidence || 0.5
        
        console.log('Recognized:', transcript, 'Confidence:', confidence)
        
        // Simple matching - check if transcript contains expected word
        const expected = currentWord.romanization.toLowerCase()
        let similarity = 0
        
        if (transcript === expected) {
          similarity = 1.0
        } else if (transcript.includes(expected)) {
          similarity = 0.8
        } else if (expected.includes(transcript)) {
          similarity = 0.7
        } else {
          // Simple character matching for partial credit
          const matches = transcript.split('').filter(char => expected.includes(char)).length
          similarity = matches / Math.max(transcript.length, expected.length)
        }
        
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
      } catch (error) {
        console.error('Error processing result:', error)
        setRecognitionError('Error processing speech. Please try again.')
        setFeedback('Please try again.')
      }
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
      } else if (event.error === 'network') {
        setRecognitionError('Network error. Please check internet connection.')
        setFeedback('Network error. Please try again.')
      } else {
        setRecognitionError(`Speech recognition error: ${event.error}`)
        setFeedback('Please try again.')
      }
    }

    recognition.onend = () => {
      console.log('Recognition ended')
      setIsRecording(false)
      setNextEnabled(true)
    }

    recognitionRef.current = recognition
  }

  const startRecording = async () => {
    console.log('Starting recording...')
    
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
      console.log('Microphone permission granted')
      
      // Start recognition
      recognitionRef.current.start()
      console.log('Recognition started')
      
    } catch (error) {
      console.error('Microphone error:', error)
      setRecognitionError('Microphone access denied.')
      setFeedback('Please allow microphone access.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    console.log('Stop recording requested')
    
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop()
        console.log('Recognition stopped manually')
      } catch (error) {
        console.error('Error stopping recognition:', error)
      }
    }
    
    setIsRecording(false)
    setFeedback('Recording stopped.')
  }

  const playCorrectPronunciation = () => {
    console.log('Playing pronunciation:', currentWord.romanization)
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(currentWord.romanization)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onstart = () => console.log('Audio started')
      utterance.onend = () => console.log('Audio ended')
      utterance.onerror = (event) => console.error('Audio error:', event.error)
      
      window.speechSynthesis.speak(utterance)
    } else {
      setFeedback('Audio not supported in your browser')
    }
  }

  const handleNext = () => {
    console.log('Moving to next word')
    
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
    console.log('Retrying word')
    setScore(null)
    setFeedback('')
    setNextEnabled(false)
    setRecognitionError('')
  }

  const progressPercentage = ((currentIndex + 1) / words.length) * 100

  return (
    <div className="working-real-voice">
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
            disabled={isRecording && !isRecording}
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

export default WorkingRealVoice

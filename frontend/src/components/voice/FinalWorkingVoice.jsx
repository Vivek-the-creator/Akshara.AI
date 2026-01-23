import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './WorkingRealVoice.css'

const FinalWorkingVoice = () => {
  const navigate = useNavigate()
  
  const words = [
    { tamil: "அம்மா", english: "Mother", romanization: "Amma" },
    { tamil: "வணக்கம்", english: "Hello", romanization: "Vanakkam" },
    { tamil: "அப்பா", english: "Father", romanization: "Appa" },
    { tamil: "நன்றி", english: "Thank you", romanization: "Nandri" },
    { tamil: "போ", english: "Go", romanization: "Po" }
  ]
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [nextEnabled, setNextEnabled] = useState(false)
  const [recognitionError, setRecognitionError] = useState('')
  
  const recognitionRef = useRef(null)
  const audioTimeoutRef = useRef(null)
  const currentWord = words[currentIndex]

  useEffect(() => {
    setupSpeechRecognition()
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current = null
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current)
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
      setIsProcessing(true)
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
        
        // Simple matching
        const expected = currentWord.romanization.toLowerCase()
        let similarity = 0
        
        if (transcript === expected) {
          similarity = 1.0
        } else if (transcript.includes(expected)) {
          similarity = 0.8
        } else if (expected.includes(transcript)) {
          similarity = 0.7
        } else {
          // Simple character matching
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
      setIsProcessing(false)
      
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
      setIsProcessing(false)
      setNextEnabled(true)
    }

    recognitionRef.current = recognition
  }

  const startRecording = async () => {
    console.log('Starting recording...')
    
    // Prevent multiple starts
    if (isRecording || isProcessing) {
      console.log('Already recording or processing')
      return
    }
    
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
      setIsProcessing(false)
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
    setIsProcessing(false)
    setFeedback('Recording stopped.')
  }

  const playCorrectPronunciation = () => {
    // Prevent multiple rapid clicks
    if (isPlaying) {
      console.log('Audio already playing, ignoring click')
      return
    }
    
    console.log('Playing pronunciation:', currentWord.romanization)
    setIsPlaying(true)
    
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech first
      window.speechSynthesis.cancel()
      
      // Clear any existing timeout
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current)
      }
      
      // Wait a moment before starting new speech
      audioTimeoutRef.current = setTimeout(() => {
        // Special pronunciation for அம்மா
        if (currentWord.tamil === "அம்மா") {
          // Break it into two parts: "am" + "maa"
          const utterance1 = new SpeechSynthesisUtterance("am")
          utterance1.lang = 'en-US'
          utterance1.rate = 1.0  // Increased from 0.9 for maximum speed
          utterance1.pitch = 1.0
          utterance1.volume = 1.0
          
          utterance1.onstart = () => {
            console.log('Audio started for: am')
          }
          
          utterance1.onend = () => {
            console.log('First part ended, starting second part')
            
            // Small pause between syllables
            setTimeout(() => {
              const utterance2 = new SpeechSynthesisUtterance("maa")
              utterance2.lang = 'en-US'
              utterance2.rate = 0.9  // Increased from 0.8 for maximum speed
              utterance2.pitch = 1.0
              utterance2.volume = 1.0
              
              utterance2.onstart = () => {
                console.log('Audio started for: maa')
              }
              
              utterance2.onend = () => {
                console.log('Audio ended for: maa')
                setIsPlaying(false)
              }
              
              utterance2.onerror = (event) => {
                console.error('Audio error (part 2):', event.error)
                setIsPlaying(false)
                if (event.error !== 'interrupted') {
                  setFeedback('Audio playback failed. Please try again.')
                }
              }
              
              try {
                window.speechSynthesis.speak(utterance2)
              } catch (error) {
                console.error('Speech synthesis error (part 2):', error)
                setIsPlaying(false)
                setFeedback('Audio playback failed. Please try again.')
              }
            }, 50) // Reduced from 100ms pause between "am" and "maa" for minimal gap
          }
          
          utterance1.onerror = (event) => {
            console.error('Audio error (part 1):', event.error)
            setIsPlaying(false)
            if (event.error !== 'interrupted') {
              setFeedback('Audio playback failed. Please try again.')
            }
          }
          
          try {
            window.speechSynthesis.speak(utterance1)
          } catch (error) {
            console.error('Speech synthesis error (part 1):', error)
            setIsPlaying(false)
            setFeedback('Audio playback failed. Please try again.')
          }
          
        } else {
          // Normal pronunciation for other words
          const utterance = new SpeechSynthesisUtterance(currentWord.romanization)
          utterance.lang = 'en-US'
          utterance.rate = 0.8
          utterance.pitch = 1.0
          utterance.volume = 1.0
          
          utterance.onstart = () => {
            console.log('Audio started for:', currentWord.romanization)
          }
          
          utterance.onend = () => {
            console.log('Audio ended for:', currentWord.romanization)
            setIsPlaying(false)
          }
          
          utterance.onerror = (event) => {
            console.error('Audio error:', event.error)
            setIsPlaying(false)
            // Don't show error to user for interruption
            if (event.error !== 'interrupted') {
              setFeedback('Audio playback failed. Please try again.')
            }
          }
          
          try {
            window.speechSynthesis.speak(utterance)
          } catch (error) {
            console.error('Speech synthesis error:', error)
            setIsPlaying(false)
            setFeedback('Audio playback failed. Please try again.')
          }
        }
      }, 100) // Small delay to ensure cancellation completes
      
    } else {
      setIsPlaying(false)
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
      setIsProcessing(false)
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
    setIsProcessing(false)
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
          
          {/* Pronunciation Guide */}
          {currentWord.tamil === "அம்மா" && (
            <div className="pronunciation-guide">
              <div className="pronunciation-title">How to pronounce:</div>
              <div className="pronunciation-text">
                Pronounce it as: <strong>"am–maa"</strong>
              </div>
              <div className="pronunciation-breakdown">
                <div className="breakdown-item">
                  <span className="tamil-part">அம் (am)</span>
                  <span className="english-part">→ short "a" like in "umbrella"</span>
                </div>
                <div className="breakdown-item">
                  <span className="tamil-part">மா (maa)</span>
                  <span className="english-part">→ long "maa" (hold the sound slightly)</span>
                </div>
                <div className="pronunciation-tip">
                  👉 Say it slowly: am + maa → amma
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="controls">
          <button 
            onClick={playCorrectPronunciation}
            className="audio-button"
            disabled={isPlaying}
          >
            {isPlaying ? '🔊 Playing...' : '🔊 Listen'}
          </button>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`record-button ${isRecording ? 'recording' : ''}`}
            disabled={isRecording || isProcessing}
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

export default FinalWorkingVoice

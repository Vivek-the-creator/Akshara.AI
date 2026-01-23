import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './PerfectSpeechRecognition.css'

const PerfectSpeechRecognition = () => {
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
  const [isListening, setIsListening] = useState(false)
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [nextEnabled, setNextEnabled] = useState(false)
  const [recognitionError, setRecognitionError] = useState('')
  const [hasReceivedSound, setHasReceivedSound] = useState(false)
  
  const recognitionRef = useRef(null)
  const listeningTimeoutRef = useRef(null)
  const currentWord = words[currentIndex]

  // STEP 1: REBUILD SPEECH LOGIC FROM SCRATCH
  useEffect(() => {
    setupSpeechRecognition()
    return () => {
      cleanupRecognition()
    }
  }, [])

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition not supported. Please use Chrome.')
      return
    }

    // Create fresh recognition instance
    const recognition = new SpeechRecognition()
    
    // STEP 2: CORRECT CONFIGURATION (MANDATORY)
    recognition.continuous = false  // Single recognition session
    recognition.interimResults = true  // Capture short words before they end
    recognition.lang = "ta-IN"  // Tamil language for better recognition
    recognition.maxAlternatives = 5  // More alternatives for better accuracy

    // STEP 6: DEBUG VISIBILITY
    recognition.onstart = () => {
      console.log('🎤 recognition.onstart - Recognition started')
      setIsListening(true)
      setIsRecording(true)
      setRecognitionError('')
      setFeedback('Listening... Speak clearly in Tamil')
      setHasReceivedSound(false)
    }

    recognition.onspeechstart = () => {
      console.log('🔊 recognition.onspeechstart - Speech detected')
      setHasReceivedSound(true)
      setFeedback('Speech detected... Processing...')
    }

    recognition.onsoundstart = () => {
      console.log('🎵 recognition.onsoundstart - Sound detected')
      setHasReceivedSound(true)
    }

    recognition.onsoundend = () => {
      console.log('🔇 recognition.onsoundend - Sound ended')
    }

    recognition.onspeechend = () => {
      console.log('🔇 recognition.onspeechend - Speech ended')
      setFeedback('Processing speech...')
      
      // If we detected sound but didn't get results, wait a bit longer
      if (hasReceivedSound) {
        console.log('🔄 Speech detected but no results yet, waiting...')
        setTimeout(() => {
          if (isListening && hasReceivedSound) {
            console.log('⏰ Timeout after speech detection, forcing stop')
            setRecognitionError('Speech was detected but not recognized. Please try again.')
            setFeedback('Try speaking more clearly.')
            stopListening()
          }
        }, 1000)
      }
    }

    // STEP 5: RESULT HANDLING (IMPORTANT)
    recognition.onresult = (event) => {
      console.log('📝 recognition.onresult - Results received')
      console.log('📊 Result details:', {
        resultIndex: event.resultIndex,
        resultsLength: event.results.length,
        isFinal: event.results[event.results.length - 1]?.isFinal
      })
      
      let transcript = ''
      let confidence = 0
      let isFinal = false
      
      // Capture from BOTH interim and final results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result && result[0]) {
          const currentTranscript = result[0].transcript.toLowerCase().trim()
          const currentConfidence = result[0].confidence || 0.5
          const currentIsFinal = result.isFinal
          
          console.log(`🔍 Result ${i}: "${currentTranscript}" (confidence: ${currentConfidence}, final: ${currentIsFinal})`)
          
          // Use the latest result (most accurate)
          transcript = currentTranscript
          confidence = currentConfidence
          isFinal = currentIsFinal
          
          // Process ANY result (interim or final) if we have content
          if (transcript && transcript.length > 0) {
            console.log(`🎯 Processing result: "${transcript}" (final: ${isFinal})`)
            
            // Mark that we received valid speech
            setHasReceivedSound(true)
            
            // Process the result
            processSpeechResult(transcript, confidence)
            
            // Stop recognition after processing
            stopListening()
            return
          }
        }
      }
      
      console.log(`🎯 Captured transcript: "${transcript}" (confidence: ${confidence}, final: ${isFinal})`)
    }

    recognition.onerror = (event) => {
      console.error(`❌ recognition.onerror - Error: ${event.error}`)
      setIsListening(false)
      setIsRecording(false)
      
      // STEP 4: FIX "NO SPEECH DETECTED" FALSE ERRORS
      if (event.error === 'no-speech') {
        if (hasReceivedSound) {
          console.log('🔄 False no-speech error - ignoring because sound was detected')
          setRecognitionError('Speech was detected but not clearly recognized. Please try again.')
          setFeedback('Try speaking more clearly.')
        } else {
          console.log('⚠️ True no-speech error - no sound detected')
          setRecognitionError('No speech detected. Please speak louder.')
          setFeedback('No speech detected. Please try again.')
        }
      } else if (event.error === 'not-allowed') {
        setRecognitionError('Microphone permission denied.')
        setFeedback('Please allow microphone access.')
      } else {
        setRecognitionError(`Speech recognition error: ${event.error}`)
        setFeedback('Please try again.')
      }
      
      // Clear timeout
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current)
        listeningTimeoutRef.current = null
      }
    }

    recognition.onend = () => {
      console.log('🏁 recognition.onend - Recognition ended')
      setIsListening(false)
      setIsRecording(false)
      setNextEnabled(true)
      
      // Clear timeout
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current)
        listeningTimeoutRef.current = null
      }
    }

    recognitionRef.current = recognition
    console.log('✅ Speech recognition setup complete')
  }

  const cleanupRecognition = () => {
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current)
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current = null
      } catch (error) {
        console.log('Cleanup error:', error.message)
      }
    }
  }

  const processSpeechResult = (transcript, confidence) => {
    console.log(`🎯 Processing: "${transcript}" with confidence: ${confidence}`)
    
    // Normalize text
    const normalizedTranscript = transcript.toLowerCase().trim()
    const expectedRomanization = currentWord.romanization.toLowerCase()
    
    console.log(`📊 Expected: "${expectedRomanization}"`)
    console.log(`📊 Received: "${normalizedTranscript}"`)
    
    // Calculate similarity
    let similarity = 0
    
    if (normalizedTranscript === expectedRomanization) {
      similarity = 1.0
    } else if (normalizedTranscript.includes(expectedRomanization)) {
      similarity = 0.8
    } else if (expectedRomanization.includes(normalizedTranscript)) {
      similarity = 0.7
    } else {
      // Character matching for partial credit
      const matches = normalizedTranscript.split('').filter(char => expectedRomanization.includes(char)).length
      similarity = matches / Math.max(normalizedTranscript.length, expectedRomanization.length)
    }
    
    const finalScore = Math.round(similarity * confidence * 100)
    
    console.log(`📈 Similarity: ${similarity.toFixed(2)}`)
    console.log(`📈 Final Score: ${finalScore}`)
    
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

  // STEP 3: START / STOP CONTROL (CRITICAL)
  const startListening = async () => {
    console.log('🚀 startListening called')
    
    // Prevent multiple starts
    if (isListening || isRecording) {
      console.log('⚠️ Already listening, ignoring start request')
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
    setHasReceivedSound(false)
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ Microphone permission granted')
      
      // Start recognition
      recognitionRef.current.start()
      console.log('🎤 Recognition started successfully')
      
      // STEP 4: Add 1.5 second listening window
      listeningTimeoutRef.current = setTimeout(() => {
        if (isListening) {
          console.log('⏰ Listening timeout reached')
          stopListening()
        }
      }, 1500)
      
    } catch (error) {
      console.error('❌ Microphone error:', error)
      setRecognitionError('Microphone access denied.')
      setFeedback('Please allow microphone access.')
      setIsListening(false)
      setIsRecording(false)
    }
  }

  const stopListening = () => {
    console.log('🛑 stopListening called')
    
    // Clear timeout
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current)
      listeningTimeoutRef.current = null
    }
    
    if (recognitionRef.current && (isListening || isRecording)) {
      try {
        recognitionRef.current.stop()
        console.log('✅ Recognition stopped successfully')
      } catch (error) {
        console.error('❌ Error stopping recognition:', error)
      }
    }
    
    setIsListening(false)
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
      setHasReceivedSound(false)
    } else {
      navigate('/dashboard')
    }
  }

  const handleRetry = () => {
    setScore(null)
    setFeedback('')
    setNextEnabled(false)
    setRecognitionError('')
    setHasReceivedSound(false)
  }

  const progressPercentage = ((currentIndex + 1) / words.length) * 100

  return (
    <div className="perfect-speech-recognition">
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
          >
            🔊 Listen
          </button>
          
          <button
            onClick={isRecording ? stopListening : startListening}
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

export default PerfectSpeechRecognition

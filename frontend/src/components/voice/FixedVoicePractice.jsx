import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './FixedVoicePractice.css'

const FixedVoicePractice = () => {
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
  const [debugInfo, setDebugInfo] = useState([])
  
  // Refs for recognition and timing
  const recognitionRef = useRef(null)
  const speechTimeoutRef = useRef(null)
  const audioActivityRef = useRef(false)
  const recognitionStartTimeRef = useRef(0)
  const currentWord = words[currentIndex]

  // Add debug log
  const addDebugLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev, `${timestamp}: ${message}`])
    console.log(`🎤 ${message}`)
  }, [])

  // STEP 1: CORRECT SPEECH RECOGNITION CONFIG
  useEffect(() => {
    setupSpeechRecognition()
    return () => {
      cleanupRecognition()
    }
  }, [])

  const setupSpeechRecognition = () => {
    addDebugLog('Setting up Speech Recognition...')
    
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    // Create recognition instance
    const recognition = new SpeechRecognition()
    
    /*
    STEP 1: EXPLANATION OF CONFIGURATION
    =====================================
    recognition.continuous = false
    WHY: We want single-shot recognition for each word practice.
    Continuous mode keeps listening indefinitely and causes issues with short words.
    
    recognition.interimResults = true
    WHY: Tamil words are short (2-3 syllables). Interim results help capture
    the recognition before it ends prematurely. We'll get multiple chances
    to capture the word.
    
    recognition.lang = "ta-IN"
    WHY: Tamil language support in Chrome. This is the correct locale code.
    
    recognition.maxAlternatives = 5
    WHY: Tamil pronunciation varies. More alternatives increase chances
    of correct recognition, especially for non-native speakers.
    */
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "ta-IN"
    recognition.maxAlternatives = 5

    // STEP 5: DEBUG VISIBILITY - Event handlers with detailed logging
    recognition.onstart = () => {
      addDebugLog('🟢 recognition.onstart - Recognition started')
      recognitionStartTimeRef.current = Date.now()
      audioActivityRef.current = false
      setIsListening(true)
      setRecognitionError('')
      setFeedback('Listening... Speak clearly!')
    }

    recognition.onspeechstart = () => {
      addDebugLog('🔊 recognition.onspeechstart - Speech detected')
      audioActivityRef.current = true
      setFeedback('Speech detected! Keep speaking...')
    }

    recognition.onspeechend = () => {
      addDebugLog('🔇 recognition.onspeechend - Speech ended')
      setFeedback('Processing your speech...')
    }

    recognition.onresult = (event) => {
      addDebugLog(`📝 recognition.onresult - Results received: ${event.results.length} result(s)`)
      
      let finalTranscript = ''
      let interimTranscript = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        
        if (result.isFinal) {
          // Get the best alternative
          for (let j = 0; j < result.length; j++) {
            const alternative = result[j]
            if (alternative.confidence > maxConfidence) {
              maxConfidence = alternative.confidence
              finalTranscript = alternative.transcript
            }
          }
          addDebugLog(`✅ Final result: "${finalTranscript}" (confidence: ${maxConfidence})`)
        } else {
          interimTranscript = result[0].transcript
          addDebugLog(`⏳ Interim result: "${interimTranscript}"`)
        }
      }

      // If we have a final result, process it
      if (finalTranscript) {
        processSpeechResult(finalTranscript, maxConfidence)
      } else if (interimTranscript && interimTranscript.length > 2) {
        // For short words, process strong interim results
        addDebugLog(`🔄 Processing strong interim: "${interimTranscript}"`)
        processSpeechResult(interimTranscript, 0.7) // Assume moderate confidence for interim
      }
    }

    recognition.onerror = (event) => {
      addDebugLog(`❌ recognition.onerror - Error: ${event.error}`)
      setIsListening(false)
      setIsRecording(false)
      
      let errorMessage = ''
      
      /*
      STEP 3: HANDLE "NO SPEECH DETECTED" FALSE ERRORS
      ===============================================
      The "no-speech" error often fires falsely when:
      1. User speaks too softly
      2. Tamil words are very short
      3. Background noise interferes
      
      We check if we detected any audio activity before this error.
      */
      if (event.error === 'no-speech') {
        if (audioActivityRef.current) {
          addDebugLog('🔄 False no-speech error detected - ignoring')
          errorMessage = 'Speech was detected but not clearly recognized. Please try speaking louder.'
          // Don't set error state - allow retry
        } else {
          errorMessage = 'No speech detected. Please try speaking louder and clearer.'
        }
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone permission denied. Please allow microphone access and try again.'
      } else if (event.error === 'network') {
        errorMessage = 'Network error. Please check your internet connection.'
      } else if (event.error === 'service-not-allowed') {
        errorMessage = 'Speech recognition service not allowed. Please try again.'
      } else {
        errorMessage = `Speech recognition error: ${event.error}. Please try again.`
      }
      
      setRecognitionError(errorMessage)
      setFeedback(errorMessage)
    }

    recognition.onend = () => {
      const duration = Date.now() - recognitionStartTimeRef.current
      addDebugLog(`🏁 recognition.onend - Recognition ended after ${duration}ms`)
      setIsListening(false)
      setIsRecording(false)
      
      /*
      STEP 2: START / STOP LOGIC (CRITICAL)
      ==================================
      IMPORTANT: recognition.onend must NOT auto-restart!
      This prevents infinite loops and allows proper control.
      */
      
      // Clear any pending timeout
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current)
        speechTimeoutRef.current = null
      }
      
      // Enable next button after recognition completes
      setNextEnabled(true)
    }

    recognitionRef.current = recognition
    addDebugLog('✅ Speech recognition setup complete')
  }

  const cleanupRecognition = () => {
    addDebugLog('🧹 Cleaning up recognition...')
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        addDebugLog(`Cleanup error: ${error.message}`)
      }
      recognitionRef.current = null
    }
  }

  // STEP 3: HANDLE SHORT WORDS PROPERLY
  const processSpeechResult = (transcript, confidence) => {
    addDebugLog(`🎯 Processing speech result: "${transcript}" (confidence: ${confidence})`)
    
    // Normalize transcript
    const normalizedTranscript = transcript.toLowerCase().trim()
    const expectedTamil = currentWord.tamil.toLowerCase().trim()
    const expectedRomanization = currentWord.romanization.toLowerCase().trim()
    
    addDebugLog(`📊 Expected Tamil: "${expectedTamil}"`)
    addDebugLog(`📊 Expected Romanization: "${expectedRomanization}"`)
    
    // Calculate similarity with both Tamil and Romanization
    const tamilSimilarity = calculateSimilarity(expectedTamil, normalizedTranscript)
    const romanizationSimilarity = calculateSimilarity(expectedRomanization, normalizedTranscript)
    
    // Use the better similarity score
    const bestSimilarity = Math.max(tamilSimilarity, romanizationSimilarity)
    
    // Apply confidence weighting
    const finalScore = Math.round(bestSimilarity * confidence * 100)
    
    addDebugLog(`📈 Tamil similarity: ${tamilSimilarity.toFixed(2)}`)
    addDebugLog(`📈 Romanization similarity: ${romanizationSimilarity.toFixed(2)}`)
    addDebugLog(`📈 Best similarity: ${bestSimilarity.toFixed(2)}`)
    addDebugLog(`📈 Final score: ${finalScore}`)
    
    setScore(finalScore)
    
    // Visual feedback
    let feedbackMessage = ''
    let feedbackClass = ''
    
    if (finalScore >= 80) {
      feedbackMessage = `🎉 Excellent! Score: ${finalScore}/100`
      feedbackClass = 'excellent'
    } else if (finalScore >= 60) {
      feedbackMessage = `👍 Good! Score: ${finalScore}/100`
      feedbackClass = 'good'
    } else if (finalScore >= 40) {
      feedbackMessage = `😊 Nice try! Score: ${finalScore}/100`
      feedbackClass = 'fair'
    } else {
      feedbackMessage = `🎯 Keep practicing! Score: ${finalScore}/100`
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

  // STEP 2: START / STOP LOGIC (CRITICAL)
  const startListening = async () => {
    addDebugLog('🎤 Starting listening...')
    
    if (!recognitionRef.current) {
      setRecognitionError('Speech recognition not initialized. Please refresh the page.')
      return
    }

    // Reset state
    setScore(null)
    setFeedback('')
    setNextEnabled(false)
    setRecognitionError('')
    setDebugInfo([]) // Clear debug logs
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      addDebugLog('✅ Microphone permission granted')
      
      // Start recognition
      recognitionRef.current.start()
      setIsRecording(true)
      addDebugLog('🚀 Recognition started successfully')
      
      /*
      STEP 4: HANDLE SHORT WORDS PROPERLY
      ==================================
      Set a timeout to force stop if recognition doesn't end naturally.
      This prevents infinite listening for very short words.
      */
      speechTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          addDebugLog('⏰ Timeout reached - forcing stop')
          recognitionRef.current.stop()
        }
      }, 3000) // 3 second timeout
      
    } catch (error) {
      addDebugLog(`❌ Microphone permission error: ${error.message}`)
      setRecognitionError('Microphone access denied. Please allow microphone permissions in your browser.')
      setFeedback('Please allow microphone access to use voice practice.')
    }
  }

  const stopListening = () => {
    addDebugLog('🛑 Manual stop requested')
    
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
      speechTimeoutRef.current = null
    }
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
        addDebugLog('✅ Recognition stopped manually')
      } catch (error) {
        addDebugLog(`⚠️ Stop error: ${error.message}`)
      }
    }
    
    setIsRecording(false)
  }

  const playCorrectPronunciation = () => {
    addDebugLog('🔊 Playing correct pronunciation...')
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(currentWord.romanization)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onstart = () => addDebugLog(`🔊 Playing: ${currentWord.romanization}`)
      utterance.onend = () => addDebugLog('🔊 Audio finished')
      utterance.onerror = (event) => addDebugLog(`❌ Audio error: ${event.error}`)
      
      window.speechSynthesis.speak(utterance)
    } else {
      setFeedback('Audio not supported in your browser')
    }
  }

  const handleNext = () => {
    addDebugLog('➡️ Moving to next word...')
    
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setScore(null)
      setFeedback('')
      setNextEnabled(false)
      setRecognitionError('')
      setDebugInfo([])
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
    setDebugInfo([])
  }

  const progressPercentage = ((currentIndex + 1) / words.length) * 100

  return (
    <div className="fixed-voice-practice">
      <div className="practice-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
        <h2>🎤 Fixed Tamil Voice Practice</h2>
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
            onClick={isRecording ? stopListening : startListening}
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

        {/* Debug Panel */}
        {debugInfo.length > 0 && (
          <div className="debug-panel">
            <h4>🔍 Debug Logs:</h4>
            <div className="debug-logs">
              {debugInfo.map((log, index) => (
                <div key={index} className="debug-log">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FixedVoicePractice

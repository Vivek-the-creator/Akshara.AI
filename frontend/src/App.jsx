import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingScreen from './components/LoadingScreen'

import { useAuth } from './contexts/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LevelSelection from './pages/LevelSelection'
import WritingTutor from './pages/WritingTutor'
import DailyPractice from './pages/DailyPractice'
import Achievements from './pages/Achievements'
import PerfectSpeechRecognition from './components/voice/PerfectSpeechRecognition'
import BeginnerLevels from './pages/BeginnerLevels'
import LetterPractice from './pages/LetterPractice'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

function AppContent() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="loading">
        <p>Loading application...</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/levels" 
              element={user ? <LevelSelection /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/writing" 
              element={user ? <WritingTutor /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/voice-practice" 
              element={user ? <PerfectSpeechRecognition /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/daily-practice" 
              element={user ? <DailyPractice /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/achievements" 
              element={user ? <Achievements /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <Profile /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/settings" 
              element={user ? <Settings /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/levels/beginner" 
              element={user ? <BeginnerLevels /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/practice/beginner/uyir-ezhuthugal/:level" 
              element={user ? <LetterPractice /> : <Navigate to="/login" />} 
            />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <LoadingScreen onComplete={() => setLoaded(true)} />
      {loaded && (
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      )}
    </>
  )
}

export default App
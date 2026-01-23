import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import { useAuth } from './contexts/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WritingTutor from './pages/WritingTutor'
import PerfectSpeechRecognition from './components/voice/PerfectSpeechRecognition'
import LevelSelection from './pages/LevelSelection'
import BeginnerLevels from './pages/BeginnerLevels'
import LetterPractice from './pages/LetterPractice'

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
        <Navbar />
        <div className="container">
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
              path="/writing" 
              element={user ? <WritingTutor /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/voice-practice" 
              element={user ? <PerfectSpeechRecognition /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/levels" 
              element={user ? <LevelSelection /> : <Navigate to="/login" />} 
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
      </div>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

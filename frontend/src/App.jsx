import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WritingTutor from './pages/WritingTutor'
import PerfectSpeechRecognition from './components/voice/PerfectSpeechRecognition'
import { useAuth } from './contexts/AuthContext'

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
        </Routes>
      </div>
    </div>
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

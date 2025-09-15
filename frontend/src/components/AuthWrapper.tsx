import React, { useState } from 'react'
import { Login } from './Login'
import { Signup } from './Signup'
import { useAuth } from '../contexts/AuthContext'

export function AuthWrapper({ children }: { children: any }) {
  const [showSignup, setShowSignup] = useState(false)
  const { user, isGuest } = useAuth()

  // If user is authenticated (logged in or guest), show the main app
  if (user || isGuest) {
    return <>{children}</>
  }

  // Otherwise show login/signup
  return (
    <>
      {showSignup ? (
        <Signup onSwitchToLogin={() => setShowSignup(false)} />
      ) : (
        <Login onSwitchToSignup={() => setShowSignup(true)} />
      )}
    </>
  )
}

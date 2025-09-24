import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, signIn, signUp, signOut, resetPassword, onAuthStateChange } from '../lib/supabase'

interface User {
  id: string
  email?: string
  name?: string
  isGuest?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isGuest: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  continueAsGuest: () => void
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name
        })
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await signIn(email, password)
    if (error) throw new Error(error.message)
  }

  const signup = async (email: string, password: string, name: string) => {
    const { error } = await signUp(email, password)
    if (error) throw new Error(error.message)
    
    // Update profile with name after successful signup
    if (!error) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { name, full_name: name }
      })
      if (updateError) console.warn('Failed to update user profile:', updateError.message)
    }
  }

  const logout = async () => {
    const { error } = await signOut()
    if (error) throw new Error(error.message)
    setUser(null)
  }

  const handleResetPassword = async (email: string) => {
    const { error } = await resetPassword(email)
    if (error) throw new Error(error.message)
  }
    }
  }

  const logout = async () => {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      setUser(null)
      return
    }
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Logout error:', error)
      setUser(null)
    }
  }

  const continueAsGuest = () => {
    setUser({
      id: 'guest-' + Math.random().toString(36).slice(2),
      name: 'Guest User',
      isGuest: true
    })
  }

  const isGuest = user?.isGuest || false

  const value = {
    user,
    loading,
    isGuest,
    login,
    signup,
    logout,
    continueAsGuest
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

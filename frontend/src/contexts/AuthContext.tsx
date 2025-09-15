import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
}

const AuthContext = createContext(undefined)

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only initialize Supabase if properly configured
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      setLoading(false)
      return
    }

    try {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name
          })
        }
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name
            })
          } else {
            setUser(null)
          }
          setLoading(false)
        }
      )

      return () => subscription?.unsubscribe()
    } catch (error) {
      console.warn('Supabase not configured properly, auth features disabled')
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.')
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
    } catch (error) {
      throw error
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.')
    }
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      })
      if (error) throw error
    } catch (error) {
      throw error
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

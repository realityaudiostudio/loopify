import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchProfile } from '../lib/auth'

const AuthContext = createContext(null)
const ALLOWED_ADMIN_EMAIL = 'onlinefacultystaff@gmail.com'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId) => {
    const { data } = await fetchProfile(userId)
    setProfile(data ?? null)
    return data
  }

  useEffect(() => {
    let mounted = true

    async function initSession() {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      }
      setLoading(false)
    }

    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const isAdmin = Boolean(
    profile?.role === 'admin' ||
    profile?.college_email?.toLowerCase() === ALLOWED_ADMIN_EMAIL ||
    user?.email?.toLowerCase() === ALLOWED_ADMIN_EMAIL
  )

  const value = {
    user,
    profile,
    session,
    loading,
    isAdmin,
    refreshProfile: () => user && loadProfile(user.id),
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>')
  return ctx
}

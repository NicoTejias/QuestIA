/**
 * Hook central para el perfil del usuario autenticado con Clerk + Supabase.
 */
import { useUser } from '@clerk/clerk-react'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export type UserProfile = {
  id: string
  clerk_id: string
  name: string | null
  email: string | null
  image: string | null
  avatar_url: string | null
  role: string
  student_id: string | null
  is_verified: boolean
  is_demo: boolean
  terms_accepted_at: number | null
  daily_streak: number
  ice_cubes: number
  belbin_profile: any | null
  bartle_profile: string | null
  created_at: string
}

type UseProfileResult = {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  refetch: () => void
}

export function useProfile(): UseProfileResult {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fetchAttempted = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser) {
      setUser(null)
      setIsLoading(false)
      return
    }

    // Already fetched profile this session
    if (fetchAttempted.current) return

    const fetchProfile = async () => {
      fetchAttempted.current = true
      setIsLoading(true)
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('clerk_id', clerkUser.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
          setUser(null)
          return
        }

        setUser(data as UserProfile)
      } catch (err) {
        console.error('useProfile error:', err)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [isLoaded, isSignedIn, clerkUser])

  return {
    user,
    isLoading: !isLoaded || isLoading,
    isAuthenticated: isLoaded && !!isSignedIn,
    refetch: () => { fetchAttempted.current = false },
  }
}
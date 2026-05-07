/**
 * UserSync: sincroniza el usuario de Clerk con el perfil en Supabase.
 * Se ejecuta al iniciar sesión. Reemplaza convex/users.ts:storeUser
 */
import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../../lib/supabase'

// Allowed institutional domains — correos no institucionales quedan en modo demo
const defaultDomains = ['@questia.cl', '@duocuc.cl', '@profesor.duoc.cl', '@duoc.cl']

function detectRole(email: string): string {
  const e = email.toLowerCase()
  const isTeacher = e.includes('@profesor.') || e.includes('@admin.') || e.includes('@duoc.cl') || e.includes('@questia.cl')
  return isTeacher ? 'teacher' : 'student'
}

export function UserSync() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser()
  const hasSynced = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser) return
    if (hasSynced.current) return

    const hasError = new URLSearchParams(window.location.search).has('error')
    if (hasError) return

    hasSynced.current = true

    const timeout = setTimeout(async () => {
      try {
        const clerkId = clerkUser.id
        const email = clerkUser.primaryEmailAddress?.emailAddress || ''
        const name = clerkUser.fullName || clerkUser.firstName || ''
        const image = clerkUser.imageUrl || ''

        // Check if profile exists
        const { data: existing } = await supabase
          .from('profiles')
          .select('id, role, clerk_id')
          .eq('clerk_id', clerkId)
          .single()

        if (existing) {
          // Update image/name if changed
          await supabase
            .from('profiles')
            .update({ name, image })
            .eq('id', existing.id)
          return
        }

        // Check if profile exists by email (migration/linking)
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('id, clerk_id')
          .eq('email', email)
          .single()

        if (byEmail && !byEmail.clerk_id) {
          await supabase
            .from('profiles')
            .update({ clerk_id: clerkId, name, image })
            .eq('id', byEmail.id)
          return
        }

        // Check if email domain is allowed
        const isAllowed = defaultDomains.some(d => email.toLowerCase().endsWith(d))
        
        if (!isAllowed) {
          // Demo mode
          await supabase.from('profiles').insert({
            id: clerkId,
            clerk_id: clerkId,
            name,
            email,
            image,
            avatar_url: image,
            role: 'demo_teacher',
            is_demo: true,
            is_verified: true,
          })
          return
        }

        // Get allowed domains from institution_config if available
        const role = detectRole(email)

        await supabase.from('profiles').insert({
          id: clerkId,
          clerk_id: clerkId,
          name,
          email,
          image,
          avatar_url: role !== 'student' ? image : '',
          role,
          is_verified: true,
          is_demo: false,
        })

      } catch (err: any) {
        console.error('UserSync error:', err)
        if (err?.message?.includes('institucionales') || err?.message?.includes('permiten')) {
          window.location.replace('/auth-error?error=' + encodeURIComponent(err.message))
        }
      }
    }, 800)

    return () => clearTimeout(timeout)
  }, [isLoaded, isSignedIn, clerkUser])

  return null
}

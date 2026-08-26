import { getSupabase } from './supabase'
import { getCookie, deleteCookie } from 'hono/cookie'

export async function loginWithMagicLink(email: string, env: any) {
  const supabase = getSupabase(env)
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      // Use the SITE_URL from wrangler.toml or default to localhost
      emailRedirectTo: `${env.SITE_URL || 'http://localhost:8787'}/auth/callback`,
    },
  })

  if (error) {
    console.error("Supabase Auth Error:", error.message)
    return false
  }
  return true
}

export async function authMiddleware(c: any, next: any) {
  const accessToken = getCookie(c, 'sb-access-token')

  if (accessToken) {
    const supabase = getSupabase(c.env)
    const { data, error } = await supabase.auth.getUser(accessToken)
    c.set('user', error ? null : data.user)
  } else {
    c.set('user', null)
  }

  await next()
}

export async function requireAuth(c: any, next: any) {
  const user = c.get('user')
  if (!user) {
    return c.redirect('/auth/login')
  }
  await next()
}

export async function logout(c: any) {
  const supabase = getSupabase(c.env)
  await supabase.auth.signOut()
  deleteCookie(c, 'sb-access-token')
  deleteCookie(c, 'sb-refresh-token')
}

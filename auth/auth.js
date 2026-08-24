import { getSupabase } from "../shared/supabaseClient"
import { getCookie, setCookie, deleteCookie } from "hono/cookie"

export async function loginWithMagicLink(email, env) {
  const supabase = getSupabase(env)
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${env.SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error("Supabase Auth Error:", error.message)
    return null
  }
  return true
}

export async function authMiddleware(c, next) {
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

export async function requireAuth(c, next) {
  const user = c.get('user')
  if (!user) {
    return c.redirect('/auth/login')
  }
  await next()
}

export async function logout(c) {
  const supabase = getSupabase(c.env)
  await supabase.auth.signOut()
  deleteCookie(c, 'sb-access-token')
}
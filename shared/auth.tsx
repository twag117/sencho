/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { Layout } from '../shared/layout'
import { loginWithMagicLink, logout } from './authHelpers'

export const authApp = new Hono()

authApp.get('/login', (c) => {
  return c.html(
    <Layout title="Login">
      <h1 className="text-3xl font-bold">Login</h1>
      <p>Enter your email to receive a magic login link.</p>
      <form action="/auth/login" method="post" className="mt-4 flex flex-col gap-2 max-w-sm">
        <label htmlFor="u_email"><strong>Email</strong></label>
        <input type="email" name="u_email" placeholder="Enter Email" required className="p-2 border rounded" />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Send Magic Link</button>
      </form>
    </Layout>
  )
})

authApp.post('/login', async (c) => {
  const body = await c.req.parseBody()
  const email = String(body.u_email)

  const success = await loginWithMagicLink(email, c.env)
  if (!success) {
    return c.redirect('/auth/login?error=1')
  }

  return c.html(
    <Layout title="Check your email">
      <h1 className="text-3xl font-bold">Check your email</h1>
      <p>We've sent a magic link to <strong>{email}</strong>. Click it to log in!</p>
      <a href="/" className="text-blue-500 underline">Back to Home</a>
    </Layout>
  )
})

authApp.get('/callback', (c) => {
  return c.html(
    <html>
      <body>
        <p>Logging you in...</p>
        <script dangerouslySetInnerHTML={{ __html: `
          const hash = window.location.hash.substring(1)
          const params = new URLSearchParams(hash)
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')

          if (access_token) {
            fetch('/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token, refresh_token })
            }).then(() => {
              window.location.href = '/'
            })
          } else {
            window.location.href = '/auth/login?error=1'
          }
        `}} />
      </body>
    </html>
  )
})

authApp.post('/session', async (c) => {
  const { access_token, refresh_token } = await c.req.json()
  setCookie(c, 'sb-access-token', access_token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 7 })
  setCookie(c, 'sb-refresh-token', refresh_token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 })
  return c.json({ ok: true })
})

authApp.get('/logout', async (c) => {
  await logout(c)
  return c.redirect('/')
})

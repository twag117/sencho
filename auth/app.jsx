/** @jsxImportSource hono/jsx */
import { Hono } from "hono"
import { Layout } from "../shared/layout.jsx"
import { loginWithMagicLink, logout } from "./auth.js"
import { setCookie } from "hono/cookie"

export const authApp = new Hono()

authApp.get('/login', (c) => {
  return c.html(
    <Layout title="Login" user={c.get('user')}>
      <h1>Login</h1>
      <p>Enter your email to receive a magic login link.</p>
      <form action="/auth/login" method="post">
        <label htmlFor="u_email"><strong>Email</strong></label>
        <input type="email" placeholder="Enter Email" name="u_email" required />
        <button type="submit">Send Magic Link</button>
      </form>
    </Layout>
  )
})

authApp.post('/login', async (c) => {
  const form = await c.req.formData()
  const formEmail = form.get('u_email')

  const success = await loginWithMagicLink(formEmail, c.env)
  if (!success) {
    return c.redirect('/auth/login?error=1')
  }

  return c.html(
    <Layout title="Check your email">
      <h1>Check your email</h1>
      <p>We've sent a magic link to <strong>{formEmail}</strong>. Click it to log in!</p>
      <a href="/">Back to Home</a>
    </Layout>
  )
})

authApp.get('/callback', async (c) => {
  return c.html(`
    <html>
      <body>
        <p>Logging you in...</p>
        <script>
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
        </script>
      </body>
    </html>
  `)
})

authApp.post('/session', async (c) => {
  const { access_token, refresh_token } = await c.req.json()
  setCookie(c, 'sb-access-token', access_token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 7 })
  setCookie(c, 'sb-refresh-token', refresh_token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 })
  return c.json({ ok: true })
})

authApp.get('/logout', (c) => {
  logout(c)
  return c.redirect('/')
})

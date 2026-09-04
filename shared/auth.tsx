import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { Layout } from '../shared/layout'
import { sendLoginCode, verifyLoginCode, logout } from '../shared/authHelpers'

export const authApp = new Hono()

authApp.get('/login', (c) => {
  return c.html(
    <Layout title="Login" user={c.get('user')}>
      <h1>Login</h1>
      <p>Enter your email to receive a login code.</p>
      <form action="/auth/login" method="post" style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 300px;">
        <label htmlFor="u_email"><strong>Email</strong></label>
        <input type="email" name="u_email" placeholder="Enter Email" required style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 6px;" />
        <button type="submit" style="background: #0172ad; color: white; padding: 0.6rem; border-radius: 6px; border: none;">Send Code</button>
      </form>
    </Layout>
  )
})

authApp.post('/login', async (c) => {
  const body = await c.req.parseBody()
  const email = String(body.u_email)

  const success = await sendLoginCode(email, c.env)
  if (!success) {
    return c.redirect('/auth/login?error=1')
  }

  return c.html(
    <Layout title="Enter code" user={c.get('user')}>
      <h1>Enter your code</h1>
      <p>We've sent a 6-digit code to <strong>{email}</strong>.</p>
      <form action="/auth/verify" method="post" style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 300px;">
        <input type="hidden" name="email" value={email} />
        <label htmlFor="code"><strong>Code</strong></label>
        <input type="text" name="code" placeholder="123456" required maxLength={6} style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 6px; letter-spacing: 4px; font-size: 1.2rem; text-align: center;" />
        <button type="submit" style="background: #0172ad; color: white; padding: 0.6rem; border-radius: 6px; border: none;">Verify</button>
      </form>
    </Layout>
  )
})

authApp.post('/verify', async (c) => {
  const body = await c.req.parseBody()
  const email = String(body.email)
  const code = String(body.code)

  const result = await verifyLoginCode(email, code, c.env)
  if (!result) {
    return c.html(
      <Layout title="Invalid code" user={c.get('user')}>
        <h1>Invalid or expired code</h1>
        <p><a href="/auth/login">Try again</a></p>
      </Layout>
    )
  }

  setCookie(c, 'sencho_session', result.sessionToken, {
    path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30,
  })

  return c.redirect('/')
})

authApp.get('/logout', async (c) => {
  await logout(c)
  return c.redirect('/')
})
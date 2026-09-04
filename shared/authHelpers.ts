import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

function randomToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function randomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code
}

export async function sendLoginCode(email: string, env: any) {
  const cleanEmail = email.trim().toLowerCase()
  const code = randomCode()
  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresAt = nowSeconds + 60 * 10 // 10 min expiry

  await env.USERS_DB.prepare(
    `INSERT INTO login_codes (token, email, expires_at) VALUES (?, ?, ?)`
  ).bind(code, cleanEmail, expiresAt).run()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Sencho <login@sencho.app>`,
      to: [cleanEmail],
      subject: 'Your Sencho login code',
      html: `<p>Your login code is:</p><h2 style="letter-spacing: 4px;">${code}</h2><p>This code expires in 10 minutes.</p>`,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    return false
  }

  return true
}

export async function verifyLoginCode(email: string, code: string, env: any) {
  const cleanEmail = email.trim().toLowerCase()
  const nowSeconds = Math.floor(Date.now() / 1000)

  const row = await env.USERS_DB.prepare(
    `SELECT * FROM login_codes WHERE token = ? AND email = ? AND used = 0 AND expires_at > ?`
  ).bind(code, cleanEmail, nowSeconds).first()

  if (!row) return null

  await env.USERS_DB.prepare(`UPDATE login_codes SET used = 1 WHERE token = ?`).bind(code).run()

  let user = await env.USERS_DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(cleanEmail).first()

  if (!user) {
    const userId = crypto.randomUUID()
    await env.USERS_DB.prepare(
      `INSERT INTO users (id, email) VALUES (?, ?)`
    ).bind(userId, cleanEmail).run()
    user = { id: userId, email: cleanEmail }
  }

  const sessionToken = randomToken()
  const sessionExpires = nowSeconds + 60 * 60 * 24 * 30 // 30 days

  await env.USERS_DB.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
  ).bind(sessionToken, user.id, sessionExpires).run()

  return { sessionToken, user }
}

export async function authMiddleware(c: any, next: any) {
  const sessionToken = getCookie(c, 'sencho_session')

  if (sessionToken) {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const session = await c.env.USERS_DB.prepare(
      `SELECT sessions.user_id, users.email FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ? AND sessions.expires_at > ?`
    ).bind(sessionToken, nowSeconds).first()

    c.set('user', session ? { id: session.user_id, email: session.email } : null)
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
  const sessionToken = getCookie(c, 'sencho_session')
  if (sessionToken) {
    await c.env.USERS_DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(sessionToken).run()
  }
  deleteCookie(c, 'sencho_session')
}
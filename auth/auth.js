import { Database } from "bun:sqlite"
import { getCookie, setCookie, deleteCookie } from "hono/cookie"

const db = new Database(new URL("./auth.db", import.meta.url).pathname)
db.run("PRAGMA journal_mode = WAL;")

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    role TEXT DEFAULT 'user'
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER DEFAULT (unixepoch()+7776000)
  )
`)

export const signup = async function(email, password) {
  const userEmail = email.trim().toLowerCase()
  const checkEmail = db.query(`SELECT * FROM users WHERE email=?`)
  if (checkEmail.get(userEmail)) {
    return null
  }
  const hashedPass = await Bun.password.hash(password)
  const newUser = db.query(`INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING * `).get(userEmail, hashedPass)
  const { password_hash, ...safeUser } = newUser

  return safeUser
}

export const login = async function(email, password) {
  const userEmail = email.trim().toLowerCase()
  const getUser = db.query(`SELECT * FROM users WHERE email=?`).get(userEmail)
  if (!getUser) {
    return null
  }
  const verifyPass = await Bun.password.verify(password, getUser.password_hash)
  if (!verifyPass) {
    return null
  }
  const { password_hash, ...safeUser } = getUser

  return safeUser
}

export const createSession = function (c, userId) {
  const sessionId = crypto.randomUUID()
  const insertSession = db.query(`INSERT INTO sessions (id, user_id) VALUES(?, ?) RETURNING * `).get(sessionId, userId)
  if (!insertSession) {
    return null
  }
  setCookie(c, 'session_id', sessionId, { path: '/', httpOnly: true, maxAge: 7776000})
  
  return sessionId
}

export const getSessionUser = function (sessionId) {
  const session = db.query(`SELECT * FROM sessions WHERE id = ?`).get(sessionId)
  if (!session) {
    return null
  }
  if (session.expires_at < Math.floor(Date.now() / 1000)) {
    return null
  }
  const getUser = db.query(`SELECT * FROM users WHERE id = ?`).get(session.user_id)
  const { password_hash, ...safeUser } = getUser

  return safeUser
}

export const authMiddleware = async function (c, next) {
  const sessionId = getCookie(c, 'session_id')
  const user = sessionId ? getSessionUser(sessionId) : null
  c.set('user', user)

  await next()
}

export const requireAuth = async function (c, next) {
  const user = c.get('user')
  if (!user) {
    return c.redirect('/login')
  }

  await next()
}
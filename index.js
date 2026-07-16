import { Hono } from 'hono'
import { authMiddleware } from './auth/auth.js'
import { homeApp } from './apps/home/app.jsx'
import { authApp } from './auth/app.jsx'
import { fibFinderApp } from './apps/fibfinder/app.jsx'

const app = new Hono()

app.use('*', authMiddleware)

app.route('/', homeApp)
app.route('/', authApp)
app.route('/', fibFinderApp)

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
}
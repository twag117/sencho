import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { authMiddleware } from './auth/auth.js'
import { homeApp } from './apps/home/app.jsx'
import { authApp } from './auth/app.jsx'
import { fibFinderApp } from './apps/fibfinder/app.jsx'
import { qrCodeGeneratorApp } from './apps/qrcodegenerator/app.jsx'

const app = new Hono()

app.use('*', serveStatic({ root: `${import.meta.dir}/public` }))
app.use('*', authMiddleware)

app.route('/', homeApp)
app.route('/', authApp)
app.route('/', fibFinderApp)
app.route('/', qrCodeGeneratorApp)

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
}
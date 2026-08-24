import { Hono } from 'hono'
import { authMiddleware } from './auth/auth.js'
import { homeApp } from './apps/home/app.jsx'
import { authApp } from './auth/app.jsx'
import { fibFinderApp } from './apps/fibfinder/app.jsx'
import { qrCodeGeneratorApp } from './apps/qrcodegenerator/app.jsx'

const app = new Hono()

// Note: serveStatic from hono/bun is removed because it won't run on Cloudflare
app.use('*', authMiddleware)

// Updated routes to match your desired URL structure
app.route('/', homeApp)
app.route('/auth', authApp)
app.route('/', fibFinderApp)
app.route('/', qrCodeGeneratorApp)

export default app

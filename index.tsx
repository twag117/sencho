import { Hono } from 'hono'
import { authMiddleware } from './shared/authHelpers'
import { homeApp } from './apps/home'
import { fibFinderApp } from './apps/fibfinder'
import { flashEspanolApp } from './apps/flashespanol'
import { qrCodeGeneratorApp } from './apps/qrcodegenerator'
import { authApp } from './shared/auth'

const app = new Hono()

// 1. Global Middleware - Checks if user is logged in on EVERY request
app.use('*', authMiddleware)

app.route('/', homeApp)
app.route('/fibfinder', fibFinderApp)
app.route('/flashespanol', flashEspanolApp)
app.route('/qr', qrCodeGeneratorApp)
app.route('/auth', authApp)

export default app

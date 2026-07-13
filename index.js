import { Hono } from 'hono'
import { authMiddleware } from './auth/auth'
import { homeApp } from './apps/home/app'
import { authApp } from './auth/app'
import { fibFinderApp } from './apps/fibfinder/app'

const app = new Hono()

app.use('*', authMiddleware)

app.route('/', homeApp)

app.route('/', authApp) //login and //signup

app.route('/', fibFinderApp) //fibfinder


export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
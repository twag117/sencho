import { Hono } from 'hono'
import { homeApp } from './apps/home/app'
import { fibFinderApp } from './apps/fibfinder/app'
import { authApp } from './auth/app'

const app = new Hono()

app.route('/', homeApp)

app.route('/', fibFinderApp) //fibfinder

app.route('/', authApp) //login and //signup

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
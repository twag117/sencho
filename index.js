import { Hono } from 'hono'
import { homeApp } from './apps/home/app'
import { fibFinderApp } from './apps/fibfinder/app'

const app = new Hono()

app.route('/', homeApp)

app.route('/fibfinder', fibFinderApp)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
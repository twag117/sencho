/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { Layout } from '../../shared/layout.jsx'

export const homeApp = new Hono()

homeApp.get('/', (c) => {
  const user = c.get('user')

  return c.html(
    <Layout title="Sencho" user={user}>
      <h1>Senchō</h1>
      <p>A small collection of games.</p>
      <a href="/fibfinder" role="button">Fib Finder</a>
    </Layout>
  )
})
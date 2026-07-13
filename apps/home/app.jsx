/** @jsxImportSource hono/jsx */
import { Hono } from "hono"
import { Layout } from "../../shared/layout"

export const homeApp = new Hono()

homeApp.get('/', (c) => {
  return c.html(
    <Layout title="Sencho">
      <h1>Sencho</h1>
      <p>A small collection of games.</p>
      <a href="/fibfinder">Fib Finder</a>
    </Layout>
  )
})
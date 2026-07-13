/** @jsxImportSource hono/jsx */
import { Hono } from "hono"
import { Layout } from "../../shared/layout"

export const fibFinderApp = new Hono()

fibFinderApp.get('/', (c) => {
  return c.html(
    <Layout title="Fib Finder">
      <h1>Fib Finder</h1>
      <p>Find the fib daily.</p>
    </Layout>
  )
})
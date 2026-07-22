/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import { Layout } from '../../shared/layout.jsx'

export const homeApp = new Hono()

homeApp.get('/', (c) => {
  const user = c.get('user')

  return c.html(
    <Layout title="Sencho" user={user}>
      <style>
        {`
          .container {
            display: flex;
            align-items: start;
            flex-flow: column;
            gap: 1rem;
          }
        `}
      </style>
      <h1>Senchō</h1>
      <p>A small collection of games/apps.</p>
      <div class="container">
        <a href="/fibfinder" role="button">Fib Finder</a>
        <a href="/qr" role="button">QR Code Generator</a>
      </div>
    </Layout>
  )
})
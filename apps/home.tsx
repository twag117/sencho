import { Hono } from 'hono'
import { Layout } from '../shared/layout'

export const homeApp = new Hono()

homeApp.get('/', async (c) => {
  return c.html(
    <Layout title="Sencho Home" user={c.get('user')}>
      <h1 className="text-4xl font-bold mb-4">Welcome to Sencho.app 🦆</h1>
      <p>Choose an app below:</p>
      <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem;">
        <a href="/fibfinder" className="card-link">Fib Finder</a>
        <a href="/flashespanol" className="card-link">Flash Español</a>
        <a href="/qr" className="card-link">QR Code Generator</a>
      </div>
    </Layout>
  )
})
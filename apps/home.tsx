import { Hono } from 'hono'
import { Layout } from '../shared/layout'

export const homeApp = new Hono()

homeApp.get('/', async (c) => {
  return c.html(
    <Layout title="Sencho Home">
      <h1 className="text-4xl font-bold mb-4">Welcome to Sencho.app 🦆</h1>
      <p>Pick a silly project to start:</p>
      <ul className="mt-4 space-y-2">
        <li><a href="/fibfinder" className="text-blue-500 underline">FibFinder</a></li>
        <li><a href="/flashespanol" className="text-blue-500 underline">FlashEspanol</a></li>
        <li><a href="/qr" className="text-blue-500 underline">QR Code Generator</a></li>
      </ul>
    </Layout>
  )
})

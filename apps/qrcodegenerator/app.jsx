/** @jsxImportSource hono/jsx */

import { Hono } from "hono"
import { Layout } from "../../shared/layout"

export const qrCodeGenerator = new Hono()

qrCodeGenerator.get('/qr', (c) => {
  const url = c.get("url")
  const qrCode = qrcode()

  if (url) {
    return c.html(
      <Layout title="QR Code Generator">
        <h1>QR Code Generator</h1>
        <p>Free QR Code Generator</p>
        <div>

        </div>
        <form method="get" action="{`/qr/`}">
          <input type="text" id="url" value={url} placeholder="URL" />
          <button type="submit">Generate!</button>
        </form>
      </Layout>
    )
  }

  return c.html(
    <Layout title="QR Code Generator">
      <h1>QR Code Generator</h1>
      <p>Free QR Code Generator</p>

      <form method="get" action="{`/qr/`}">
        <input type="text" id="url" placeholder="URL" />
        <button type="submit">Generate!</button>
      </form>
    </Layout>
  )
})
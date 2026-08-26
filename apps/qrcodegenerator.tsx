import { Hono } from "hono"
import { Layout } from '../shared/layout'
import QRCode from "qrcode"

export const qrCodeGeneratorApp = new Hono()

qrCodeGeneratorApp.get('/', async (c) => {
  const url = c.req.query("url")

  if (url) {
    const svg = await QRCode.toString(url, { type: 'svg' })

    return c.html(
      <Layout title="QR Code Generator">
        <h1>QR Code Generator</h1>
        <p>Free QR Code Generator</p>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <form method="get" action="/qr">
          <input type="text" name="url" value={url} placeholder="URL" />
          <button type="submit">Generate!</button>
        </form>
      </Layout>
    )
  }

  return c.html(
    <Layout title="QR Code Generator">
      <h1>QR Code Generator</h1>
      <p>Free QR Code Generator</p>
      <form method="get" action="/qr">
        <input type="text" name="url" placeholder="URL" />
        <button type="submit">Generate!</button>
      </form>
    </Layout>
  )
})
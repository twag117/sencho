import { Hono } from 'hono'
import { Layout } from '../shared/layout'

export const flashEspanolApp = new Hono()

// --- PAGES ---

const HomePage = ({ user }: { user: any }) => (
  <Layout title="Home" user={user}>
    <h1 className="text-3xl font-bold">Welcome to Flash Español!</h1>
    <p>Click the button below to get started :)</p>
    <a href="/flashespanol/words/1" className="mt-4 inline-block bg-blue-500 text-white p-2 rounded">Start</a>
  </Layout>
)

const WordsPage = ({ words, user }: { words: any[]; user: any }) => (
  <Layout title="Words" user={user}>
    <h1 className="text-3xl font-bold">All Words</h1>
    <ul className="mt-4 space-y-1">
      {words.map((word) => (
        <li key={word.id}>
          <a href={`/flashespanol/words/${word.id}`} className="text-blue-500 underline">{word.es}</a>
        </li>
      ))}
    </ul>
  </Layout>
)

const WordPage = ({ word, user }: { word: any; user: any }) => (
  <Layout title={word.es} user={user}>
    <div className="word-card">
      <h1 style="font-size: 2.5rem; font-weight: 600;">{word.es}</h1>
      <p style="color: var(--muted-color); font-style: italic;">{word.pronunciation}</p>
      <img
        className="word-image"
        src={word.image_url || "https://placehold.co/400x300?text=No+image"}
        alt={word.es}
      />
      <a
        href={word.id === 500 ? "/flashespanol/words/1" : `/flashespanol/words/${word.id + 1}`}
        style="display: block; text-align: center; background: #0172ad; color: white; padding: 0.6rem 2rem; border-radius: 6px; text-decoration: none;"
      >
        Next
      </a>
      {user && (
        <form action={`/flashespanol/words/${word.id}/image`} method="post" className="form-container" style="border-top: 1px solid #ddd; padding-top: 1rem; width: 100%;">
          <input type="text" name="image_url" placeholder="Image URL" style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 6px;" />
          <button type="submit" style="background: #333; color: white; padding: 0.6rem 1rem; border-radius: 6px; border: none;">Submit</button>
        </form>
      )}
    </div>
  </Layout>
)

// --- ROUTES ---

flashEspanolApp.get('/', (c) => c.html(<HomePage user={c.get('user')} />))

flashEspanolApp.get('/words', async (c) => {
  const db = c.env.FLASHESPANOL_DB
  const { results } = await db.prepare(`SELECT * FROM words LIMIT 1000`).all()
  return c.html(<WordsPage words={results || []} user={c.get('user')} />)
})

flashEspanolApp.get('/words/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.FLASHESPANOL_DB
  const word = await db.prepare(`SELECT * FROM words WHERE id = ?`).bind(id).first()

  if (word) {
    return c.html(<WordPage word={word} user={c.get('user')} />)
  } else {
    return c.text("Word not found", 404)
  }
})

flashEspanolApp.post('/words/:id/image', async (c) => {
  const user = c.get('user')
  if (!user) return c.text('Unauthorized', 401)

  const id = c.req.param('id')
  const body = await c.req.parseBody()
  const db = c.env.FLASHESPANOL_DB

  await db.prepare(`UPDATE words SET image_url = ? WHERE id = ?`).bind(body.image_url, id).run()

  return c.redirect(`/flashespanol/words/${id}`, 303)
})
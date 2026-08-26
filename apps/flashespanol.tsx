import { Hono } from 'hono'
import { Layout } from '../shared/layout'
import { getSupabase } from '../shared/supabase'

export const flashEspanolApp = new Hono()

// --- PAGES ---

const HomePage = () => (
  <Layout title="Home">
    <h1 className="text-3xl font-bold">Welcome to Flash Español!</h1>
    <p>Click the button below to get started :)</p>
    <a href="/flashespanol/words/1" className="mt-4 inline-block bg-blue-500 text-white p-2 rounded">Start</a>
  </Layout>
)

const WordsPage = ({ words }: { words: any[] }) => (
  <Layout title="Words">
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

const WordPage = ({ word }: { word: any }) => (
  <Layout title={word.es}>
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h1 className="text-4xl font-bold">{word.es}</h1>
      <p className="text-gray-500 italic mb-4">{word.pronunciation}</p>
      <img
        className="w-full rounded mb-4"
        src={word.image_url || "https://placehold.co/400x300?text=No+image"}
        alt={word.es}
      />
      <a 
        href={word.id === 500 ? "/flashespanol/words/1" : `/flashespanol/words/${word.id + 1}`} 
        className="block text-center bg-blue-500 text-white p-2 rounded mb-4"
      >
        Next
      </a>
      <form action={`/flashespanol/words/${word.id}/image`} method="post" className="border-t pt-4">
        <label className="block text-sm font-medium">Image URL:</label>
        <input type="text" name="image_url" className="w-full p-2 border rounded mb-2" />
        <button type="submit" className="bg-gray-800 text-white p-2 rounded w-full">Submit</button>
      </form>
    </div>
  </Layout>
)

// --- ROUTES ---

flashEspanolApp.get('/', (c) => c.html(<HomePage />))

flashEspanolApp.get('/words', async (c) => {
  const supabase = getSupabase(c.env)
  const { data: words } = await supabase.from('words').select('*').limit(1000)
  return c.html(<WordsPage words={words || []} />)
})

flashEspanolApp.get('/words/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  const { data: word } = await supabase.from('words').select('*').eq('id', id).single()
  
  if (word) {
    return c.html(<WordPage word={word} />)
  } else {
    return c.text("Word not found", 404)
  }
})

flashEspanolApp.post('/words/:id/image', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.parseBody()
  const supabase = getSupabase(c.env)
  
  await supabase.from('words').update({ image_url: body.image_url }).eq('id', id)
  
  return c.redirect(`/flashespanol/words/${id}`, 303)
})

/** @jsxImportSource hono/jsx */
import { Hono } from "hono"
import { Layout } from "../shared/layout"
import { login, signup, createSession } from "./auth"

export const authApp = new Hono()

authApp.get('/login', (c) => {
  return c.html(
    <Layout title="Login">
      <form action="/login" method="post">
        <label for="u_email"><strong>Username</strong></label>
        <input type="text" placeholder="Enter Email" name="u_email" required />
        <label for="u_psw"><strong>Password</strong></label>
        <input type="password" placeholder="Enter Password" name="u_psw" required />
        <button type="submit">Login</button>
      </form>
    </Layout>
  )
})

authApp.post('/login', async (c) => {
  const form = await c.req.formData()
  const formEmail = form.get('u_email')
  const formPassword = form.get('u_psw')

  const user = await login(formEmail, formPassword)
  if (!user) {
    return c.redirect('/login?error=1')
  }
  const sessionId = createSession(c, user.id)
  if (!sessionId) {
    return c.redirect('/login?error=2')
  }

  return c.redirect('/')
})

authApp.get('/signup', (c) => {
  return c.html(
    <Layout title="Signup">
      <form action="/signup" method="post">
        <label for="u_email"><strong>Username</strong></label>
        <input type="text" placeholder="Enter Email" name="u_email" required />
        <label for="u_psw"><strong>Password</strong></label>
        <input type="password" placeholder="Enter Password" name="u_psw" id="pass1" required />
        <label for="u_psw_confirmation"><strong>Confirm Password</strong></label>
        <input type="password" placeholder="Confirm Password" name="u_psw_confirmation" id="pass2" required />
        <button type="submit" id="submit-form">Sign-Up</button>
      </form>
    </Layout>
  )
})

authApp.post('/signup', async (c)=> {
  const form = await c.req.formData()
  const formEmail = form.get('u_email')
  const formPassword = form.get('u_psw')
  const formPasswordConfirmation = form.get('u_psw_confirmation')
  if (formPassword !== formPasswordConfirmation) {
    return c.redirect('/signup?error=1')
  }

  const user = await signup(formEmail, formPassword)
  if (!user) {
    return c.redirect('/signup?error=2')
  }
  const sessionId = createSession(c, user.id)
  if (!sessionId) {
    return c.redirect('/signup?error=3')
  }

  return c.redirect('/')
})
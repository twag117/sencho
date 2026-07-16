/** @jsxImportSource hono/jsx */

export const Layout = ({ title = 'Sencho', user, children }) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      {/* Pico CSS-matched favicon with ō */}
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230172ad'/><text x='52' y='78' font-size='100' text-anchor='middle' fill='white' font-family='serif'>ō</text></svg>"
      />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.classless.min.css" />
      <script
        type="module"
        src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.2/bundles/datastar.js"
      ></script>
      <style>
        {`
          nav {
            padding: 1rem;
          }
        `}
      </style>
    </head>
    <body>
      <nav>
        <ul>
          <li><strong><a href="/">Senchō</a></strong></li>
        </ul>
        <ul>
          <li><a href="/fibfinder">Fib Finder</a></li>
          {user
            ? <li><a href="/logout">Log out ({user.email})</a></li>
            : <li><a href="/login">Log in</a> / <a href="/signup">Sign up</a></li>
          }
        </ul>
      </nav>
      <main>{children}</main>
    </body>
  </html>
)
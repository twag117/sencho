export const Layout = (props: { title: string; children: any; user?: any }) => {
  return (
    <html>
      <head>
        <title>{props.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%230172ad'/%3E%3Ccircle cx='50' cy='50' r='26' fill='none' stroke='white' stroke-width='4'/%3E%3Ccircle cx='50' cy='50' r='7' fill='white'/%3E%3Cg stroke='white' stroke-width='4' stroke-linecap='round'%3E%3Cline x1='50' y1='20' x2='50' y2='30'/%3E%3Cline x1='50' y1='70' x2='50' y2='80'/%3E%3Cline x1='20' y1='50' x2='30' y2='50'/%3E%3Cline x1='70' y1='50' x2='80' y2='50'/%3E%3Cline x1='29' y1='29' x2='36' y2='36'/%3E%3Cline x1='64' y1='64' x2='71' y2='71'/%3E%3Cline x1='71' y1='29' x2='64' y2='36'/%3E%3Cline x1='36' y1='64' x2='29' y2='71'/%3E%3C/g%3E%3C/svg%3E" />
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
        <style>{`
          body { max-width: 700px; margin: 0 auto; padding: 2rem 1.5rem; }
          @media (max-width: 480px) { body { padding: 1rem; } }
          nav a { text-decoration: none; }
          nav a[href="/"]:hover span { text-decoration: underline; }
          nav a.button {
            background: #0172ad; color: white; padding: 0.5rem 1rem;
            border-radius: 6px; font-size: 0.9rem;
          }
          .card-link {
            display: block; padding: 1rem; border: 1px solid #ddd;
            border-radius: 8px; text-decoration: none; color: inherit;
          }
          .word-image { width: 100%; max-width: 400px; height: auto; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; }
          .word-card { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
          .form-container { display: flex; align-items: center; gap: 0.5rem; }
          
        `}</style>
      </head>
      <body>
        <nav className="mb-4 flex gap-4 items-center justify-between" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
          <a href="/" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: inherit;">
            <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="20" fill="#0172ad"/>
              <circle cx="50" cy="50" r="26" fill="none" stroke="white" stroke-width="4"/>
              <circle cx="50" cy="50" r="7" fill="white"/>
              <g stroke="white" stroke-width="4" stroke-linecap="round">
                <line x1="50" y1="20" x2="50" y2="30"/>
                <line x1="50" y1="70" x2="50" y2="80"/>
                <line x1="20" y1="50" x2="30" y2="50"/>
                <line x1="70" y1="50" x2="80" y2="50"/>
                <line x1="29" y1="29" x2="36" y2="36"/>
                <line x1="64" y1="64" x2="71" y2="71"/>
                <line x1="71" y1="29" x2="64" y2="36"/>
                <line x1="36" y1="64" x2="29" y2="71"/>
              </g>
            </svg>
            <span style="font-weight: 600; font-size: 1.1rem;">Senchō</span>
          </a>
          <div>
            {props.user ? (
              <span>
                {props.user.email} &nbsp;
                <a href="/auth/logout" className="button">Logout</a>
              </span>
            ) : (
              <a href="/auth/login" className="button">Login</a>
            )}
          </div>
        </nav>
        <main>{props.children}</main>
      </body>
    </html>
  )
}
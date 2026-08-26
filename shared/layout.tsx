export const Layout = (props: { title: string; children: any }) => {
  return (
    <>
      <doctype html />
      <html>
        <head>
          <title>{props.title}</title>
          <script src="https://unpkg.com/htmx.org@1.9.10"></script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
        </head>
        <body className="bg-gray-100 text-gray-900 p-4">
          <nav className="mb-4 flex gap-4">
            <a href="/" className="text-blue-500 underline">Home</a>
          </nav>
          <main>{props.children}</main>
        </body>
      </html>
    </>
  )
}

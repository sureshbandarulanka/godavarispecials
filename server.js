const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

// Standardize NODE_ENV for Next.js consistency
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

console.log(`> Starting server in ${process.env.NODE_ENV} mode...`);

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Basic health check for Hostinger monitoring
      if (parsedUrl.pathname === '/health') {
        res.statusCode = 200;
        res.end('ok');
        return;
      }

      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error(`Error occurred handling path: ${req.url}`, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(`Fatal server error:`, err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Static files served from .next/static`)
    })
})

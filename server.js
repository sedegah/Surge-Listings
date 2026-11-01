import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
const port = process.env.PORT || 5080;
const workerOrigin = 'https://surge-solutions-api.sedegahkimathi.workers.dev';

async function proxyToWorker(req, res, pathAndQuery = req.originalUrl) {
  try {
    const target = new URL(pathAndQuery, workerOrigin);
    const headers = new Headers();
    for (const name of ['accept', 'accept-language', 'authorization', 'content-type', 'cookie', 'origin', 'user-agent']) {
      const value = req.headers[name];
      if (typeof value === 'string') headers.set(name, value);
    }

    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const response = await fetch(target, {
      method: req.method,
      headers,
      ...(hasBody ? { body: req, duplex: 'half' } : {}),
      redirect: 'manual'
    });

    res.status(response.status);
    for (const name of ['cache-control', 'content-type', 'content-disposition', 'etag', 'vary']) {
      const value = response.headers.get(name);
      if (value) res.set(name, value);
    }
    const cookies = response.headers.getSetCookie?.();
    if (cookies?.length) res.setHeader('Set-Cookie', cookies);
    res.set('Cache-Control', 'private, no-store, max-age=0');
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Worker API proxy request failed:', error);
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: 'The API service is temporarily unavailable. Please retry.' });
    }
  }
}

app.use('/api', (req, res) => proxyToWorker(req, res));
app.get('/health', (req, res) => proxyToWorker(req, res, '/health'));
app.get('/', (req, res) => res.redirect(302, '/marketplace'));
app.use(express.static(path.join(directory, 'public'), { extensions: ['html'] }));

app.listen(port, () => {
  console.log(`Surge Listings is listening on port ${port}`);
});

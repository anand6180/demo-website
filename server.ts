import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { seedDatabaseIfEmpty } from './server/seed.ts';
import { createApiRouter } from './server/routes.ts';

async function startServer() {
  seedDatabaseIfEmpty();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  // Dynamic SEO Sitemap & Robots endpoints
  app.get('/sitemap.xml', (req, res) => {
    const rawOrigin =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL.replace(/\/$/, '')
        : `${req.protocol}://${req.get('host')}`;
    const lastmod = new Date().toISOString().slice(0, 10);
    const routes = [
      { path: '/', changefreq: 'weekly', priority: '1.0' },
      { path: '/about', changefreq: 'monthly', priority: '0.8' },
      { path: '/experiences', changefreq: 'weekly', priority: '0.9' },
      { path: '/games', changefreq: 'weekly', priority: '0.8' },
      { path: '/pricing', changefreq: 'weekly', priority: '0.9' },
      { path: '/cafe', changefreq: 'weekly', priority: '0.8' },
      { path: '/events', changefreq: 'weekly', priority: '0.8' },
      { path: '/gallery', changefreq: 'monthly', priority: '0.7' },
      { path: '/contact', changefreq: 'monthly', priority: '0.8' },
      { path: '/book', changefreq: 'daily', priority: '1.0' },
      { path: '/legal', changefreq: 'yearly', priority: '0.4' },
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
      .map(
        (r) =>
          `  <url>\n    <loc>${rawOrigin}${r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
      )
      .join('\n')}\n</urlset>\n`;
    res.type('application/xml').send(xml);
  });

  app.get('/robots.txt', (req, res) => {
    const rawOrigin =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL.replace(/\/$/, '')
        : `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${rawOrigin}/sitemap.xml\n`
    );
  });

  // Mount API routes
  app.use('/api', createApiRouter());

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '7d' }));
    // Serve generated assets in production if referenced directly
    app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Infinity Gaming Zone & Cafe server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

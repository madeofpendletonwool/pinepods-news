import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createPostStore } from './posts.js';
import { buildFeed, escapeXml } from './feed.js';
import { homePage, postPage, notFoundPage } from './views.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https: data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
].join('; ');

export function createApp({
    postsDir = process.env.POSTS_DIR || path.join(ROOT, 'posts'),
    siteUrl = (process.env.SITE_URL || 'https://news.pinepods.online').replace(/\/+$/, ''),
} = {}) {
    const store = createPostStore(postsDir);
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', true);

    app.use((req, res, next) => {
        res.set({
            'Content-Security-Policy': CSP,
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        });
        next();
    });

    const staticOptions = { maxAge: '7d', index: false, fallthrough: true };
    app.use('/assets', express.static(path.join(ROOT, 'assets'), staticOptions));
    app.use('/static', express.static(path.join(ROOT, 'public'), staticOptions));

    app.get('/favicon.ico', (req, res) => res.redirect(301, '/assets/favicon.png'));

    app.get('/healthz', (req, res) => res.type('text/plain').send('ok'));

    app.get('/', (req, res) => {
        res.set('Cache-Control', 'public, max-age=300');
        res.send(homePage({ posts: store.all(), siteUrl }));
    });

    app.get('/feed.xml', (req, res) => {
        res.set('Cache-Control', 'public, max-age=300');
        res.type('application/rss+xml; charset=utf-8');
        res.send(buildFeed(store.all(), siteUrl));
    });

    // Old feed items linked to "/posts/<file>.md" — keep those links working.
    app.get('/posts/:slug', (req, res, next) => {
        const { slug } = req.params;
        if (slug.endsWith('.md')) {
            const clean = slug.slice(0, -3);
            if (store.find(clean)) return res.redirect(301, `/posts/${encodeURIComponent(clean)}`);
            return next();
        }
        const found = store.find(slug);
        if (!found) return next();
        res.set('Cache-Control', 'public, max-age=300');
        res.send(postPage({ ...found, siteUrl }));
    });

    app.get('/posts', (req, res) => res.redirect(301, '/#releases'));

    app.get('/robots.txt', (req, res) => {
        res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
    });

    app.get('/sitemap.xml', (req, res) => {
        const posts = store.all();
        const urls = [
            { loc: `${siteUrl}/`, lastmod: posts[0]?.date },
            ...posts.map(p => ({ loc: `${siteUrl}/posts/${encodeURIComponent(p.slug)}`, lastmod: p.date })),
        ];
        const body = urls
            .map(u => `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`)
            .join('\n');
        res.type('application/xml').send(
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
        );
    });

    app.use((req, res) => {
        res.status(404).send(notFoundPage({ siteUrl }));
    });

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).type('text/plain').send('Internal server error');
    });

    return app;
}

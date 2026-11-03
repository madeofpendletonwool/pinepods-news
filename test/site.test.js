import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontMatter, renderMarkdown, makeExcerpt, createPostStore } from '../src/posts.js';
import { createApp } from '../src/app.js';

const SITE = 'https://news.pinepods.online';
let server;
let base;

before(async () => {
    const app = createApp({ siteUrl: SITE });
    await new Promise(resolve => {
        server = app.listen(0, resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('parses front matter, including colons in values and CRLF', () => {
    const { frontMatter, body } = parseFrontMatter('---\r\ntitle: Version 1.0.0: Big one  \r\ndate: 2025-01-02\r\n---\r\nHello');
    assert.equal(frontMatter.title, 'Version 1.0.0: Big one');
    assert.equal(frontMatter.date, '2025-01-02');
    assert.equal(body, 'Hello');
});

test('markdown keeps horizontal rules, emphasis and bold intact', () => {
    const html = renderMarkdown('Intro\n\n---\n\n*Reminder:* help out\n\n**Bold** start');
    assert.match(html, /<hr \/>|<hr>/);
    assert.match(html, /<em>Reminder:<\/em>/);
    assert.match(html, /<strong>Bold<\/strong>/);
    assert.doesNotMatch(html, /<li>/);
});

test('markdown is sanitized and external links open safely', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n[x](https://example.com) <img src=x onerror=alert(1)>');
    assert.doesNotMatch(html, /<script|onerror/);
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noopener noreferrer"/);
});

test('excerpt skips headings and truncates', () => {
    const text = makeExcerpt(`# Heading\n\n${'word '.repeat(100)}`, 50);
    assert.ok(text.length <= 51);
    assert.ok(text.endsWith('…'));
    assert.ok(!text.includes('Heading'));
});

test('posts are sorted newest first with version tie-break', () => {
    const posts = createPostStore(new URL('../posts', import.meta.url).pathname).all();
    assert.ok(posts.length > 0);
    for (let i = 1; i < posts.length; i++) assert.ok(posts[i - 1].date >= posts[i].date);
    const i074 = posts.findIndex(p => p.version === '0.7.4');
    const i075 = posts.findIndex(p => p.version === '0.7.5');
    assert.ok(i075 < i074, '0.7.5 should come before 0.7.4 (same date)');
});

test('home page lists releases and shows the correct feed URL', async () => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /https:\/\/news\.pinepods\.online\/feed\.xml/);
    assert.doesNotMatch(html, /vercel\.app/);
    assert.match(html, /href="\/posts\/0\.9\.0"/);
    assert.ok(res.headers.get('content-security-policy'));
});

test('post page renders, legacy .md links redirect', async () => {
    const res = await fetch(`${base}/posts/0.9.0`);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /CarPlay/);

    const legacy = await fetch(`${base}/posts/0.9.0.md`, { redirect: 'manual' });
    assert.equal(legacy.status, 301);
    assert.equal(legacy.headers.get('location'), '/posts/0.9.0');
});

test('unknown pages return 404', async () => {
    assert.equal((await fetch(`${base}/posts/nope`)).status, 404);
    assert.equal((await fetch(`${base}/posts/nope.md`)).status, 404);
    assert.equal((await fetch(`${base}/whatever`)).status, 404);
});

test('feed is valid-looking RSS with stable guids', async () => {
    const res = await fetch(`${base}/feed.xml`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /rss\+xml/);
    const xml = await res.text();
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.match(xml, /<guid isPermaLink="false">https:\/\/news\.pinepods\.online\/posts\/0\.9\.0\.md<\/guid>/);
    assert.match(xml, /<link>https:\/\/news\.pinepods\.online\/posts\/0\.9\.0<\/link>/);
    assert.doesNotMatch(xml, /<script/);
});

test('health, robots and sitemap', async () => {
    assert.equal(await (await fetch(`${base}/healthz`)).text(), 'ok');
    assert.match(await (await fetch(`${base}/robots.txt`)).text(), /Sitemap:/);
    assert.match(await (await fetch(`${base}/sitemap.xml`)).text(), /<loc>https:\/\/news\.pinepods\.online\/posts\/0\.9\.0<\/loc>/);
});

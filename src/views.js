export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const h = escapeHtml;

const GITHUB_URL = 'https://github.com/madeofpendletonwool/PinePods';
const MAIN_SITE_URL = 'https://pinepods.online';
const ASSET_VERSION = '3';

// Dates in front matter are plain YYYY-MM-DD (parsed as UTC), so format in UTC
// to avoid them shifting back a day for visitors west of Greenwich.
const longDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const isoDate = d => d.toISOString().slice(0, 10);

export const icons = {
    logo: `<svg class="logo" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="var(--logo-bg)"/><circle cx="50" cy="50" r="44" fill="none" stroke="var(--logo-fg)" stroke-width="2.6"/><g fill="none" stroke="var(--logo-fg)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M50 21v56M45.5 77.5h9"/><path d="M39 27.4 50 21l11 6.4M34.1 38.5 50 29.3l15.9 9.2M31 48.6 50 37.6l19 11M39 49.9 50 43.5l11 6.4M34.1 61 50 51.8 65.9 61M31 70.6 50 59.6l19 11"/></g></svg>`,
    rss: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.2 19.6a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4ZM4 10.1V7a13 13 0 0 1 13 13h-3.1A9.9 9.9 0 0 0 4 10.1Zm0-5.6V1.4A18.6 18.6 0 0 1 22.6 20h-3.1A15.5 15.5 0 0 0 4 4.5Z"/></svg>`,
    github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0C17.6 4.7 18.6 5 18.6 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5Z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 9h10v10H9zM5 15V5h10"/></svg>`,
    check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5"/></svg>`,
    arrowRight: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/></svg>`,
    arrowLeft: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M19 12H5m6 6-6-6 6-6"/></svg>`,
    search: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m20 20-4.2-4.2M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"/></svg>`,
    theme: `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-moon" fill="currentColor" d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5a8.5 8.5 0 1 0 10.9 10.9Z"/><g class="i-sun" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></svg>`,
    clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
};

function layout({ title, description, path, siteUrl, body, ogType = 'website', jsonLd, extraHead = '' }) {
    const canonical = `${siteUrl}${path}`;
    const fullTitle = title ? `${title} · PinePods News` : 'PinePods News';
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h(fullTitle)}</title>
<meta name="description" content="${h(description)}">
<link rel="canonical" href="${h(canonical)}">
<link rel="alternate" type="application/rss+xml" title="PinePods News" href="${h(siteUrl)}/feed.xml">
<link rel="icon" type="image/png" href="/assets/favicon.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#1b1d1e" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f6f5f2" media="(prefers-color-scheme: light)">
<meta property="og:site_name" content="PinePods News">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${h(title || 'PinePods News')}">
<meta property="og:description" content="${h(description)}">
<meta property="og:url" content="${h(canonical)}">
<meta property="og:image" content="${h(siteUrl)}/assets/pinepods-logo.jpeg">
<meta name="twitter:card" content="summary">
${extraHead}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap">
<link rel="stylesheet" href="/static/styles.css?v=${ASSET_VERSION}">
<script src="/static/theme.js?v=${ASSET_VERSION}"></script>
<script src="/static/app.js?v=${ASSET_VERSION}" defer></script>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="PinePods News home">${icons.logo}<span>PinePods <em>News</em></span></a>
    <nav class="site-nav" aria-label="Main">
      <a href="/#releases">Releases</a>
      <a href="${MAIN_SITE_URL}" rel="noopener">pinepods.online</a>
      <a class="icon-link" href="${GITHUB_URL}" rel="noopener" aria-label="PinePods on GitHub">${icons.github}</a>
      <a class="icon-link" href="/feed.xml" aria-label="RSS feed">${icons.rss}</a>
      <button class="icon-link theme-toggle" type="button" aria-label="Toggle colour theme">${icons.theme}</button>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">${icons.logo}<div><strong>PinePods</strong><span>A forest of podcasts, rooted in the spirit of self-hosting.</span></div></div>
    <nav aria-label="Footer">
      <a href="${MAIN_SITE_URL}" rel="noopener">Website</a>
      <a href="${MAIN_SITE_URL}/docs/intro" rel="noopener">Docs</a>
      <a href="${GITHUB_URL}" rel="noopener">GitHub</a>
      <a href="${GITHUB_URL}/releases" rel="noopener">Releases</a>
      <a href="/feed.xml">RSS</a>
    </nav>
    <p class="copyright">© 2024–${new Date().getUTCFullYear()} Collin Pendleton · Open source under GPL-3.0</p>
  </div>
</footer>
</body>
</html>`;
}

function versionBadge(post, extraClass = '') {
    return post.version ? `<span class="badge ${extraClass}">v${h(post.version)}</span>` : `<span class="badge badge-muted ${extraClass}">News</span>`;
}

function postMeta(post) {
    return `<time datetime="${isoDate(post.date)}">${longDate.format(post.date)}</time><span class="dot" aria-hidden="true"></span><span class="read-time">${icons.clock}${post.readingMinutes} min read</span>`;
}

function subscribeBox(siteUrl, { compact = false } = {}) {
    const feedUrl = `${siteUrl}/feed.xml`;
    return `<div class="subscribe${compact ? ' subscribe-compact' : ''}">
  <div class="subscribe-label">${icons.rss}<span>Subscribe in any podcast app or RSS reader</span></div>
  <div class="feed-field">
    <code class="feed-url" id="feed-url">${h(feedUrl)}</code>
    <button class="btn btn-primary copy-btn" type="button" data-copy="${h(feedUrl)}" aria-describedby="feed-url">
      <span class="copy-idle">${icons.copy}Copy</span><span class="copy-done">${icons.check}Copied</span>
    </button>
  </div>
  <p class="subscribe-note">Running PinePods? You're already subscribed — this feed is added automatically on first launch.</p>
</div>`;
}

function releaseRow(post) {
    const searchText = `${post.title} ${post.excerpt}`.toLowerCase();
    return `<li class="release" data-search="${h(searchText)}">
  <a href="/posts/${encodeURIComponent(post.slug)}">
    <div class="release-date"><time datetime="${isoDate(post.date)}">${shortDate.format(post.date)}</time></div>
    <div class="release-body">
      <div class="release-heading">${versionBadge(post)}<h3>${h(post.headline || post.title)}</h3></div>
      <p>${h(post.excerpt)}</p>
    </div>
    <span class="release-arrow">${icons.arrowRight}</span>
  </a>
</li>`;
}

export function homePage({ posts, siteUrl }) {
    const [latest] = posts;
    const byYear = new Map();
    for (const post of posts) {
        const year = post.date.getUTCFullYear();
        if (!byYear.has(year)) byYear.set(year, []);
        byYear.get(year).push(post);
    }

    const featured = latest
        ? `<section class="wrap featured" aria-labelledby="latest-heading">
  <a class="featured-card" href="/posts/${encodeURIComponent(latest.slug)}">
    <div class="featured-top"><span class="eyebrow" id="latest-heading">Latest release</span>${versionBadge(latest, 'badge-lg')}</div>
    <h2>${h(latest.headline || latest.title)}</h2>
    <p>${h(latest.excerpt)}</p>
    <div class="featured-foot"><div class="meta">${postMeta(latest)}</div><span class="btn btn-ghost">Read the release notes${icons.arrowRight}</span></div>
  </a>
</section>`
        : '';

    const archive = [...byYear.entries()]
        .map(([year, list]) => `<section class="year" data-year>
  <h2 class="year-label">${year}</h2>
  <ol class="release-list">${list.map(releaseRow).join('\n')}</ol>
</section>`)
        .join('\n');

    const body = `<section class="hero">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="wrap hero-inner">
    <span class="eyebrow">The official PinePods release feed</span>
    <h1>What's new in <span class="accent">PinePods</span></h1>
    <p class="lede">Release notes, new features and project news for the self-hosted podcast manager — delivered right into your podcast app.</p>
    ${subscribeBox(siteUrl)}
  </div>
</section>
${featured}
<section class="wrap archive" id="releases" aria-labelledby="archive-heading">
  <div class="archive-head">
    <h2 id="archive-heading">All releases <span class="count">${posts.length}</span></h2>
    <label class="search">${icons.search}<span class="sr-only">Filter releases</span><input type="search" id="release-filter" placeholder="Filter releases…" autocomplete="off"></label>
  </div>
  ${archive}
  <p class="empty" id="filter-empty" hidden>No releases match that filter.</p>
</section>`;

    return layout({
        title: '',
        description: 'Release notes and news for PinePods, the self-hosted podcast manager. Subscribe to the feed in any podcast app.',
        path: '/',
        siteUrl,
        body,
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'PinePods News',
            url: siteUrl,
        },
    });
}

export function postPage({ post, newer, older, siteUrl }) {
    const pager = (p, dir) => {
        if (!p) return '<span></span>';
        return `<a class="pager-link pager-${dir}" href="/posts/${encodeURIComponent(p.slug)}">
  <span class="pager-dir">${dir === 'older' ? `${icons.arrowLeft}Older` : `Newer${icons.arrowRight}`}</span>
  <span class="pager-title">${p.version ? `v${h(p.version)} · ` : ''}${h(p.headline || p.title)}</span>
</a>`;
    };

    const body = `<article class="wrap article">
  <a class="back-link" href="/#releases">${icons.arrowLeft}All releases</a>
  <header class="article-head">
    <div class="article-badges">${versionBadge(post, 'badge-lg')}</div>
    <h1>${h(post.headline || post.title)}</h1>
    ${post.headline && post.version ? `<p class="article-sub">PinePods ${h(post.version)}</p>` : ''}
    <div class="meta">${postMeta(post)}</div>
  </header>
  <div class="prose">
${post.html}
  </div>
  <aside class="article-cta">
    <div>
      <h2>Never miss a release</h2>
      <p>Add the PinePods News feed to your podcast app to get every update as it lands.</p>
    </div>
    ${subscribeBox(siteUrl, { compact: true })}
  </aside>
  <nav class="pager" aria-label="More releases">
    ${pager(older, 'older')}
    ${pager(newer, 'newer')}
  </nav>
</article>`;

    return layout({
        title: post.title,
        description: post.excerpt,
        path: `/posts/${encodeURIComponent(post.slug)}`,
        siteUrl,
        body,
        ogType: 'article',
        extraHead: `<meta property="article:published_time" content="${post.date.toISOString()}">`,
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date.toISOString(),
            author: { '@type': 'Person', name: 'Collin Pendleton' },
            publisher: { '@type': 'Organization', name: 'PinePods', logo: `${siteUrl}/assets/pinepods-logo.jpeg` },
            image: `${siteUrl}/assets/pinepods-logo.jpeg`,
            mainEntityOfPage: `${siteUrl}/posts/${encodeURIComponent(post.slug)}`,
        },
    });
}

export function notFoundPage({ siteUrl }) {
    const body = `<section class="wrap not-found">
  ${icons.logo}
  <span class="eyebrow">404</span>
  <h1>Lost in the forest</h1>
  <p>That page doesn't exist — maybe it was never planted.</p>
  <a class="btn btn-primary" href="/">Back to the news${icons.arrowRight}</a>
</section>`;
    return layout({ title: 'Page not found', description: 'Page not found.', path: '/404', siteUrl, body });
}

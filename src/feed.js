export function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function el(name, content, attrs = {}) {
    const attrString = Object.entries(attrs)
        .map(([k, v]) => ` ${k}="${escapeXml(v)}"`)
        .join('');
    if (content === undefined || content === null) return `<${name}${attrString}/>`;
    if (Array.isArray(content)) {
        // No re-indenting: it would alter whitespace inside <pre> blocks in post HTML.
        return `<${name}${attrString}>\n${content.join('\n')}\n</${name}>`;
    }
    return `<${name}${attrString}>${escapeXml(content)}</${name}>`;
}

const DESCRIPTION =
    'The official podcast feed for Pinepods release updates and news. Get notified about every new release directly in your podcast app.';

export function buildFeed(posts, siteUrl) {
    const logo = `${siteUrl}/assets/pinepods-logo.jpeg`;

    const items = posts.map(post => {
        const description = `Pinepods Release Update: ${post.title}`;
        // NOTE: the guid intentionally keeps the original "/posts/<file>.md" form so
        // existing subscribers don't see every episode re-appear as new.
        const guid = `${siteUrl}/posts/${post.file}`;
        return el('item', [
            el('title', post.title),
            el('link', `${siteUrl}/posts/${post.slug}`),
            el('guid', guid, { isPermaLink: 'false' }),
            el('description', description),
            el('content:encoded', post.html),
            el('author', 'news@pinepods.online (Collin Pendleton)'),
            el('pubDate', post.date.toUTCString()),
            el('itunes:explicit', 'no'),
            el('itunes:author', 'Collin Pendleton'),
            el('itunes:subtitle', description),
            el('itunes:summary', post.html),
            el('itunes:image', null, { href: post.image || logo }),
            el('itunes:keywords', 'pinepods,podcast,app,release,update,news'),
        ]);
    });

    const lastBuild = posts[0]?.date ?? new Date();

    const channel = el('channel', [
        el('title', 'Pinepods News Podcast'),
        el('link', siteUrl),
        el('language', 'en-US'),
        el('copyright', `© 2024–${new Date().getUTCFullYear()} Collin Pendleton`),
        el('description', DESCRIPTION),
        el('lastBuildDate', lastBuild.toUTCString()),
        el('atom:link', null, { href: `${siteUrl}/feed.xml`, rel: 'self', type: 'application/rss+xml' }),
        el('image', [
            el('url', logo),
            el('title', 'Pinepods News Podcast'),
            el('link', siteUrl),
            el('width', '1200'),
            el('height', '1200'),
        ]),
        el('itunes:image', null, { href: logo }),
        el('itunes:author', 'Collin Pendleton'),
        el('itunes:summary', DESCRIPTION),
        el('itunes:subtitle', 'Pinepods App Release Updates'),
        el('itunes:owner', [
            el('itunes:name', 'Collin Pendleton'),
            el('itunes:email', 'news@pinepods.online'),
        ]),
        el('itunes:explicit', 'no'),
        el('itunes:type', 'episodic'),
        el('itunes:category', [el('itunes:category', null, { text: 'Software How-To' })], { text: 'Technology' }),
        el('itunes:category', null, { text: 'News' }),
        el('itunes:keywords', 'pinepods,podcast,app,release,update,news,technology,software'),
        ...items,
    ]);

    const rss = el('rss', [channel], {
        version: '2.0',
        'xmlns:atom': 'http://www.w3.org/2005/Atom',
        'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
        'xmlns:itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        'xmlns:podcast': 'https://podcastindex.org/namespace/1.0',
    });

    return `<?xml version="1.0" encoding="UTF-8"?>\n${rss}\n`;
}

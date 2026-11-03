import fs from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const md = new MarkdownIt({
    html: true,
    // Older posts rely on single newlines being line breaks.
    breaks: true,
    linkify: true,
    typographer: true,
});

const SANITIZE_OPTIONS = {
    allowedTags: [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'br',
        'strong', 'em', 'del', 's', 'ul', 'ol', 'li', 'a', 'img',
        'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'title'],
        th: ['style'],
        td: ['style'],
    },
    allowedStyles: {
        '*': { 'text-align': [/^(left|right|center)$/] },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
        a: (tagName, attribs) => {
            if (/^https?:\/\//i.test(attribs.href || '')) {
                return {
                    tagName,
                    attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
                };
            }
            return { tagName, attribs };
        },
    },
};

/**
 * Parse a simple YAML-ish front matter block (`key: value` lines between `---`).
 */
export function parseFrontMatter(content) {
    const lines = content.replace(/^﻿/, '').split(/\r?\n/);
    const frontMatter = {};
    let i = 0;

    if (lines[0]?.trim() === '---') {
        i++;
        while (i < lines.length && lines[i].trim() !== '---') {
            const line = lines[i];
            const sep = line.indexOf(':');
            if (sep > 0) {
                const key = line.slice(0, sep).trim();
                let value = line.slice(sep + 1).trim();
                value = value.replace(/^(['"])(.*)\1$/, '$2');
                frontMatter[key] = value;
            }
            i++;
        }
        i++;
    }
    return { frontMatter, body: lines.slice(i).join('\n').trim() };
}

export function renderMarkdown(markdown) {
    return sanitizeHtml(md.render(markdown), SANITIZE_OPTIONS);
}

function stripTags(html) {
    return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

/** First real paragraph of the post as plain text, truncated on a word boundary. */
export function makeExcerpt(markdown, maxLength = 240) {
    const tokens = md.parse(markdown, {});
    const paragraphs = [];
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === 'paragraph_open' && tokens[i + 1]?.type === 'inline') {
            paragraphs.push({ topLevel: tokens[i].level === 0, text: stripTags(md.renderInline(tokens[i + 1].content)) });
        }
    }
    // Prefer a substantial top-level paragraph, then any substantial one (e.g. a list item).
    const text = (
        paragraphs.find(p => p.topLevel && p.text.length > 40) ||
        paragraphs.find(p => p.text.length > 40) ||
        paragraphs[0] || { text: '' }
    ).text;
    if (text.length <= maxLength) return text;
    const cut = text.slice(0, maxLength);
    return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:!-]+$/, '')}…`;
}

function compareVersions(a, b) {
    const pa = (a || '0').split('.').map(Number);
    const pb = (b || '0').split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff) return diff;
    }
    return 0;
}

function loadPost(postsDir, file) {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
    const { frontMatter, body } = parseFrontMatter(raw);
    const slug = path.basename(file, '.md');
    const title = frontMatter.title || slug;
    const date = frontMatter.date ? new Date(frontMatter.date) : new Date(0);
    const html = renderMarkdown(body);
    const words = stripTags(html).split(' ').filter(Boolean).length;
    const version = title.match(/\d+\.\d+\.\d+/)?.[0] || null;

    // Titles look like "Version 0.9.0 - Video, CarPlay..." / "Version 0.6.6 Released! People search...".
    // Pull out the human part for nicer headings.
    let headline = title
        .replace(/^version\s+\d+\.\d+\.\d+\s*/i, '')
        .replace(/^released!?\s*/i, '')
        .replace(/^[-–—:]\s*/, '')
        .trim();
    if (!headline || headline === title) headline = version ? '' : title;

    return {
        file,
        slug,
        title,
        headline,
        version,
        date,
        image: frontMatter.image || null,
        body,
        html,
        excerpt: frontMatter.description || makeExcerpt(body),
        readingMinutes: Math.max(1, Math.round(words / 220)),
    };
}

/**
 * Loads posts from disk and caches them. The cache is invalidated whenever a
 * file in the posts directory is added, removed or modified, so posts can be
 * mounted as a volume and edited without restarting the server.
 */
export function createPostStore(postsDir) {
    let signature = null;
    let posts = [];

    function currentSignature(files) {
        return files
            .map(f => `${f}:${fs.statSync(path.join(postsDir, f)).mtimeMs}`)
            .join('|');
    }

    function all() {
        const files = fs.readdirSync(postsDir).filter(f => path.extname(f) === '.md');
        const sig = currentSignature(files);
        if (sig !== signature) {
            posts = files
                .map(f => loadPost(postsDir, f))
                .sort((a, b) => (b.date - a.date) || compareVersions(b.version, a.version));
            signature = sig;
        }
        return posts;
    }

    function find(slug) {
        const list = all();
        const index = list.findIndex(p => p.slug === slug);
        if (index === -1) return null;
        return { post: list[index], newer: list[index - 1] || null, older: list[index + 1] || null };
    }

    return { all, find };
}

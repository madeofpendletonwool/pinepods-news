const express = require('express');
const { toXML } = require('jstoxml');
const MarkdownIt = require('markdown-it');
const sanitizeHtml = require('sanitize-html');
const fs = require('fs-extra');
const path = require('path');

// Configure markdown-it with base options only
const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
});

const app = express();

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

function parseFrontMatter(content) {
    const lines = content.split('\n');
    const frontMatter = {};
    let i = 0;

    if (lines[0].trim() === '---') {
        i++;
        while (i < lines.length && lines[i].trim() !== '---') {
            const line = lines[i];
            const [key, ...valueParts] = line.split(':').map(part => part.trim());
            frontMatter[key] = valueParts.join(':');
            i++;
        }
        i++;
    }
    return { frontMatter, body: lines.slice(i).join('\n') };
}

function processContent(content) {
    // Pre-process content for better formatting
    content = content
        // Add spacing around headers
        .replace(/^(#{1,6}.*)/gm, '\n\n$1\n\n')
        // Ensure proper spacing for lists
        .replace(/^[-*]\s*/gm, '\n* ')
        // Normalize multiple line breaks
        .replace(/\n{3,}/g, '\n\n')
        // Ensure paragraphs have proper spacing
        .replace(/\n\n/g, '\n\n');

    // Convert markdown to HTML
    let html = md.render(content);

    // Clean up the HTML
    html = sanitizeHtml(html, {
        allowedTags: [
            'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'strong', 'em', 'ul', 'ol', 'li', 'a', 'br',
            'img', 'blockquote', 'code', 'pre'
        ],
        allowedAttributes: {
            'a': ['href', 'target'],
            'img': ['src', 'alt', 'title'],
        }
    });

    return html;
}

function createFeed() {
    const items = [];
    const postFiles = fs.readdirSync(path.join(__dirname, 'posts'))
        .filter(file => path.extname(file) === '.md')
        .sort((a, b) => {
            const contentA = fs.readFileSync(path.join(__dirname, 'posts', a), 'utf8');
            const contentB = fs.readFileSync(path.join(__dirname, 'posts', b), 'utf8');
            const dateA = new Date(parseFrontMatter(contentA).frontMatter.date);
            const dateB = new Date(parseFrontMatter(contentB).frontMatter.date);
            return dateB - dateA;
        });

    postFiles.forEach(file => {
        const filePath = path.join(__dirname, 'posts', file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { frontMatter, body } = parseFrontMatter(content);
        
        const htmlContent = processContent(body);

        const item = {
            title: frontMatter.title || path.basename(file, '.md'),
            link: `http://news.pinepods.online/posts/${file}`,
            guid: {
                _attrs: {
                    isPermaLink: "false"
                },
                _content: `http://news.pinepods.online/posts/${file}`
            },
            description: htmlContent,
            "content:encoded": htmlContent,
            author: "Collin Pendleton",
            pubDate: new Date(frontMatter.date || new Date()).toUTCString(),
            "itunes:explicit": "no",
            "itunes:author": "Collin Pendleton",
            "itunes:image": {
                _attrs: {
                    href: frontMatter.image || "https://news.pinepods.online/assets/pinepods-logo.jpeg"
                }
            }
        };

        items.push({ item });
    });

    const channel = {
        title: "Pinepods News Feed",
        link: "https://news.pinepods.online",
        language: "en-US",
        description: "This feed is a news feed for Pinepods. I release articles detailing every new release.",
        "atom:link": {
            _attrs: {
                href: "https://news.pinepods.online/feed.xml",
                rel: "self",
                type: "application/rss+xml"
            }
        },
        image: {
            url: "https://news.pinepods.online/assets/pinepods-logo.jpeg",
            title: "Pinepods News Feed",
            link: "https://news.pinepods.online"
        },
        "itunes:image": {
            _attrs: {
                href: "https://news.pinepods.online/assets/pinepods-logo.jpeg"
            }
        },
        "itunes:author": "Collin Pendleton",
        "itunes:explicit": "no",
        "itunes:category": [
            { _attrs: { text: "Technology" } },
            { _attrs: { text: "Tech News" } }
        ],
        item: items
    };

    return {
        _name: 'rss',
        _attrs: {
            version: "2.0",
            "xmlns:atom": "http://www.w3.org/2005/Atom",
            "xmlns:content": "http://purl.org/rss/1.0/modules/content/",
            "xmlns:itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd"
        },
        _content: {
            channel
        }
    };
}

app.get('/feed.xml', (req, res) => {
    const feed = createFeed();
    const xmlOptions = {
        header: true,
        indent: '  '
    };
    res.type('application/xml');
    res.send(toXML(feed, xmlOptions));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
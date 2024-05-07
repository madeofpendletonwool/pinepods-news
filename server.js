const express = require('express');
const { toXML } = require('jstoxml');
const MarkdownIt = require('markdown-it');
const fs = require('fs-extra');
const path = require('path');
const md = new MarkdownIt();

function parseFrontMatter(content) {
    const lines = content.split('\n');
    const frontMatter = {};
    let i = 0;

    if (lines[0].trim() === '---') {
        i++;
        while (i < lines.length && lines[i].trim() !== '---') {
            const line = lines[i];
            const [key, value] = line.split(':').map(part => part.trim());
            frontMatter[key] = value;
            i++;
        }
        i++;
    }
    return { frontMatter, body: lines.slice(i).join('\n') };
}

function createFeed() {
    const items = [];
    const postFiles = fs.readdirSync(path.join(__dirname, 'posts')).filter(file => path.extname(file) === '.md');

    postFiles.forEach(file => {
        const filePath = path.join(__dirname, 'posts', file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { frontMatter, body } = parseFrontMatter(content);
        const htmlContent = md.render(body);

        items.push({
            item: {
                title: frontMatter.title || path.basename(file, '.md'),
                link: `http://news.pinepods.online/posts/${file}`,
                description: htmlContent,
                author: "Collin Pendleton",
                pubDate: new Date(frontMatter.date || new Date()).toISOString(),
                "itunes:explicit": "no",
                "itunes:author": "Collin Pendleton",
                "itunes:image": {
                    _attrs: {
                        href: "https://news.pinepods.online/assets/pinepods-logo.jpeg"
                    }
                }
            }
        });
    });

    return {
        rss: {
            _attrs: {
                version: "2.0",
                "xmlns:atom": "http://www.w3.org/2005/Atom",
                "xmlns:content": "http://purl.org/rss/1.0/modules/content/",
                "xmlns:itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd"
            },
            channel: {
                title: "Pinepods News Feed",
                description: "This feed is a news feed for Pinepods. I release articles detailing every new release.",
                link: "https://news.pinepods.online",
                "atom:link": {
                    _attrs: {
                        href: "https://news.pinepods.online/feed.xml",
                        rel: "self",
                        type: "application/rss+xml"
                    }
                },
                "itunes:author": "Collin Pendleton",
                "itunes:explicit": "no",
                "itunes:image": {
                    _attrs: {
                        href: "https://news.pinepods.online/assets/pinepods-logo.jpeg"
                    }
                },
                "itunes:category": [
                    { _attrs: { text: "Technology" } },
                    { _attrs: { text: "Tech News" } }
                ],
                item: items
            }
        }
    };
}

const app = express();
app.get('/feed.xml', (req, res) => {
    const feed = createFeed();
    const xmlOptions = {
        header: true,
        indent: '  '
    };
    res.type('application/xml');
    res.send(toXML(feed, xmlOptions));
});

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

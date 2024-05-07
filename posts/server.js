const express = require('express');
const { Feed } = require('rss');
const MarkdownIt = require('markdown-it');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const md = new MarkdownIt();

const feed = new Feed({
    title: "Pinepods News Feed",
    description: "This feed is a news feed for Pinepods. I release articles detailing every new release.",
    link: "https://news.pinepods.online/feed.xml",
    image: "https://news.pinepods.online/assets/pinepods-logo.jpeg",
});

// Read markdown files and add them to the feed
fs.readdirSync(path.join(__dirname, 'posts')).forEach(file => {
    if (path.extname(file) === '.md') {
        const filePath = path.join(__dirname, 'posts', file);
        const content = fs.readFileSync(filePath, 'utf8');
        const htmlContent = md.render(content);

        feed.addItem({
            title: path.basename(file, '.md'),
            link: `http://news.pinepods.online/posts/${file}`,
            description: htmlContent,
            author: [
                {
                    name: "Collin Pendleton",
                    email: "collinp@gooseberrydevelopment.com",
                    link: "https://pinepods.online"
                }
            ],
        });
    }
});

// Serve the RSS feed
app.get('/feed.xml', (req, res) => {
    res.type('application/xml');
    res.send(feed.xml());
});

// Serve static files from assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

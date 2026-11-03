# PinePods News

The news site and podcast/RSS feed for [PinePods](https://github.com/madeofpendletonwool/PinePods), served at **https://news.pinepods.online**.

Every PinePods server subscribes to the feed at `https://news.pinepods.online/feed.xml` on first launch, so each release post shows up as an episode in the app. The same posts are rendered as articles on the website.

## Writing a post

Add a Markdown file to `posts/` with front matter:

```markdown
---
title: Version 1.0.0 - Short headline for the release
date: 2026-01-31
---

Post body in Markdown…
```

- The filename (minus `.md`) becomes the URL: `posts/1.0.0.md` → `/posts/1.0.0`.
- Posts are ordered by `date`, newest first. Posts on the same date fall back to the version number in the title.
- Optional front matter: `description` (overrides the auto-generated excerpt) and `image` (per-episode artwork in the feed).
- **Don't rename existing post files.** The feed GUID is derived from the filename; renaming one makes podcast apps treat it as a new episode.

## Running

```sh
npm install
npm run dev      # http://localhost:3000, restarts on code changes
npm test
```

### Docker

```sh
docker compose up -d --build   # http://localhost:8094
```

| Variable    | Default                        | Purpose                                         |
|-------------|--------------------------------|-------------------------------------------------|
| `PORT`      | `3000`                         | Port the server listens on                      |
| `SITE_URL`  | `https://news.pinepods.online` | Public URL used in the feed, canonical links and sitemap |
| `POSTS_DIR` | `./posts`                      | Where posts are read from                       |

Posts are re-read whenever a file in the posts directory changes, so you can mount `./posts` into the container (see `docker-compose.yml`) and publish without rebuilding.

## Routes

| Path            | What                                             |
|-----------------|--------------------------------------------------|
| `/`             | Home page: subscribe box, latest release, archive |
| `/posts/:slug`  | Article page (`/posts/:slug.md` redirects here)  |
| `/feed.xml`     | Podcast/RSS feed                                 |
| `/sitemap.xml`, `/robots.txt`, `/healthz` | SEO and health check   |

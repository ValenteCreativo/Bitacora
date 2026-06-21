# Bitácora — Open-source Personal Knowledge Harbor

## 0. Product Vision

**Bitácora** is an open-source, self-hostable knowledge harbor that helps people save links, notes, references and discoveries, then automatically maps relationships between them.

It is inspired by tools like Are.na and Obsidian, but it has its own identity:

```txt
Are.na = save and organize blocks
Obsidian = connect knowledge through graphs
Bitácora = save first, understand later
```

Core idea:

> Bitácora is a self-hosted knowledge harbor that automatically maps relationships between your ideas, links, notes and discoveries. Save first. Understand later.

This sentence should guide the README, landing page and product tone.

---

## 1. Main Goal

Build a minimal, elegant, open-source webapp where a user can:

- Save links quickly.
- Save notes and text blocks.
- Organize blocks into collections, channels and tags.
- Automatically generate previews from metadata.
- Automatically discover relationships between saved blocks.
- View an Obsidian-like knowledge graph.
- Search and browse their personal internet memory.
- Keep their archive private through simple authentication.
- Deploy it for free or almost free.
- Use it personally without artificial block limits.

---

## 2. Open-source Philosophy

Bitácora should be built as an open-source tool that anyone can fork, deploy and use for themselves.

The app should be personal-first:

- One person can deploy their own Bitácora.
- No vendor lock-in.
- No artificial limit on saved blocks.
- No forced social network.
- No paid premium tier.
- No tracking.
- No public feed by default.
- Private by default.

README should include:

```md
# Bitácora

Bitácora is an open-source, self-hostable knowledge harbor that automatically maps relationships between your ideas, links, notes and discoveries.

Save first. Understand later.
```

Suggested README sections:

```txt
What is Bitácora?
Why another knowledge tool?
Features
Screenshots
Tech stack
Quick start
Environment variables
Database setup
Deploy to Vercel
Deploy locally
Authentication
Roadmap
Contributing
License
```

Suggested license:

```txt
MIT License
```

---

## 3. Name and Brand Direction

Product name:

```txt
Bitácora
```

Meaning:

A logbook, a record of a journey, a place where discoveries are written down while navigating.

Product metaphor:

```txt
Knowledge harbor
Navigation
Exploration
Personal archive
Internet memory palace
Living map of curiosity
```

Product tagline options:

```txt
Save first. Understand later.
A personal knowledge harbor.
A living map of your curiosity.
An open-source memory palace for the web.
```

Tone:

```txt
Minimal
Poetic
Calm
Editorial
Useful
Personal
Open-source
```

Avoid:

```txt
Corporate SaaS tone
Crypto vibes
Overly social network language
Cluttered productivity jargon
```

---

## 4. Core Concepts

### 4.1 Block

A block is any saved piece of knowledge.

MVP block types:

```txt
LINK
TEXT
```

Future block types:

```txt
IMAGE
PDF
VIDEO
FILE
EMBED
QUOTE
BOOK
PAPER
```

Examples:

```txt
A GitHub repo
A paper
A tweet/thread
A YouTube video
A personal note
A quote
An article
A project reference
```

---

### 4.2 Collection

A collection is a high-level expedition or life/project area.

Examples:

```txt
Doctorado
Portfolio
Jarvis
Hackathons
Ciberseguridad
Música
Clientes
Investigación ambiental
```

Collections contain channels.

---

### 4.3 Channel

A channel is a thematic playlist of ideas.

Examples:

```txt
Forecasting
DePIN
Sensores
AI Tools
Visual Inspiration
Read Later
Tesis
Matemáticas
```

Channels belong to a collection, but a channel can also exist without a collection.

A block can belong to multiple channels.

---

### 4.4 Tag

Tags are lightweight labels.

Examples:

```txt
#paper
#github
#tool
#idea
#video
#research
#client
#inspiration
```

A block can have multiple tags.

---

### 4.5 Edge

An edge is a relationship between two nodes.

Nodes can be:

```txt
Block
Channel
Tag
Collection
```

Edges can be:

```txt
BLOCK_IN_CHANNEL
BLOCK_HAS_TAG
CHANNEL_IN_COLLECTION
BLOCK_RELATED_TO_BLOCK
BLOCK_SIMILAR_TO_BLOCK
BLOCK_SAME_DOMAIN_AS_BLOCK
BLOCK_SHARED_KEYWORD_WITH_BLOCK
```

Edges can be explicit or automatic.

---

## 5. Main Product Experience

User flow:

```txt
Find something interesting
↓
Open Bitácora
↓
Paste link or note
↓
Save
↓
Bitácora extracts metadata
↓
Bitácora suggests tags/channels
↓
Bitácora automatically connects it to related blocks
↓
The graph grows over time
```

The user should not have to manually build the graph.

The graph should emerge from saved content.

---

## 6. MVP Technical Stack

Recommended stack:

```txt
Next.js
TypeScript
Tailwind CSS
Turso
Drizzle ORM
Vercel
```

Do not use:

```txt
Neon
Vercel Blob
Complex cloud storage
Paid APIs for MVP
```

Reason for Turso:

- Free tier.
- SQLite/libSQL compatible.
- Simple.
- Good for personal tools.
- Works well with Drizzle and Next.js.
- Avoids Postgres complexity for this use case.

For preview images:

- Do not upload/store images in MVP.
- Store only remote `imageUrl` from metadata.
- Render external preview image from its original source.

---

## 7. Authentication

The app must be private by default.

Even if the app is deployed publicly on Vercel, nobody should see the user’s blocks, channels or graph without logging in.

### MVP Auth

Use simple email/password authentication.

Recommended approach:

```txt
Credentials-based auth
HTTP-only session cookie
Protected routes
Protected API endpoints
```

Acceptable implementations:

Option A:

```txt
Auth.js Credentials Provider
```

Option B:

```txt
Custom minimal auth
bcrypt password hash
signed HTTP-only cookie
middleware route protection
```

For speed, use Auth.js if it does not overcomplicate the MVP.

### Environment Variables

```env
ADMIN_EMAIL="your-email@example.com"
ADMIN_PASSWORD="change-this-password"
SESSION_SECRET="random-long-secret"
```

Better version:

On first deploy, create the admin user from environment variables and store password hash in DB.

Do not store plaintext passwords in the DB.

### Protected Routes

Protect:

```txt
/app
/app/*
/settings
/api/blocks
/api/channels
/api/collections
/api/tags
/api/graph
```

Public routes allowed:

```txt
/
/login
/api/auth/*
```

Landing page can be public.

Everything personal must require login.

---

## 8. Database Schema

Use Drizzle ORM with Turso/libSQL.

### 8.1 users

```ts
users {
  id: text primary key
  email: text unique not null
  name: text
  passwordHash: text not null
  createdAt: integer not null
  updatedAt: integer not null
}
```

---

### 8.2 collections

```ts
collections {
  id: text primary key
  name: text not null
  slug: text unique not null
  description: text
  color: text
  icon: text
  visibility: text default "PRIVATE" // PRIVATE, PUBLIC, UNLISTED
  createdById: text references users(id)
  createdAt: integer not null
  updatedAt: integer not null
}
```

---

### 8.3 channels

```ts
channels {
  id: text primary key
  name: text not null
  slug: text unique not null
  description: text
  collectionId: text references collections(id)
  visibility: text default "PRIVATE" // PRIVATE, PUBLIC, UNLISTED
  createdById: text references users(id)
  createdAt: integer not null
  updatedAt: integer not null
}
```

---

### 8.4 blocks

```ts
blocks {
  id: text primary key
  type: text not null // LINK, TEXT, IMAGE, VIDEO, PDF, FILE, EMBED, QUOTE, PAPER

  title: text
  content: text
  url: text
  normalizedUrl: text

  description: text
  imageUrl: text
  faviconUrl: text
  siteName: text
  domain: text
  contentType: text

  note: text
  source: text

  extractedKeywords: text // JSON array string for MVP
  language: text

  isFavorite: integer default 0
  isArchived: integer default 0

  createdById: text references users(id)
  createdAt: integer not null
  updatedAt: integer not null
}
```

---

### 8.5 channel_blocks

Many-to-many between blocks and channels.

```ts
channelBlocks {
  id: text primary key
  channelId: text references channels(id)
  blockId: text references blocks(id)
  position: integer
  createdAt: integer not null

  unique(channelId, blockId)
}
```

---

### 8.6 tags

```ts
tags {
  id: text primary key
  name: text not null
  slug: text unique not null
  createdAt: integer not null
}
```

---

### 8.7 block_tags

```ts
blockTags {
  id: text primary key
  blockId: text references blocks(id)
  tagId: text references tags(id)

  unique(blockId, tagId)
}
```

---

### 8.8 graph_edges

Stores automatic and manual graph relationships.

```ts
graphEdges {
  id: text primary key

  sourceType: text not null // BLOCK, CHANNEL, TAG, COLLECTION
  sourceId: text not null

  targetType: text not null // BLOCK, CHANNEL, TAG, COLLECTION
  targetId: text not null

  edgeType: text not null
  weight: integer not null
  reason: text

  isAutoGenerated: integer default 1

  createdAt: integer not null
  updatedAt: integer not null

  unique(sourceType, sourceId, targetType, targetId, edgeType)
}
```

Example edge types:

```txt
BLOCK_IN_CHANNEL
BLOCK_HAS_TAG
CHANNEL_IN_COLLECTION
RELATED_BY_SHARED_TAG
RELATED_BY_SHARED_CHANNEL
RELATED_BY_SHARED_DOMAIN
RELATED_BY_KEYWORD_OVERLAP
RELATED_MANUAL
RELATED_BY_EMBEDDING // future
```

---

## 9. Link Preview Engine

When a user saves a URL:

1. Validate URL.
2. Normalize URL.
3. Check for duplicate by `normalizedUrl`.
4. Create initial block.
5. Fetch HTML metadata.
6. Extract preview data.
7. Extract keywords.
8. Suggest tags/channels.
9. Generate automatic graph edges.
10. Save everything.

Metadata to extract:

```txt
title
description
imageUrl
faviconUrl
siteName
domain
contentType
```

Priority:

```txt
Open Graph
Twitter Cards
HTML meta description
HTML title
Domain fallback
```

Suggested packages:

```txt
link-preview-js
cheerio
normalize-url
```

Rules:

- If preview fails, still save the URL.
- Never block saving because metadata failed.
- Do not require AI for preview extraction.
- Do not store remote images locally in MVP.

---

## 10. Keyword Extraction Without AI

MVP should not require an AI API.

Use metadata + simple keyword extraction.

Input text for keyword extraction:

```txt
title
description
siteName
domain
user note
text block content
```

Process:

1. Lowercase text.
2. Remove punctuation.
3. Remove stopwords.
4. Split into terms.
5. Keep terms longer than 3 characters.
6. Count frequency.
7. Extract top 5-12 keywords.
8. Store as JSON string in `blocks.extractedKeywords`.

Use stopword lists for English and Spanish.

Example:

```txt
Title:
Google releases TimesFM for time series forecasting

Description:
Open source foundation model for forecasting...

Extracted keywords:
["google", "timesfm", "forecasting", "time series", "open source", "model"]
```

---

## 11. Automatic Graph Engine

The graph must be generated automatically.

The user should be able to simply save blocks and let Bitácora discover relationships.

### 11.1 Automatic edge generation

After creating or updating a block, run `generateGraphEdgesForBlock(blockId)`.

This function compares the new block against existing blocks using lightweight rules.

### 11.2 Signals and weights

Use this scoring model for MVP:

```txt
Same channel: +5
Same tag: +4
Same domain: +2
Shared keyword: +2 per keyword
Created within same 7-day window: +1
Manual relation: +10
```

If total score >= 6:

Create or update a graph edge:

```txt
source = new block
target = related block
edgeType = strongest detected reason
weight = total score
reason = human-readable explanation
```

Example reasons:

```txt
"Both blocks are in the channel AI Tools"
"They share tags: #forecasting, #ai"
"They share keywords: forecasting, model, time series"
"Both links come from github.com"
```

### 11.3 Avoid graph spam

Do not create unlimited edges.

For each block, keep only the top related blocks:

```txt
Max automatic related edges per block: 12
Minimum score: 6
```

Sort by:

```txt
weight desc
createdAt desc
```

### 11.4 Edge explainability

Every automatic edge must have a reason.

Bad:

```txt
Related
```

Good:

```txt
Shares channel “Tesis” and keywords “forecasting”, “sensors”.
```

### 11.5 Future AI layer

Do not implement AI in MVP.

But keep architecture ready for embeddings.

Future table:

```ts
blockEmbeddings {
  id: text primary key
  blockId: text references blocks(id)
  provider: text // openai, gemini, ollama, nomic
  model: text
  embedding: text // JSON array or vector storage alternative
  createdAt: integer
}
```

Future edge type:

```txt
RELATED_BY_EMBEDDING
```

Future behavior:

```txt
If semantic similarity > 0.78, suggest or create graph edge.
```

Potential future providers:

```txt
OpenAI embeddings
Gemini embeddings
Ollama local embeddings
Nomic local embeddings
```

---

## 12. Graph View

Route:

```txt
/app/graph
```

The graph view should visualize:

```txt
Blocks
Channels
Tags
Collections
```

Suggested package:

```txt
react-force-graph
```

Alternative packages:

```txt
sigma.js
vis-network
cytoscape.js
```

### 12.1 Node types

```txt
BLOCK
CHANNEL
TAG
COLLECTION
```

### 12.2 Edge types

```txt
BLOCK_IN_CHANNEL
BLOCK_HAS_TAG
CHANNEL_IN_COLLECTION
RELATED_BY_SHARED_TAG
RELATED_BY_SHARED_CHANNEL
RELATED_BY_SHARED_DOMAIN
RELATED_BY_KEYWORD_OVERLAP
RELATED_MANUAL
```

### 12.3 UX

When user opens graph:

- Show an interactive network.
- Different node sizes based on connectivity.
- Different visual style for blocks/channels/tags/collections.
- Click a node to open a side panel.
- Side panel shows title/name, type, metadata and related nodes.
- Click related node to navigate.
- Allow filtering by collection/channel/tag.
- Allow hiding weak edges.
- Allow limiting to recent blocks.

MVP graph can be read-only.

No need for drag-to-connect in MVP.

---

## 13. Auto-categorization

Bitácora should suggest organization automatically without forcing it.

When saving a block:

- Suggest existing channels based on keyword overlap.
- Suggest existing tags based on keyword overlap.
- Suggest collection if channel belongs to a collection.
- If no good match exists, save to Inbox.

Example:

```txt
New link:
"TimesFM: A foundation model for time series forecasting"

Suggested channel:
AI Tools

Suggested tags:
#forecasting
#model
#research
```

The user can accept, ignore or edit suggestions.

For MVP:

- Auto-save to Inbox by default.
- Show suggestions after save.
- Do not force user to choose.

---

## 14. API Routes

### Auth

```txt
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

---

### Blocks

```txt
POST /api/blocks
GET /api/blocks
GET /api/blocks/:id
PATCH /api/blocks/:id
DELETE /api/blocks/:id
```

Create block body:

```json
{
  "input": "https://example.com",
  "channelIds": ["channel-id"],
  "tagNames": ["ai", "research"],
  "note": "Optional note"
}
```

---

### Collections

```txt
POST /api/collections
GET /api/collections
GET /api/collections/:slug
PATCH /api/collections/:id
DELETE /api/collections/:id
```

---

### Channels

```txt
POST /api/channels
GET /api/channels
GET /api/channels/:slug
PATCH /api/channels/:id
DELETE /api/channels/:id
POST /api/channels/:id/blocks
DELETE /api/channels/:id/blocks/:blockId
```

---

### Tags

```txt
POST /api/tags
GET /api/tags
GET /api/tags/:slug
```

---

### Graph

```txt
GET /api/graph
GET /api/graph?collection=
GET /api/graph?channel=
GET /api/graph?tag=
GET /api/graph?minWeight=6
POST /api/graph/rebuild
POST /api/graph/edges
DELETE /api/graph/edges/:id
```

`POST /api/graph/rebuild` should:

- Clear auto-generated edges.
- Recalculate graph edges for all blocks.
- Keep manual edges.

This endpoint must be protected.

---

## 15. App Routes

```txt
/                      Public landing page
/login                 Login
/app                   Dashboard
/app/inbox             Inbox
/app/new               Quick capture
/app/collections       Collections list
/app/collections/[slug] Collection detail
/app/channels          Channels list
/app/c/[slug]          Channel detail
/app/b/[id]            Block detail
/app/tags/[slug]       Tag detail
/app/graph             Knowledge graph
/app/search            Search
/settings              Settings
```

---

## 16. UI Components

```txt
QuickCapture
BlockCard
BlockGrid
BlockDetailPanel
Sidebar
MobileNav
ChannelList
CollectionList
TagPill
GraphCanvas
GraphSidePanel
SearchBar
AuthForm
EmptyState
```

---

## 17. Mobile-first Requirements

Bitácora must be very comfortable from phone.

Primary phone flow:

```txt
Open app
Paste link
Save
Close app
```

Should take less than 10 seconds.

Mobile UI:

- Quick capture at top.
- Big input.
- One-column cards.
- Bottom nav optional.
- Floating `+` button.
- PWA support.

---

## 18. PWA Requirements

Add basic PWA support.

```txt
manifest.json
icon-192.png
icon-512.png
theme-color
display: standalone
```

App name:

```txt
Bitácora
```

Short name:

```txt
Bitácora
```

---

## 19. Search

Route:

```txt
/app/search
```

Search over:

```txt
blocks.title
blocks.url
blocks.description
blocks.content
blocks.note
blocks.extractedKeywords
tags.name
channels.name
collections.name
```

MVP:

```txt
SQL LIKE search
```

Future:

```txt
SQLite FTS5
Semantic search
```

---

## 20. Initial Seeds

Create initial collections:

```txt
Doctorado
Portfolio
Jarvis
Hackathons
Ciberseguridad
Música
Clientes
Investigación ambiental
```

Create initial channels:

```txt
Inbox
Read Later
AI Tools
Tesis
Forecasting
DePIN
Sensores
Visual Inspiration
Matemáticas
GitHub Repos
Articles
Videos
```

Create initial tags:

```txt
paper
github
video
tool
idea
reference
client
read-later
inspiration
research
ai
forecasting
depin
sensors
```

---

## 21. Environment Variables

```env
NEXT_PUBLIC_APP_NAME="Bitácora"

TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."

ADMIN_EMAIL="your-email@example.com"
ADMIN_PASSWORD="change-this-password"
SESSION_SECRET="random-long-secret"
```

---

## 22. Expected package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

---

## 23. Suggested Folder Structure

```txt
src/
  app/
    page.tsx
    login/
      page.tsx
    app/
      page.tsx
      inbox/
        page.tsx
      new/
        page.tsx
      collections/
        page.tsx
        [slug]/
          page.tsx
      channels/
        page.tsx
      c/
        [slug]/
          page.tsx
      b/
        [id]/
          page.tsx
      tags/
        [slug]/
          page.tsx
      graph/
        page.tsx
      search/
        page.tsx
    settings/
      page.tsx
    api/
      auth/
        login/
          route.ts
        logout/
          route.ts
        me/
          route.ts
      blocks/
        route.ts
        [id]/
          route.ts
      collections/
        route.ts
        [id]/
          route.ts
      channels/
        route.ts
        [id]/
          route.ts
          blocks/
            route.ts
      tags/
        route.ts
      graph/
        route.ts
        rebuild/
          route.ts
        edges/
          route.ts

  components/
    auth/
      AuthForm.tsx
    blocks/
      BlockCard.tsx
      BlockGrid.tsx
      BlockDetailPanel.tsx
      QuickCapture.tsx
    graph/
      GraphCanvas.tsx
      GraphSidePanel.tsx
    layout/
      Sidebar.tsx
      MobileNav.tsx
    taxonomy/
      ChannelList.tsx
      CollectionList.tsx
      TagPill.tsx
    search/
      SearchBar.tsx
    ui/
      EmptyState.tsx

  db/
    schema.ts
    index.ts
    seed.ts
    migrations/

  lib/
    auth.ts
    preview.ts
    keywords.ts
    graph.ts
    slugify.ts
    normalize-url.ts
    utils.ts
    constants.ts

  middleware.ts
```

---

## 24. Design Direction

Visual style:

```txt
Minimal
Editorial
Calm
Sophisticated
Fast
Research-oriented
```

Avoid:

```txt
Loud gradients
Overly playful UI
Social network clutter
Too many colors
Complex onboarding
```

Recommended UI:

- Clean cards.
- Neutral background.
- Elegant typography.
- Subtle borders.
- Spacious layout.
- Dark mode optional.
- Mobile-first capture flow.
- Graph as a “map” experience, not a dashboard gimmick.

---

## 25. MVP Acceptance Criteria

The MVP is complete when:

- User can log in.
- Protected routes work.
- User can save a URL.
- URL metadata preview is generated.
- User can save a text note.
- Blocks are persisted in Turso.
- User can create collections.
- User can create channels.
- User can connect blocks to multiple channels.
- User can add tags to blocks.
- System extracts keywords without AI.
- System auto-generates graph edges from rules.
- User can view `/app/graph`.
- Graph displays blocks, channels and tags.
- Graph edges have weights and reasons.
- User can search blocks.
- User can favorite/archive blocks.
- App works from phone.
- App can be deployed to Vercel.
- No artificial block limit exists.
- README presents Bitácora as open-source and self-hostable.

---

## 26. Do Not Build Yet

Do not implement in MVP:

```txt
Multiuser social features
Public feeds
Followers
Likes
Comments
Payments
Premium tiers
Vercel Blob uploads
Neon
Heavy file uploads
PDF storage
AI summaries
AI embeddings
Realtime collaboration
Complex drag and drop
Browser extension
Native mobile app
```

---

## 27. Future Roadmap

### Phase 2 — Capture Everywhere

- Browser extension.
- Mobile share target.
- iOS shortcut.
- Raycast extension.
- CLI.

### Phase 3 — Better Graph

- Manual block-to-block relations.
- Edge editing.
- Graph filters.
- Graph clusters.
- Timeline view.
- Collection-specific graphs.

### Phase 4 — AI Layer

- AI summaries.
- Auto-tagging.
- Auto-channel suggestions.
- Embeddings.
- Semantic search.
- Semantic graph edges.
- Local embeddings with Ollama/Nomic.

### Phase 5 — Local-first / Self-host Advanced

- SQLite local version.
- Tailscale setup.
- Docker compose.
- Local backups.
- Import/export.
- Markdown export.
- Obsidian export.

---

## 28. Final Instruction for Kiro

Build Bitácora as an open-source, self-hostable personal knowledge harbor.

Use:

```txt
Next.js
TypeScript
Tailwind CSS
Turso
Drizzle ORM
Simple protected auth
```

Prioritize:

1. Fast link capture.
2. Metadata previews.
3. Blocks.
4. Collections.
5. Channels.
6. Tags.
7. Automatic graph generation without AI.
8. Private-by-default authentication.
9. Mobile-first UX.
10. Clean open-source README.

Do not copy Are.na branding or UI directly.

Do not require AI for the MVP.

Do not use Neon.

Do not use Vercel Blob.

The product should feel like:

```txt
A personal harbor for internet discoveries.
A living map of curiosity.
An open-source memory palace.
```

Guiding sentence:

> Save first. Understand later.

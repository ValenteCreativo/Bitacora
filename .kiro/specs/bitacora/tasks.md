# Implementation Plan: Bitacora

## Overview

This plan implements the Bitácora knowledge harbor MVP in incremental phases. Each phase builds on the previous one, starting with project foundation and database schema, progressing through core API and business logic, then automatic graph generation, and finally the UI layer and polish features. The stack is Next.js + TypeScript + Tailwind CSS + Drizzle ORM + Turso.

## Tasks

- [x] 1. Project setup and configuration
  - [x] 1.1 Initialize Next.js project with TypeScript, Tailwind CSS, and ESLint
    - Run `npx create-next-app@latest` with TypeScript and Tailwind enabled
    - Configure `tsconfig.json` path aliases (`@/` pointing to `src/`)
    - Install core dependencies: `drizzle-orm`, `@libsql/client`, `nanoid`, `bcryptjs`, `normalize-url`
    - Install dev dependencies: `drizzle-kit`, `tsx`, `vitest`, `fast-check`, `@types/bcryptjs`
    - Create `.env.local` template with TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET
    - Create `drizzle.config.ts` pointing to Turso
    - _Requirements: 16.1, 16.2_

  - [x] 1.2 Define database schema with Drizzle ORM
    - Create `src/db/schema.ts` with all 8 tables: users, collections, channels, blocks, channelBlocks, tags, blockTags, graphEdges
    - Define all columns, types, defaults, foreign keys, and unique indexes per the design document
    - Create `src/db/index.ts` with Turso client initialization and Drizzle instance export
    - Run `drizzle-kit generate` to create initial migration
    - _Requirements: 16.1, 16.2_

  - [x] 1.3 Create seed data script
    - Create `src/db/seed.ts` using tsx
    - Seed initial collections: Doctorado, Portfolio, Jarvis, Hackathons, Ciberseguridad, Música, Clientes, Investigación ambiental
    - Seed initial channels: Inbox, Read Later, AI Tools, Tesis, Forecasting, DePIN, Sensores, Visual Inspiration, Matemáticas, GitHub Repos, Articles, Videos
    - Seed initial tags: paper, github, video, tool, idea, reference, client, read-later, inspiration, research, ai, forecasting, depin, sensors
    - Generate IDs with nanoid, slugs with slugify function
    - _Requirements: 16.3, 16.4, 16.5_

- [x] 2. Authentication system
  - [x] 2.1 Implement auth library module
    - Create `src/lib/auth.ts` with hashPassword, verifyPassword, createSession, validateSession, destroySession functions
    - Use bcryptjs for password hashing (10 salt rounds)
    - Implement session as signed JWT or encrypted JSON stored in HTTP-only cookie
    - Implement `ensureAdminExists()` that checks for users and creates admin from env vars if none exist
    - _Requirements: 1.1, 1.5, 1.6, 1.7_

  - [x] 2.2 Implement auth API routes
    - Create `src/app/api/auth/login/route.ts` — POST validates credentials, creates session cookie, returns user data
    - Create `src/app/api/auth/logout/route.ts` — POST destroys session cookie
    - Create `src/app/api/auth/me/route.ts` — GET returns current user from session
    - Return 401 for invalid credentials with generic message (not revealing which field is wrong)
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 2.3 Implement middleware for route protection
    - Create `src/middleware.ts` matching `/app/:path*`, `/settings`, and `/api/:path*` (excluding `/api/auth/*`)
    - Validate session cookie on each request
    - Redirect unauthenticated page requests to `/login`
    - Return 401 JSON for unauthenticated API requests
    - _Requirements: 1.3, 1.4_

- [x] 3. Core utility libraries
  - [x] 3.1 Implement URL normalizer
    - Create `src/lib/normalize-url.ts`
    - Use `normalize-url` package with options: strip fragment, strip www, remove trailing slash, sort query params, remove default port
    - Implement `extractDomain()` from URL
    - _Requirements: 2.5_

  - [ ]* 3.2 Write property tests for URL normalizer
    - **Property 1: URL Normalization Round Trip Consistency**
    - Test idempotence: normalizeUrl(normalizeUrl(url)) === normalizeUrl(url) for any valid URL
    - **Property 9: Duplicate Detection via Normalization**
    - Test that URLs differing only in protocol case, trailing slash, default port, or fragment produce same normalized form
    - **Validates: Requirements 2.5, 2.6**

  - [x] 3.3 Implement slug generator
    - Create `src/lib/slugify.ts`
    - Convert to lowercase, replace spaces/special chars with hyphens, remove consecutive hyphens, trim hyphens
    - Handle unicode characters (transliterate common accented characters)
    - Implement `generateUniqueSlug()` that appends suffix if slug already exists
    - _Requirements: 4.1, 5.1_

  - [ ]* 3.4 Write property tests for slug generator
    - **Property 7: Slug Generation Idempotence and Validity**
    - Test that for any input string, output is lowercase, only alphanumeric+hyphens, no leading/trailing hyphens
    - **Validates: Requirements 4.1, 5.1**

  - [x] 3.5 Implement keyword extractor
    - Create `src/lib/keywords.ts`
    - Implement tokenize: lowercase, remove punctuation, split on whitespace
    - Implement removeStopwords with English and Spanish stopword lists
    - Keep terms > 3 characters
    - Implement rankByFrequency to return top N terms
    - Main function: extractKeywords(texts: string[]) → string[] (5–12 keywords)
    - _Requirements: 2.7, 2.8_

  - [ ]* 3.6 Write property tests for keyword extractor
    - **Property 2: Keyword Extraction Determinism**
    - Test same inputs always produce same outputs
    - **Property 8: Keyword Extraction Length Bounds**
    - Test output is 0–12 keywords, each > 3 characters, all lowercase, no punctuation, no stopwords
    - **Validates: Requirements 2.7, 2.8**

  - [x] 3.7 Implement constants and utilities
    - Create `src/lib/constants.ts` with block types, edge types, visibility options, stopword lists
    - Create `src/lib/utils.ts` with timestamp helpers, ID generation wrapper
    - _Requirements: referenced across multiple requirements_

- [x] 4. Checkpoint — Foundation verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify database migration runs successfully
  - Verify seed script populates expected data

- [x] 5. Blocks CRUD API
  - [x] 5.1 Implement link preview engine
    - Create `src/lib/preview.ts`
    - Fetch URL with timeout (5 seconds), parse HTML with cheerio or regex
    - Extract metadata in priority order: Open Graph → Twitter Cards → meta tags → HTML title → domain fallback
    - Extract favicon from link[rel="icon"] or /favicon.ico fallback
    - Return LinkPreview object; never throw — return partial data on failure
    - _Requirements: 2.3, 2.4_

  - [x] 5.2 Implement blocks API — Create (POST /api/blocks)
    - Create `src/app/api/blocks/route.ts`
    - Accept CreateBlockInput: detect type (LINK if valid URL, otherwise TEXT)
    - For LINK: normalize URL, check duplicate, fetch preview, extract keywords from metadata
    - For TEXT: extract keywords from content
    - Create block record with nanoid, store extractedKeywords as JSON string
    - Process channelIds (create channel_blocks records)
    - Process tagNames (find-or-create tags, create block_tags records)
    - Trigger graph edge generation asynchronously
    - Return created block with tags and channels
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9_

  - [x] 5.3 Implement blocks API — List and Get
    - GET /api/blocks — return blocks paginated (limit/offset query params), ordered by createdAt desc
    - Support query filters: type, isFavorite, isArchived, channelId, tagId
    - GET /api/blocks/[id] — return single block with tags, channels, and related edges
    - Create `src/app/api/blocks/[id]/route.ts`
    - _Requirements: 3.1, 3.2_

  - [x] 5.4 Implement blocks API — Update and Delete
    - PATCH /api/blocks/[id] — update allowed fields (title, content, note, isFavorite, isArchived), update timestamp
    - Re-extract keywords if content fields changed, re-trigger graph edge generation
    - DELETE /api/blocks/[id] — cascade delete channel_blocks, block_tags, graph_edges referencing block
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [ ]* 5.5 Write property test for block deletion cascade
    - **Property 10: Block Deletion Cascade Completeness**
    - Generate blocks with random channel/tag/edge associations, delete block, verify zero remaining references
    - **Validates: Requirements 3.4**

- [x] 6. Collections and Channels API
  - [x] 6.1 Implement collections API
    - Create `src/app/api/collections/route.ts` — POST (create with slug), GET (list with channel counts)
    - Create `src/app/api/collections/[id]/route.ts` — PATCH (update fields), DELETE (disassociate channels)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.2 Implement channels API
    - Create `src/app/api/channels/route.ts` — POST (create with slug, optional collectionId), GET (list with block counts)
    - Create `src/app/api/channels/[id]/route.ts` — PATCH (update), DELETE
    - Create `src/app/api/channels/[id]/blocks/route.ts` — POST (add block with position), DELETE (remove block)
    - Enforce unique channel+block constraint, return 409 on duplicate
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.3 Implement tags API
    - Create `src/app/api/tags/route.ts` — POST (find-or-create by slug), GET (list with block counts)
    - Create `src/app/api/tags/[slug]/route.ts` — GET (tag detail with blocks)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Automatic graph engine
  - [x] 7.1 Implement graph scoring and edge generation
    - Create `src/lib/graph.ts`
    - Implement `calculateBlockRelationScore(blockA, blockB)`:
      - Same channel: +5 (for each shared channel)
      - Same tag: +4 (for each shared tag)
      - Same domain: +2
      - Shared keyword: +2 per keyword
      - Created within 7-day window: +1
    - Cap per shared-type to avoid single factor domination
    - Return EdgeCandidate with total score, individual reasons, and strongest edge type
    - _Requirements: 7.2_

  - [x] 7.2 Implement generateGraphEdgesForBlock function
    - Query all other blocks (future optimization: limit to recent/relevant subset)
    - Calculate score against each
    - Filter candidates with score >= 6
    - Sort by weight descending, keep top 12
    - Generate human-readable reason string from individual reasons
    - Upsert graph_edges records (using unique constraint)
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.7_

  - [x] 7.3 Implement graph rebuild function
    - Delete all edges where isAutoGenerated = 1
    - Iterate all blocks, call generateGraphEdgesForBlock for each
    - Preserve manual edges (isAutoGenerated = 0) throughout
    - _Requirements: 7.6_

  - [ ]* 7.4 Write property tests for graph engine
    - **Property 3: Graph Score Calculation Consistency** — score(A,B) == score(B,A)
    - **Property 4: Graph Edge Maximum Invariant** — no block has more than 12 auto edges
    - **Property 5: Graph Edge Minimum Score Invariant** — all auto edges have weight >= 6
    - **Property 6: Graph Edge Explainability** — all auto edges have non-empty reason
    - **Property 11: Graph Rebuild Preserves Manual Edges** — manual edges survive rebuild
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6**

  - [x] 7.5 Implement graph API routes
    - Create `src/app/api/graph/route.ts` — GET with query params: collection, channel, tag, minWeight
    - Build nodes array from blocks/channels/tags/collections based on filters
    - Build edges array from graph_edges matching filtered nodes
    - Return { nodes, edges } in GraphData format
    - Create `src/app/api/graph/rebuild/route.ts` — POST triggers full rebuild
    - Create `src/app/api/graph/edges/route.ts` — POST (create manual edge), DELETE (remove edge)
    - _Requirements: 8.6, 7.6_

- [x] 8. Checkpoint — API verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify blocks CRUD works end-to-end (create link, create text, list, update, delete)
  - Verify graph edges are generated when blocks share channels/tags/domains/keywords
  - Verify graph rebuild preserves manual edges

- [x] 9. Search and auto-categorization
  - [x] 9.1 Implement search API
    - Create `src/app/api/search/route.ts` — GET with query param `q`
    - Search blocks: SQL LIKE on title, url, description, content, note, extractedKeywords
    - Search tags: SQL LIKE on name
    - Search channels: SQL LIKE on name
    - Search collections: SQL LIKE on name
    - Return results grouped by type: { blocks: [], tags: [], channels: [], collections: [] }
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 9.2 Implement auto-categorization suggestions
    - Create `src/lib/suggestions.ts`
    - `suggestChannels(keywords: string[])`: compare keywords against channel names/descriptions, return matching channels
    - `suggestTags(keywords: string[])`: compare keywords against tag names, return matching tags
    - Integrate into block creation flow — return suggestions in create response
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 10. Application layout and navigation
  - [x] 10.1 Create app layout shell
    - Create `src/app/app/layout.tsx` — wraps all /app/* routes
    - Implement responsive container with sidebar for desktop, mobile nav for mobile
    - Create `src/components/layout/Sidebar.tsx` — fixed left nav with links: Inbox, Collections, Channels, Graph, Search, Settings
    - Create `src/components/layout/MobileNav.tsx` — bottom nav bar visible below 768px
    - Add Quick Capture trigger button accessible from all app pages
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 10.2 Create Quick Capture component
    - Create `src/components/blocks/QuickCapture.tsx` — modal or expandable input
    - Large text input that auto-detects URL vs text
    - Optional channel selector and tag input
    - Submit calls POST /api/blocks
    - Display returned suggestions (channels/tags) after save
    - Must work fast on mobile (< 10 seconds capture flow)
    - _Requirements: 2.1, 2.2, 13.3_

- [x] 11. Block display components
  - [x] 11.1 Create Block Card component
    - Create `src/components/blocks/BlockCard.tsx`
    - Display: title, description preview (truncated), imageUrl (as background or thumbnail), domain with favicon, tags as pills, relative creation date
    - Differentiate LINK blocks (show favicon + domain) vs TEXT blocks (show content preview)
    - Click navigates to `/app/b/[id]`
    - _Requirements: 11.1, 11.3, 11.4_

  - [x] 11.2 Create Block Grid component
    - Create `src/components/blocks/BlockGrid.tsx`
    - Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
    - Accept blocks array, render BlockCards
    - _Requirements: 11.1_

  - [x] 11.3 Create Block Detail page
    - Create `src/app/app/b/[id]/page.tsx`
    - Fetch block with tags, channels, and related blocks (from graph edges)
    - Display all metadata, note, edit capability
    - Show related blocks section from graph
    - Actions: favorite, archive, add to channel, add tags, delete
    - _Requirements: 11.2, 3.2, 3.5, 3.6_

- [x] 12. Taxonomy views
  - [x] 12.1 Create Collection pages
    - Create `src/app/app/collections/page.tsx` — list all collections with channel counts and colors
    - Create `src/app/app/collections/[slug]/page.tsx` — show collection metadata + list of channels within it
    - _Requirements: 12.1, 4.2_

  - [x] 12.2 Create Channel pages
    - Create `src/app/app/channels/page.tsx` — list all channels
    - Create `src/app/app/c/[slug]/page.tsx` — show channel metadata + block grid of associated blocks
    - _Requirements: 12.2, 5.6_

  - [x] 12.3 Create Tag view page
    - Create `src/app/app/tags/[slug]/page.tsx` — show tag name + block grid of tagged blocks
    - _Requirements: 6.5_

  - [x] 12.4 Create Inbox page
    - Create `src/app/app/inbox/page.tsx` — fetch and display all blocks not in any channel
    - Query blocks LEFT JOIN channel_blocks WHERE channel_blocks.id IS NULL
    - _Requirements: 12.3_

- [x] 13. Graph visualization
  - [x] 13.1 Implement Graph Canvas component
    - Install `react-force-graph-2d` (lighter than 3D for MVP)
    - Create `src/components/graph/GraphCanvas.tsx` — client component
    - Fetch graph data from GET /api/graph
    - Render nodes with type-based colors and sizes (larger = more connections)
    - Render edges with opacity/thickness based on weight
    - Node labels: title for blocks, name for channels/tags/collections
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 13.2 Implement Graph Side Panel
    - Create `src/components/graph/GraphSidePanel.tsx`
    - On node click: show panel with node type, title/name, metadata
    - List connected nodes with edge reasons
    - Link to navigate to node's detail page
    - _Requirements: 8.4_

  - [x] 13.3 Create Graph page with filters
    - Create `src/app/app/graph/page.tsx`
    - Add filter controls: collection dropdown, channel dropdown, tag dropdown, minimum weight slider
    - Pass filters as query params to GET /api/graph
    - Re-render graph when filters change
    - _Requirements: 8.5, 8.6_

- [x] 14. Search and remaining pages
  - [x] 14.1 Create Search page
    - Create `src/app/app/search/page.tsx`
    - Create `src/components/search/SearchBar.tsx`
    - Input with debounced search (300ms)
    - Display results grouped by type: blocks (as cards), channels, collections, tags
    - Show empty state with messaging when no results
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 14.2 Create Dashboard page
    - Create `src/app/app/page.tsx` — main dashboard
    - Show recent blocks (last 10)
    - Show quick stats: total blocks, collections, channels
    - Quick Capture prominently placed
    - _Requirements: 10.4_

  - [x] 14.3 Create Settings page
    - Create `src/app/settings/page.tsx`
    - Display current user email and name
    - Protected route (middleware handles auth check)
    - _Requirements: 17.1, 17.2_

- [x] 15. Checkpoint — UI verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify full capture flow works on mobile viewport
  - Verify graph renders with nodes and edges
  - Verify search returns grouped results

- [x] 16. Public pages and authentication UI
  - [x] 16.1 Create Landing page
    - Create `src/app/page.tsx` — public landing page
    - Present Bitácora's purpose: "Save first. Understand later."
    - Show features, tech stack mention, self-hostable message
    - Link to login, link to GitHub repo
    - Clean, editorial, calm design
    - _Requirements: 14.1, 14.2_

  - [x] 16.2 Create Login page
    - Create `src/app/login/page.tsx`
    - Create `src/components/auth/AuthForm.tsx`
    - Email + password form
    - Submit to POST /api/auth/login
    - Handle errors (show generic message)
    - Redirect to /app on success
    - _Requirements: 14.3, 1.1, 1.2_

- [x] 17. Polish features
  - [x] 17.1 Implement Favorite and Archive functionality in UI
    - Add favorite/archive toggle buttons to BlockCard and Block Detail
    - PATCH /api/blocks/[id] with isFavorite or isArchived
    - Add filter for favorites view (GET /api/blocks?isFavorite=1)
    - _Requirements: 3.5, 3.6_

  - [x] 17.2 Add PWA support
    - Create `public/manifest.json` with name "Bitácora", short_name "Bitácora", icons (192, 512), theme_color, display "standalone"
    - Add PWA icons to public/ (create placeholder SVG-based icons)
    - Add manifest link and theme-color meta tag to `src/app/layout.tsx`
    - _Requirements: 15.1, 15.2_

  - [x] 17.3 Create README
    - Write README.md presenting Bitácora as open-source self-hostable tool
    - Include sections: What is Bitácora, Features, Tech Stack, Quick Start, Environment Variables, Database Setup, Deploy to Vercel, Deploy Locally, License
    - Use the guiding sentence: "Save first. Understand later."
    - MIT License
    - _Requirements: referenced in product spec_

- [x] 18. Final checkpoint — Full MVP verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify complete flow: login → save link → metadata extracted → keywords extracted → graph edges generated → view in graph
  - Verify mobile capture flow completes in under 10 seconds
  - Verify all protected routes redirect unauthenticated users
  - Verify seed data populates correctly

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (URL normalization, keyword extraction, graph scoring, slug generation)
- The graph engine is the most complex subsystem — Task 7 should be tested thoroughly before building the UI on top
- All API routes must validate session before processing (middleware handles this globally)
- Use `nanoid` for all ID generation across the codebase

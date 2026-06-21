# Requirements Document

## Introduction

Bitácora is an open-source, self-hostable personal knowledge harbor webapp. It enables users to save links, notes, references and discoveries, then automatically maps relationships between them through a rule-based graph engine. The product philosophy is "Save first. Understand later." — prioritizing fast capture with automatic organization emerging over time.

The MVP delivers: authentication, block capture (links and text), metadata extraction, keyword extraction without AI, collections/channels/tags taxonomy, automatic graph generation with explainable edges, graph visualization, search, and a mobile-first responsive UI deployable on Vercel with Turso as the database.

## Glossary

- **Block**: A saved piece of knowledge (LINK or TEXT type for MVP)
- **Collection**: A high-level project or life area that contains channels
- **Channel**: A thematic playlist of ideas belonging to a collection; blocks can appear in multiple channels
- **Tag**: A lightweight label applied to blocks
- **Edge**: A graph relationship between two nodes (blocks, channels, tags, or collections)
- **Graph_Engine**: The subsystem that automatically generates edges between blocks based on scoring rules
- **Link_Preview_Engine**: The subsystem that fetches and extracts metadata from URLs
- **Keyword_Extractor**: The subsystem that extracts keywords from text using frequency analysis without AI
- **Normalizer**: The subsystem that normalizes URLs for deduplication
- **Quick_Capture**: The primary input component for saving links or notes rapidly
- **Inbox**: The default destination for blocks that have not been manually categorized
- **Session_Manager**: The subsystem that manages HTTP-only cookie-based authentication sessions
- **Sidebar**: The main navigation component for desktop layout
- **MobileNav**: The bottom navigation component for mobile layout
- **Block_Card**: The visual component rendering a block's preview in grid/list views
- **Graph_Canvas**: The interactive force-directed graph visualization component
- **Search_Engine**: The subsystem performing SQL LIKE queries across blocks, tags, channels, and collections

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to log in with email and password, so that my knowledge harbor remains private and only I can access my saved content.

#### Acceptance Criteria

1. WHEN a user submits valid email and password credentials, THE Session_Manager SHALL create an HTTP-only session cookie and redirect the user to the app dashboard
2. WHEN a user submits invalid credentials, THE Session_Manager SHALL return an authentication error without revealing whether the email or password was incorrect
3. WHEN an unauthenticated user attempts to access any /app/* or /settings route, THE Session_Manager SHALL redirect the user to the login page
4. WHEN an unauthenticated request is made to any protected API endpoint, THE Session_Manager SHALL return a 401 Unauthorized response
5. WHEN a user requests logout, THE Session_Manager SHALL invalidate the session cookie and redirect to the login page
6. THE Session_Manager SHALL store passwords as bcrypt hashes and never store or transmit plaintext passwords
7. WHEN the application starts for the first time, THE Session_Manager SHALL create an admin user from ADMIN_EMAIL and ADMIN_PASSWORD environment variables if no user exists

### Requirement 2: Block Creation and Capture

**User Story:** As a user, I want to quickly save links and text notes, so that I can capture knowledge in under 10 seconds from any device.

#### Acceptance Criteria

1. WHEN a user submits a valid URL through Quick_Capture, THE Block system SHALL create a new block of type LINK with the provided URL
2. WHEN a user submits text content through Quick_Capture, THE Block system SHALL create a new block of type TEXT with the provided content
3. WHEN a LINK block is created, THE Link_Preview_Engine SHALL fetch and store metadata (title, description, imageUrl, faviconUrl, siteName, domain, contentType) from the URL
4. IF metadata extraction fails for a LINK block, THEN THE Block system SHALL still save the block with the URL and any user-provided data
5. WHEN a block is created with a URL, THE Normalizer SHALL normalize the URL and check for duplicates against existing normalizedUrl values
6. IF a duplicate normalizedUrl is detected, THEN THE Block system SHALL reject the creation and inform the user of the existing block
7. WHEN a block is created, THE Keyword_Extractor SHALL extract the top 5 to 12 keywords from the block's title, description, content, siteName, and note fields
8. THE Keyword_Extractor SHALL extract keywords by lowercasing text, removing punctuation, removing English and Spanish stopwords, splitting into terms, keeping terms longer than 3 characters, and ranking by frequency
9. WHEN a block is created, THE Block system SHALL store it with a generated unique ID and timestamps

### Requirement 3: Block Management

**User Story:** As a user, I want to view, edit, and delete my saved blocks, so that I can maintain and curate my knowledge collection.

#### Acceptance Criteria

1. WHEN a user requests the list of blocks, THE Block system SHALL return blocks ordered by creation date descending with pagination support
2. WHEN a user requests a specific block by ID, THE Block system SHALL return the block with all its metadata, tags, and channel associations
3. WHEN a user updates a block's fields, THE Block system SHALL persist the changes and update the updatedAt timestamp
4. WHEN a user deletes a block, THE Block system SHALL remove the block and all associated channel_blocks, block_tags, and graph_edges referencing that block
5. WHEN a user marks a block as favorite, THE Block system SHALL set isFavorite to true for that block
6. WHEN a user archives a block, THE Block system SHALL set isArchived to true for that block

### Requirement 4: Collections Management

**User Story:** As a user, I want to create and manage collections representing projects or life areas, so that I can organize my channels hierarchically.

#### Acceptance Criteria

1. WHEN a user creates a collection with a name, THE Collection system SHALL generate a unique slug and persist the collection
2. WHEN a user requests all collections, THE Collection system SHALL return collections with their channel count
3. WHEN a user updates a collection, THE Collection system SHALL persist the changes including name, description, color, and icon
4. WHEN a user deletes a collection, THE Collection system SHALL remove the collection and disassociate its channels (setting their collectionId to null)

### Requirement 5: Channels Management

**User Story:** As a user, I want to create channels as thematic playlists and add blocks to them, so that I can organize my knowledge by topic.

#### Acceptance Criteria

1. WHEN a user creates a channel with a name, THE Channel system SHALL generate a unique slug and persist the channel
2. WHEN a user associates a channel with a collection, THE Channel system SHALL store the collectionId reference
3. WHEN a user adds a block to a channel, THE Channel system SHALL create a channel_blocks record with a position value
4. IF a block is already in the target channel, THEN THE Channel system SHALL reject the duplicate addition
5. WHEN a user removes a block from a channel, THE Channel system SHALL delete the channel_blocks record
6. WHEN a user requests a channel's blocks, THE Channel system SHALL return all associated blocks ordered by position

### Requirement 6: Tags Management

**User Story:** As a user, I want to create and apply tags to blocks, so that I can add lightweight cross-cutting labels to my knowledge.

#### Acceptance Criteria

1. WHEN a user adds a tag name to a block, THE Tag system SHALL create the tag if it does not exist and create the block_tags association
2. IF a tag with the same slug already exists, THEN THE Tag system SHALL reuse the existing tag
3. WHEN a user removes a tag from a block, THE Tag system SHALL delete the block_tags record
4. WHEN a user requests all tags, THE Tag system SHALL return tags with their associated block count
5. WHEN a user requests blocks for a specific tag, THE Tag system SHALL return all blocks associated with that tag

### Requirement 7: Automatic Graph Generation

**User Story:** As a user, I want the system to automatically discover and display relationships between my saved blocks, so that I can understand connections without manual effort.

#### Acceptance Criteria

1. WHEN a block is created or updated, THE Graph_Engine SHALL execute the generateGraphEdgesForBlock function to compare the block against all existing blocks
2. THE Graph_Engine SHALL calculate relationship scores using: same channel (+5), same tag (+4), same domain (+2), shared keyword (+2 per keyword), created within same 7-day window (+1)
3. WHEN the calculated score between two blocks is 6 or greater, THE Graph_Engine SHALL create or update a graph edge with the total weight and strongest edge type
4. THE Graph_Engine SHALL limit automatic edges to a maximum of 12 per block, keeping only the highest-weighted relationships
5. THE Graph_Engine SHALL generate a human-readable reason for every automatic edge explaining why the relationship exists
6. WHEN a user triggers a graph rebuild via POST /api/graph/rebuild, THE Graph_Engine SHALL clear all auto-generated edges and recalculate edges for every block while preserving manual edges
7. THE Graph_Engine SHALL store edges with sourceType, sourceId, targetType, targetId, edgeType, weight, reason, and isAutoGenerated fields

### Requirement 8: Graph Visualization

**User Story:** As a user, I want to view an interactive knowledge graph showing my blocks, channels, tags, and their relationships, so that I can visually explore my knowledge network.

#### Acceptance Criteria

1. WHEN a user navigates to /app/graph, THE Graph_Canvas SHALL render an interactive force-directed graph using react-force-graph
2. THE Graph_Canvas SHALL display nodes of different types (BLOCK, CHANNEL, TAG, COLLECTION) with distinct visual styles and sizes based on connectivity
3. THE Graph_Canvas SHALL render edges between nodes with visual weight reflecting the edge score
4. WHEN a user clicks a node, THE Graph_Canvas SHALL display a side panel showing the node's title, type, metadata, and related nodes
5. WHEN a user applies filters (by collection, channel, tag, or minimum weight), THE Graph_Canvas SHALL display only the matching subgraph
6. THE Graph API SHALL return graph data via GET /api/graph with support for collection, channel, tag, and minWeight query parameters

### Requirement 9: Search

**User Story:** As a user, I want to search across all my saved content, so that I can quickly find blocks, tags, channels, or collections by keyword.

#### Acceptance Criteria

1. WHEN a user submits a search query, THE Search_Engine SHALL perform SQL LIKE matching across blocks.title, blocks.url, blocks.description, blocks.content, blocks.note, blocks.extractedKeywords, tags.name, channels.name, and collections.name
2. THE Search_Engine SHALL return results grouped by type (blocks, tags, channels, collections) with relevance ordering
3. WHEN no results match the query, THE Search_Engine SHALL return an empty result set with appropriate messaging

### Requirement 10: Application Layout and Navigation

**User Story:** As a user, I want a responsive application layout that works well on desktop and mobile, so that I can use Bitácora comfortably from any device.

#### Acceptance Criteria

1. WHILE the viewport width is 768px or greater, THE Sidebar SHALL be visible as a fixed left navigation panel
2. WHILE the viewport width is less than 768px, THE MobileNav SHALL be displayed as bottom navigation and the Sidebar SHALL be hidden
3. THE Sidebar SHALL display navigation links to: Inbox, Collections, Channels, Graph, Search, and Settings
4. THE Quick_Capture component SHALL be accessible from any app page via a prominent button or input area

### Requirement 11: Block Display and Detail Views

**User Story:** As a user, I want to see my blocks displayed as visual cards with previews and access detailed information about each block.

#### Acceptance Criteria

1. THE Block_Card SHALL display the block's title, description preview, imageUrl (if available), domain, tags, and creation date
2. WHEN a user clicks a Block_Card, THE Block system SHALL navigate to or display the block detail view showing all metadata, note, tags, channels, and related blocks from the graph
3. WHEN displaying LINK blocks, THE Block_Card SHALL show the favicon and domain name
4. WHEN displaying TEXT blocks, THE Block_Card SHALL show a text content preview

### Requirement 12: Collection and Channel Views

**User Story:** As a user, I want dedicated views for browsing collections and channels with their associated blocks.

#### Acceptance Criteria

1. WHEN a user navigates to a collection view, THE Collection system SHALL display the collection's metadata and list of channels within it
2. WHEN a user navigates to a channel view, THE Channel system SHALL display the channel's metadata and grid of associated blocks
3. THE Inbox view SHALL display all blocks that are not associated with any channel

### Requirement 13: Auto-categorization Suggestions

**User Story:** As a user, I want the system to suggest channels and tags after I save a block, so that organization happens naturally without interrupting my capture flow.

#### Acceptance Criteria

1. WHEN a block is saved, THE Block system SHALL compare extracted keywords against existing channel names and descriptions to suggest relevant channels
2. WHEN a block is saved, THE Block system SHALL compare extracted keywords against existing tag names to suggest relevant tags
3. THE Block system SHALL present suggestions to the user without forcing acceptance
4. IF no good channel match exists, THEN THE Block system SHALL save the block to Inbox by default

### Requirement 14: Landing Page and Public Routes

**User Story:** As a visitor, I want to see a public landing page presenting Bitácora, so that I can understand the product before logging in.

#### Acceptance Criteria

1. WHEN a visitor navigates to the root URL (/), THE system SHALL display a public landing page presenting Bitácora's purpose and features
2. THE landing page SHALL be accessible without authentication
3. THE login page (/login) SHALL be accessible without authentication

### Requirement 15: PWA Support

**User Story:** As a mobile user, I want to install Bitácora as a progressive web app, so that I can access it quickly from my home screen.

#### Acceptance Criteria

1. THE system SHALL serve a manifest.json file with app name "Bitácora", icons (192px and 512px), theme color, and display mode "standalone"
2. THE system SHALL include appropriate meta tags for PWA support in the HTML head

### Requirement 16: Database Schema and Seed Data

**User Story:** As a developer deploying Bitácora, I want the database schema to be managed through migrations and seed data to be available, so that the application starts with useful initial structure.

#### Acceptance Criteria

1. THE system SHALL define all database tables (users, collections, channels, blocks, channel_blocks, tags, block_tags, graph_edges) using Drizzle ORM schema definitions
2. THE system SHALL support database migrations via drizzle-kit
3. WHEN the seed script is executed, THE system SHALL create initial collections (Doctorado, Portfolio, Jarvis, Hackathons, Ciberseguridad, Música, Clientes, Investigación ambiental)
4. WHEN the seed script is executed, THE system SHALL create initial channels (Inbox, Read Later, AI Tools, Tesis, Forecasting, DePIN, Sensores, Visual Inspiration, Matemáticas, GitHub Repos, Articles, Videos)
5. WHEN the seed script is executed, THE system SHALL create initial tags (paper, github, video, tool, idea, reference, client, read-later, inspiration, research, ai, forecasting, depin, sensors)

### Requirement 17: Settings Page

**User Story:** As a user, I want a settings page where I can view my account information.

#### Acceptance Criteria

1. WHEN a user navigates to /settings, THE system SHALL display the user's email and name
2. THE settings page SHALL be accessible only to authenticated users

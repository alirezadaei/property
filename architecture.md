# Architecture Documentation — Property Search and Map Explorer

This document provides a comprehensive overview of the system and frontend architecture design.

## High-Level System Architecture

### System Overview

The system follows a modern **monolithic Next.js application** architecture with clear separation between frontend and backend concerns. This approach balances simplicity with scalability for the initial 30–50k DAU target while enabling future microservices extraction.

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Client                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  React UI    │  │  Mini-Map    │  │  SSE Client     │   │
│  │  Components  │  │  (Canvas)    │  │  (EventSource)  │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │ HTTPS
┌─────────────────────────▼─────────────────────────────────┐
│                    CDN / Edge Layer                         │
│         (Vercel Edge, CloudFlare, or similar)              │
│   • Static assets (JS, CSS, images)                        │
│   • Edge caching for HTML pages                            │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────▼─────────────────────────────────┐
│              Next.js Application Server                     │
│  ┌──────────────────────────────────────────────────────┐ │
│  │        App Router (RSC + Client Components)          │ │
│  │  • Server Components (SSR)                           │ │
│  │  • Client Components (interactivity)                 │ │
│  │  • Layouts, Pages, Metadata                          │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │               API Route Handlers                      │ │
│  │  • GET /api/listings (search with filters)           │ │
│  │  • GET /api/listings/nearby (geospatial)             │ │
│  │  • GET/POST /api/saved-search                        │ │
│  │  • GET /api/stream/listings (SSE)                    │ │
│  └──────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Business Logic / Services                   │ │
│  │  • Query builders                                     │ │
│  │  • Validation (Zod schemas)                          │ │
│  │  • Haversine distance calculations                   │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │ SQL
┌─────────────────────────▼─────────────────────────────────┐
│              Database Layer (SQLite/PostgreSQL)            │
│  Tables:                                                   │
│  • listing (id, address, city, lat, lng, price, etc.)     │
│  • saved_search (id, user_id, filters, created_at)        │
│                                                            │
│  Indexes:                                                  │
│  • listing(status, updated_at)                            │
│  • listing(lat, lng) for geospatial queries               │
│  • saved_search(user_id)                                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### 1. **Browser / Client**

- **Responsibility**: Render UI, handle user interactions, maintain client-side state
- **Communication**:
  - HTTP GET/POST to API routes
  - Server-Sent Events (SSE) for realtime updates
- **Scaling**: Stateless; scales naturally with CDN distribution

#### 2. **CDN / Edge Layer**

- **Responsibility**:
  - Cache static assets (JS, CSS bundles)
  - Cache HTML for ISR pages (stale-while-revalidate)
  - DDoS protection and TLS termination
- **Communication**: HTTP/2 or HTTP/3 to origin servers
- **Scaling**: Distributed edge nodes globally; auto-scales with traffic

#### 3. **Next.js Application Server**

- **Responsibility**:
  - SSR (Server-Side Rendering) for search and detail pages
  - API route handlers for data queries and mutations
  - SSE stream management for realtime updates
  - Authentication/authorization (currently guest mode)
- **Communication**:
  - SQL queries to database (synchronous)
  - Server-Sent Events (async streaming)
- **Scaling**:
  - Horizontal: Add more Node.js instances behind a load balancer
  - Vertical: Increase CPU/memory per instance
  - Deploy on platforms like Vercel (serverless functions) or containerized (Docker + Kubernetes)

#### 4. **Database**

- **Responsibility**:
  - Persist listings, saved searches, and user data
  - Execute queries with filters, joins, and geospatial calculations
- **Communication**: SQL over TCP (e.g., PostgreSQL protocol)
- **Scaling**:
  - Read replicas for high read throughput
  - Partition by city or region for multi-region expansion
  - Add caching layer (Redis) for frequently accessed queries

### Data Flow Examples

**Search Page Request (SSR):**

1. User navigates to `/` or `/?q=Marina&beds_min=2`
2. CDN checks cache; if stale, forwards to Next.js server
3. Server executes SQL query in API handler, returns JSON
4. Server Component renders HTML with data
5. HTML sent to CDN → cached → delivered to browser
6. Client hydrates with interactive components (filters, map)

**Realtime Listing Update (SSE):**

1. Client opens EventSource connection to `/api/stream/listings`
2. Server keeps connection alive with heartbeat events
3. Server detects new/updated listing (simulated or from webhook)
4. Server sends `data: {...listing}\n\n` to all connected clients
5. Client receives event, updates UI (fade-in, badge, list prepend)

## Frontend Application Architecture

### Routing and Layouts

#### Route Structure

```
/                          → Search page (SSR with client filters)
/listing/[id]             → Listing detail page (SSR + dynamic SEO)
/saved-search             → Saved search form and list (client-driven)
/api/listings             → API endpoint
/api/listings/nearby      → API endpoint
/api/saved-search         → API endpoint
/api/stream/listings      → SSE endpoint
```

#### Layout Hierarchy

```
app/layout.tsx (Root Layout)
├── Header (navigation, user badge)
├── Metadata (global title, description)
└── children
    ├── app/page.tsx (Search Page)
    │   ├── SearchFilters (client component)
    │   ├── RealtimeListings (client component + SSE)
    │   └── MiniMap (client component)
    │
    ├── app/listing/[id]/page.tsx (Detail Page)
    │   ├── Listing details (server component)
    │   └── Similar nearby section (server component)
    │
    └── app/saved-search/page.tsx (Form Page)
        ├── SavedSearchForm (client component)
        └── SavedSearchList (client component)
```

**Nested Layouts Strategy:**

- Root layout provides shared header and global styles
- Page-level layouts could be added for sub-sections (e.g., `/admin` with sidebar)
- Shared components (Header, Footer) are rendered once and persist across navigation

### State Management Strategy

#### 1. **Search Filters**

- **Storage**: URL query parameters (`useSearchParams`)
- **Why**:
  - Shareable links
  - Browser back/forward support
  - SSR-friendly (server reads params, no hydration mismatch)
- **Flow**:
  - User changes filter → `router.push()` with new URLSearchParams → SSR re-renders

#### 2. **Currently Selected Listing**

- **Storage**: Local React state (`useState` in parent component)
- **Why**: Ephemeral, no need to persist; resets on navigation
- **Flow**:
  - User hovers card → `setSelectedId(id)` → MiniMap highlights marker
  - User clicks map marker → `setSelectedId(id)` → ListingCard highlights

#### 3. **Saved Searches**

- **Storage**: Database (`saved_search` table), fetched via API
- **Client State**: React state (`useState`) after fetch
- **Why**: Persistent, user-specific, needs CRUD operations
- **Flow**:
  - Page load → `fetch('/api/saved-search')` → `setSavedSearches(data)`
  - User submits form → `POST /api/saved-search` → refetch list

#### 4. **SSE/Realtime Stream Data**

- **Storage**: React state (`useState` in `RealtimeListings` component)
- **Why**: Temporary, append-only updates to existing list
- **Flow**:
  - EventSource receives message → `setListings(prev => [newListing, ...prev])`
  - Mark as "new" → fade-in animation → remove badge after 10s

#### 5. **User Session**

- **Storage**: Cookie or NextAuth session (future)
- **Current**: Hard-coded "guest" user ID
- **Why**: Persistent across page loads, secure (HTTP-only cookie)

**State Management Tool Selection:**

- **Current**: No external library (React Context + URL state)
- **Future**: For complex apps, consider Zustand (lightweight) or React Query (data fetching + caching)

### Component Design and Composition

#### Component Hierarchy

```
├── Header
│   └── Navigation links, user badge
├── SearchFilters
│   ├── Text input (address query)
│   ├── Number inputs (price range)
│   └── Selects (beds/baths)
├── MiniMap
│   ├── Canvas rendering
│   ├── Marker positioning logic
│   └── Tooltip overlay
├── RealtimeListings
│   ├── SSE connection management
│   ├── ListingCard (repeated)
│   └── Connection status indicator
├── ListingCard
│   ├── Address, price, beds/baths
│   ├── "NEW" badge (conditional)
│   └── Hover/click handlers
└── SavedSearchForm
    ├── Form inputs with validation
    └── Toast notification
```

#### Responsiveness Strategy

- **Approach**: Mobile-first with Tailwind breakpoints (`lg:`, `md:`)
- **Examples**:
  - Filters: Top on mobile (`flex-col`), sidebar on desktop (`lg:col-span-1`)
  - Map: Below listings on mobile, side-by-side on desktop (`lg:grid-cols-2`)
  - Listing cards: Full-width on mobile, grid on desktop (`md:grid-cols-2 lg:grid-cols-3`)

#### Accessibility

- **Semantic HTML**: `<nav>`, `<main>`, `<article>`, `<button>` (not `<div onClick>`)
- **ARIA**:
  - `aria-label` on canvas map markers
  - `role="article"` on listing cards
  - `aria-live="polite"` on realtime updates
- **Keyboard Navigation**:
  - All interactive elements are focusable (native `<button>`, `<a>`, `<input>`)
  - Tab order follows visual order
  - Map markers can be navigated with tab + enter
- **Color Contrast**: Tailwind's default colors meet WCAG AA standards

#### Theming / Design System

- **Current**: Tailwind utility classes + custom color palette
- **Future**:
  - Extract common patterns into reusable components (`<Button>`, `<Card>`, `<Input>`)
  - Use shadcn/ui or a similar library for pre-built accessible components
  - Define design tokens in `tailwind.config.ts` (spacing, colors, typography)

## Data Fetching, Caching, and SEO Strategy

### Data Fetching

#### Server Components (RSC)

- **Used for**:
  - Search page initial render (`app/page.tsx`)
  - Listing detail page (`app/listing/[id]/page.tsx`)
- **Why**:
  - Reduce client bundle size (no fetch logic in browser)
  - SEO-friendly (HTML includes data)
  - Faster initial paint (no waterfall of client requests)
- **How**: Direct database queries in Server Components or fetch from API routes

#### Client Hooks

- **Used for**:
  - Saved searches form (fetch on mount, POST on submit)
  - SSE stream (EventSource in `useEffect`)
- **Why**:
  - Interactive forms need client-side validation
  - Realtime updates require persistent connection
- **How**: `fetch()` in `useEffect`, manually manage loading/error states

#### Search Page Data Flow

1. **SSR**: Server reads `searchParams`, queries DB, passes `listings` as prop
2. **Client Hydration**: `SearchFilters` component mounts, binds event handlers
3. **Filter Change**: User updates filter → `router.push()` → full page navigation (SSR again)
4. **Optimization**: Could use client-side fetch for instant feedback, but SSR ensures SEO + shareable URLs

#### Details Page Data Flow

1. **SSR**: Server queries listing by ID, calculates nearby listings (Haversine)
2. **Client Hydration**: Interactive elements (hover effects) bind
3. **Similar Nearby**: Rendered server-side (no client fetch), pre-loaded in HTML

### Caching Strategy

#### ISR (Incremental Static Regeneration)

- **Usage**: `export const revalidate = 60` in search and detail pages
- **Effect**:
  - First request after 60s triggers background revalidation
  - Stale content served immediately (stale-while-revalidate)
- **Why**: Balance freshness with performance

#### API Route Caching

```typescript
Cache-Control: public, max-age=30, s-maxage=60
```

- **`max-age=30`**: Browser caches for 30s
- **`s-maxage=60`**: CDN caches for 60s
- **Why**: Reduce database load, improve response time for repeat requests

#### Client-Side Caching

- **Current**: None (React Query or SWR could be added)
- **Future**:
  - Cache listing detail fetches for 5 minutes
  - Invalidate on SSE update (if listing ID matches)

### SEO Strategy

#### Metadata Generation

- **Search Page**:
  ```typescript
  export const metadata: Metadata = {
    title: "Search Properties - Dubai Real Estate",
    description: "Browse thousands of properties...",
    openGraph: { title: "...", description: "..." },
  };
  ```
- **Detail Page**:
  ```typescript
  export async function generateMetadata({ params }) {
    const listing = await fetchListing(params.id);
    return {
      title: `${listing.address} - ${formatPrice(listing.price)}`,
      description: `${listing.beds} bed, ${listing.baths} bath...`,
    };
  }
  ```

#### Core Web Vitals Optimization

- **LCP (Largest Contentful Paint)**:
  - SSR ensures HTML with content on first paint
  - Critical CSS inlined (Tailwind JIT)
  - Avoid large images above fold (or use `next/image` with priority)
- **CLS (Cumulative Layout Shift)**:
  - Reserve space for map (`h-96` fixed height)
  - Skeleton loaders for listings (future enhancement)
- **INP (Interaction to Next Paint)**:
  - Debounce filter inputs (avoid excessive re-renders)
  - Offload heavy computations (Haversine) to server

#### SEO Best Practices

- **Server-Side Rendering**: All pages are SSR or ISR (not CSR)
- **Semantic HTML**: `<h1>`, `<h2>`, `<nav>`, `<article>`
- **Structured Data**: Could add JSON-LD for `Product` or `Place` schema (future)
- **Sitemap**: Generate dynamic sitemap from DB (`/sitemap.xml`)
- **Robots.txt**: Allow all, disallow `/api/*`

## Realtime Updates and Trade-offs

### Realtime Channel Choice: Server-Sent Events (SSE)

#### Comparison

| Feature             | SSE                               | WebSockets                              | Polling                    |
| ------------------- | --------------------------------- | --------------------------------------- | -------------------------- |
| **Protocol**        | HTTP (text/event-stream)          | WebSocket (ws://)                       | HTTP (repeated requests)   |
| **Direction**       | Server → Client                   | Bidirectional                           | Client → Server            |
| **Browser Support** | All modern browsers               | All modern browsers                     | All browsers               |
| **Reconnection**    | Built-in (automatic retry)        | Manual implementation                   | Trivial (just retry)       |
| **Complexity**      | Low (native EventSource API)      | Medium (need library or manual parsing) | Very Low                   |
| **Scalability**     | Moderate (long-lived connections) | Moderate (long-lived connections)       | Poor (constant requests)   |
| **Use Case Fit**    | Perfect (server pushes updates)   | Overkill (no client → server data)      | Wasteful (empty responses) |

#### Chosen Mechanism: **SSE**

**Justification:**

1. **Unidirectional Data Flow**: We only need server → client updates (new listings)
2. **Native Browser API**: `EventSource` is trivial to use in React (`useEffect`)
3. **Next.js Compatibility**: Easy to implement in Route Handlers (streaming response)
4. **Automatic Reconnection**: Browser retries on disconnect
5. **Lower Overhead**: No WebSocket handshake, no binary framing
6. **Debugging**: Plain text, visible in Network tab

**Tradeoffs:**

- **Limitation**: Cannot send data from client → server over same connection (but we don't need this)
- **Scalability**: Each connection holds a server thread/worker (solution: scale horizontally)

### Data Consistency and UX

#### Interaction with Cached Data

- **Problem**: SSE sends new listing, but user's cached search may not include it (filter mismatch)
- **Solution**:
  - Client-side filter check: Only display SSE listing if it matches current filters
  - Optimistic UI: Show "1 new listing" badge, user clicks to refresh

#### Saved Searches Integration

- **Problem**: User has saved search for "Marina, 2+ beds"; how to highlight SSE updates?
- **Solution**:
  - Server includes saved search IDs in SSE payload
  - Client checks if new listing matches any saved search
  - Show badge: "New listing for 'Marina Search'"

#### Avoiding Confusing UI

- **Problem**: New listings prepend to list, causing scroll jump
- **Solutions**:
  1. **Freeze Scroll**: Prepend above viewport, user can click "Show new listings" to scroll up
  2. **Badge Only**: Show count of new listings, user clicks to reload
  3. **Smooth Transition**: Fade-in animation, delay before full opacity
- **Chosen Approach**: Fade-in animation + "NEW" badge for 10 seconds

#### Reconnection Strategy

- **On Error**: EventSource automatically retries with exponential backoff
- **Visual Indicator**: Connection status dot (green/yellow/red) in UI
- **Graceful Degradation**: If SSE fails, app still works (no realtime, but search + detail pages functional)

### Future-Proofing

#### Multi-Region Support

- **Challenge**: SSE connections are stateful; user in Dubai connects to Middle East server
- **Solution**:
  - Regional databases with replication
  - SSE endpoint routes to nearest region
  - Use Redis Pub/Sub to broadcast updates across regions

#### Mobile App Integration

- **Challenge**: Mobile apps may use native WebSocket libraries
- **Solution**:
  - Maintain SSE for web
  - Add WebSocket endpoint (`/api/ws`) for mobile
  - Share business logic (listing updates) between both channels

#### Horizontal Scaling

- **Challenge**: SSE connections pin to single server; load balancer can't distribute
- **Solution**:
  - **Redis Pub/Sub**: All servers subscribe to "new_listing" channel
  - When new listing arrives, publish to Redis
  - All connected clients (across all servers) receive update
  - Load balancer uses sticky sessions or consistent hashing

---

## Conclusion

This architecture balances **simplicity** (monolithic Next.js, SQLite for dev) with **scalability** (clear service boundaries, caching layers, horizontal scaling strategy). The frontend emphasizes **SSR for SEO**, **URL-based state for shareability**, and **component composition for maintainability**. SSE provides realtime updates with minimal complexity, and the design supports future microservices extraction (e.g., separate listing service, auth service).

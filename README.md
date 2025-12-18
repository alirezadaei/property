# Property Search & Map Explorer

A modern Next.js 15 application for searching and exploring property listings in Dubai with real-time updates, interactive map, and saved searches.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn

### Installation & Setup

```bash
# Install dependencies
npm install

# Seed the database with sample data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Search page (/)
│   │   ├── listing/[id]/      # Listing detail pages
│   │   ├── saved-search/      # Saved searches page
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── Header.tsx         # Navigation header
│   │   ├── MiniMap.tsx        # Canvas-based interactive map
│   │   ├── ListingCard.tsx    # Property listing card
│   │   ├── SearchFilters.tsx  # Filter controls
│   │   └── RealtimeListings.tsx  # SSE-powered listing feed
│   ├── db/                    # Database configuration
│   │   ├── schema.ts          # Drizzle ORM schema
│   │   └── index.ts           # Database connection
│   └── lib/                   # Utility functions
│       ├── utils.ts           # Helper functions (formatting, distance calc)
│       └── validations.ts     # Zod schemas
├── scripts/
│   └── seed.ts                # Database seeding script
├── sample-data.json           # Sample property data (20 listings)
├── architecture.md            # Architecture documentation
└── sqlite.db                  # SQLite database (generated)
```

## 🎯 Key Features

### Search Page (SSR + Client UX)

- **Route**: `/`
- Server-side rendered with ISR (revalidate: 60s)
- Filters: text search, price range, beds/baths minimum
- URL-synced state (shareable links)
- Responsive layout (mobile: stacked, desktop: sidebar + content)
- Interactive mini-map synced with listing cards
- Empty state and loading indicators
- Keyboard accessible

### Listing Detail Page (SSR)

- **Route**: `/listing/[id]`
- Server-side rendered with dynamic metadata
- Full listing details with formatted price, beds/baths
- "Similar Nearby" section (Haversine distance, 5km radius)
- SEO-optimized (unique title, description, OpenGraph tags)
- "Back to Search" navigation

### Saved Search Feature

- **Route**: `/saved-search`
- Client-side form with validation (Zod schema)
- Fields: name, query, price range, beds/baths, location radius
- Toast notifications on save
- List of saved searches with "Apply Search" button
- Data persists to SQLite database

### Realtime Updates (SSE)

- **Endpoint**: `/api/stream/listings`
- Server-Sent Events with 8-15 second intervals
- Heartbeat every 15 seconds
- Connection status indicator (green/yellow/red dot)
- New listings highlighted with "NEW" badge and fade-in animation
- Badge disappears after 10 seconds
- Automatic reconnection on error

### Mini-Map Component

- Canvas-based rendering (600x400px)
- Coordinate transformation (lat/lng → x/y)
- Interactive markers with hover tooltips
- Click to navigate to listing detail
- Synced with listing card hover state
- ARIA labels for accessibility

### API Routes

- `GET /api/listings` — Search with filters, pagination
- `GET /api/listings/nearby` — Geospatial query (Haversine)
- `GET /api/saved-search` — Fetch user's saved searches
- `POST /api/saved-search` — Create new saved search
- `GET /api/stream/listings` — SSE stream
- All endpoints have validation (Zod) and caching headers

### Architecture Documentation

- **File**: `architecture.md`
- High-level system architecture diagram
- Frontend architecture (routing, state management, component design)
- Data fetching, caching, and SEO strategy
- Realtime updates analysis (SSE vs WebSockets vs Polling)
- Trade-offs and scaling considerations

## 🗄️ Database

### ORM: Drizzle

- **Database**: SQLite (development), easily swappable to PostgreSQL for production
- **Tables**:
  - `listing`: Property listings (id, address, city, lat, lng, price, beds, baths, status, updated_at)
  - `saved_search`: User's saved searches (id, user_id, name, filters, created_at)

### Seeding

The `scripts/seed.ts` script reads `sample-data.json` and populates the database with 20 Dubai property listings.

```bash
npm run db:seed
```

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS
- **Database**: SQLite + Drizzle ORM
- **Validation**: Zod
- **Realtime**: Server-Sent Events (native EventSource API)
- **Map**: Custom canvas-based implementation

## 🔑 Features & UX Highlights

### Responsive Design

- Mobile-first approach with Tailwind breakpoints
- Filters collapse into top section on mobile
- Map adapts to viewport size
- Grid layouts adjust for tablet/desktop

### Accessibility

- Semantic HTML (`<nav>`, `<main>`, `<article>`)
- ARIA labels on interactive elements
- Keyboard navigable (tab through filters, listings, map markers)
- Color contrast meets WCAG AA standards

### SEO & Performance

- Server-side rendering for search and detail pages
- ISR with 60s revalidation
- API caching (Cache-Control headers)
- Dynamic metadata generation
- Unique titles and OpenGraph tags per page

### UX Polish

- Hover effects on listing cards sync with map markers
- Smooth fade-in animations for new listings
- Toast notifications for saved search feedback
- Connection status indicator for SSE
- Empty state messages with actionable suggestions

## 🧪 Authentication

Currently using **guest mode**:

- All users share a "guest" user ID
- Saved searches are stored per user but accessible to all guests
- Header displays "Signed in as Guest"

**Future**: Integrate NextAuth or similar for proper authentication.

## 📊 Caching Strategy

### ISR (Incremental Static Regeneration)

```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

- Search page and listing detail pages use ISR
- Stale-while-revalidate pattern

### API Route Caching

```typescript
Cache-Control: public, max-age=30, s-maxage=60
```

- Browser caches for 30 seconds
- CDN caches for 60 seconds

## 🚧 Design Decisions & Trade-offs

### Project Scope

The project focuses on delivering a production-ready real estate search platform with:

1. **Core functionality**: Complete search, filtering, and real-time updates
2. **Frontend quality**: Responsive, accessible, polished UI
3. **Architecture clarity**: Clean component structure, proper separation of concerns

### Future Enhancements

- Optimistic UI updates for saved searches
- Advanced map features (zoom, pan, clustering)
- E2E tests
- AI-powered listing summaries
- Production-grade error handling (Sentry, etc.)
- Rate limiting on API routes

### Database Choice

- **Development**: SQLite (zero-config, fast for prototyping)
- **Production**: Would use PostgreSQL with PostGIS extension for efficient geospatial queries

### Geospatial Queries

- Currently using Haversine distance in-memory (acceptable for 20 listings)
- For production scale (millions of listings), would use:
  - PostgreSQL with PostGIS (`ST_DWithin` for radius queries)
  - Spatial indexes for fast lookups

## 📝 Usage Guide

### 1. Search for Properties

- Navigate to homepage (`/`)
- Use filters in the left sidebar (desktop) or top (mobile)
- Type address keywords, set price range, select minimum beds/baths
- Click "Apply Filters" to update results
- Results are reflected in the URL (shareable)

### 2. Explore the Map

- Hover over listing cards to highlight corresponding map markers
- Click map markers to navigate to listing detail page
- Tooltips show address, price, and key stats on hover

### 3. View Listing Details

- Click any listing card or map marker
- View full property details, location coordinates, and status
- Scroll to "Similar Properties Nearby" section
- Click "Back to Search" to return (preserves filters if using browser back)

### 4. Save Searches

- Navigate to "Saved Searches" in header
- Fill out the form with search criteria and a name
- Click "Save Search"
- View saved searches in the right panel
- Click "Apply Search" to navigate to search page with those filters

### 5. Monitor Realtime Updates

- Stay on the search page
- New listings will appear at the top with a "NEW" badge and green border
- Connection status indicator shows realtime stream health
- Listings automatically fade in and badge disappears after 10 seconds

## 🏗️ Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Seed database
npm run db:seed

# Open Drizzle Studio (database GUI)
npm run db:studio

# Push schema changes
npm run db:push
```

## 📐 Architecture Decisions

See [architecture.md](architecture.md) for detailed documentation on:

- High-level system design
- Frontend architecture patterns
- Data fetching and caching strategies
- Realtime update mechanisms
- Trade-offs and scaling considerations

## 📚 Documentation

This project includes comprehensive documentation covering:

- ✅ High-level system architecture
- ✅ Frontend application architecture
- ✅ Data fetching, caching, and SEO strategy
- ✅ Realtime updates and trade-offs
- ✅ Component architecture and state management
- ✅ Performance optimization and accessibility

---

**Author**: Alireza Rostami  
**Last Updated**: December 2025

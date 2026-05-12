# ravelry-mcp — Specification

> A complete, public MCP server for the Ravelry API using HTTP Basic Auth.
> Intended for npm publication as `ravelry-mcp`.

---

## 1. Project Overview

A TypeScript MCP server that gives Claude (and any MCP-compatible AI client) full
access to Ravelry's pattern database, yarn database, and authenticated user notebook
(queue, stash, projects, favorites, library). Designed to run locally on macOS
(stdio transport for Claude Desktop) using HTTP Basic Auth credentials stored in
`claude_desktop_config.json`.

**Goals:**
- Simple credential setup: two env vars in `claude_desktop_config.json`, no browser flow
- Publishable on npm with a single `npx ravelry-mcp` install path
- No token files on disk — credentials live only in `claude_desktop_config.json`
- Full read coverage of the public Ravelry API
- Write coverage for the authenticated user's notebook (queue, stash, projects, favorites)
- Clean separation of public (no auth needed) vs. authenticated tools

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | MCP SDK is TS-first; ecosystem standard |
| MCP SDK | `@modelcontextprotocol/sdk` | Official SDK, stdio transport |
| HTTP client | Native `fetch` (Node 18+) | No extra deps; Node 18 is baseline |
| Auth | HTTP Basic Auth via env vars | Correct model for single-user local tools |
| Build | `tsup` | Fast bundler, CJS + ESM output |
| Test | `vitest` | Fast, TS-native |
| Runtime | Node.js ≥ 18 | Native fetch, stable |

---

## 3. Repository Structure

```
ravelry-mcp/
├── src/
│   ├── index.ts            # Entry point — creates and starts MCP server
│   ├── server.ts           # MCP server definition, tool/resource registration
│   ├── api/
│   │   ├── client.ts       # Base fetch wrapper (Basic Auth headers, error handling, rate limit)
│   │   ├── patterns.ts     # Pattern search + detail calls
│   │   ├── yarns.ts        # Yarn search + detail calls
│   │   ├── people.ts       # Queue, stash, projects, favorites, library
│   │   ├── designers.ts    # Designer detail calls
│   │   ├── shops.ts        # Shop search + detail calls
│   │   └── reference.ts    # Color families, yarn weights, pattern categories
│   ├── tools/
│   │   ├── patterns.ts     # MCP tool definitions for patterns
│   │   ├── yarns.ts        # MCP tool definitions for yarns
│   │   ├── notebook.ts     # MCP tool definitions for authenticated user notebook
│   │   ├── designers.ts    # MCP tool definitions for designers
│   │   ├── shops.ts        # MCP tool definitions for shops
│   │   └── reference.ts    # MCP tool definitions for reference data
│   ├── resources/
│   │   └── index.ts        # MCP resource definitions
│   └── types/
│       └── ravelry.ts      # TypeScript types for Ravelry API responses
├── CLAUDE.md               # Context for Claude Code
├── README.md               # Setup guide + claude_desktop_config.json snippet
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 4. Authentication Design

### HTTP Basic Auth via Environment Variables

Ravelry's Basic Auth app type is the correct model for a local single-user tool.
The user creates a Ravelry Pro app once, receives two static credentials, and
places them in `claude_desktop_config.json`. Every API call sends these as an
HTTP Basic Auth header. No browser flow, no token storage, no external relay.

---

**Prerequisite for users:** Create a free Ravelry Pro app at
`https://www.ravelry.com/pro/developer`. Choose app type **"Basic Auth (read/write)"**.
Copy the **Access Key** and **Personal Key**.

**Config in `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "ravelry": {
      "command": "npx",
      "args": ["-y", "ravelry-mcp"],
      "env": {
        "RAVELRY_ACCESS_KEY": "your_access_key",
        "RAVELRY_PERSONAL_KEY": "your_personal_key"
      }
    }
  }
}
```

**How `client.ts` sends auth:**
```typescript
const credentials = Buffer.from(
  `${process.env.RAVELRY_ACCESS_KEY}:${process.env.RAVELRY_PERSONAL_KEY}`
).toString('base64');

headers['Authorization'] = `Basic ${credentials}`;
```

**Startup validation:** On server start, call `GET /current_user.json` immediately.
If it returns `401`, surface a clear error message telling the user to check their
credentials in `claude_desktop_config.json`. If it succeeds, cache the username
in memory for use in notebook endpoint paths. The server should not start
accepting tool calls until this check passes.

**Credential regeneration:** If credentials are compromised, the user regenerates
them at `ravelry.com/pro/developer` and updates `claude_desktop_config.json`.
No token files, no relay infrastructure, nothing else to update.

---

## 5. Tool Definitions

### 5.1 Connection

#### `ravelry_whoami`
Verify the current credentials and return the authenticated user's basic info.
Useful for confirming setup is working correctly.
- **Parameters:** none
- **Returns:** username, avatar URL, profile URL

---

### 5.2 Patterns

#### `search_patterns`
Search Ravelry's pattern database.
- **Parameters:**
  - `query` (string, optional) — keyword search
  - `craft` (enum: `knitting` | `crochet` | `weaving` | `spinning`, optional)
  - `availability` (enum: `free` | `ravelry` | `purchase` | `book`, optional)
  - `yarn_weight` (enum: `fingering` | `sport` | `dk` | `worsted` | `aran` | `bulky` | `super-bulky`, optional)
  - `difficulty_min` (number 1–10, optional)
  - `difficulty_max` (number 1–10, optional)
  - `fit` (string, optional) — e.g. `adult`, `baby`, `child`
  - `pc` (string, optional) — pattern category permalink (e.g. `knitting--garment--sweater`)
  - `colors` (number, optional) — number of colors in pattern
  - `page` (number, default 1)
  - `page_size` (number, default 10, max 100)
  - `sort` (enum: `best` | `date` | `projects` | `queued` | `favorites` | `rating`, optional)
- **Returns:** list of patterns with id, name, designer, permalink, photo URL, craft,
  free/price, difficulty, yardage, yarn weight, rating

#### `get_pattern`
Get full details for a single pattern by ID.
- **Parameters:**
  - `id` (number, required)
- **Returns:** complete pattern object including gauge, needle sizes, sizes available,
  yarn requirements, notes preview, all photos, PDF info, designer

#### `get_patterns`
Get details for multiple patterns by ID in one call.
- **Parameters:**
  - `ids` (array of numbers, required, max 100)
- **Returns:** array of pattern objects

---

### 5.3 Yarns

#### `search_yarns`
Search the Ravelry yarn database.
- **Parameters:**
  - `query` (string, optional)
  - `weight` (enum: same as yarn_weight above, optional)
  - `fiber_type` (string, optional) — e.g. `wool`, `cotton`, `alpaca`
  - `company_name` (string, optional)
  - `rating_min` (number, optional)
  - `discontinued` (boolean, optional)
  - `page` (number, default 1)
  - `page_size` (number, default 10, max 100)
  - `sort` (enum: `best` | `projects` | `rating`, optional)
- **Returns:** list of yarns with id, name, company, weight, rating, fiber content,
  colorways count, permalink

#### `get_yarn`
Get full details for a single yarn by ID.
- **Parameters:**
  - `id` (number, required)
- **Returns:** complete yarn object including fiber content, gauge, yardage per skein,
  weight, all colorways, discontinued status, photos, shop links

#### `get_yarns`
Get details for multiple yarns by ID.
- **Parameters:**
  - `ids` (array of numbers, required, max 100)
- **Returns:** array of yarn objects

---

### 5.4 User Notebook (requires Basic Auth read/write app)

#### `get_current_user`
Get the currently authenticated Ravelry user.
- **Parameters:** none
- **Returns:** username, avatar URL, profile URL, small counts (projects, stash, etc.)

#### `get_queue`
Get the authenticated user's pattern queue.
- **Parameters:**
  - `query` (string, optional) — filter within queue
  - `page` (number, default 1)
  - `page_size` (number, default 25)
- **Returns:** queued patterns with position, linked stash yarn, added date

#### `add_to_queue`
Add a pattern to the authenticated user's queue.
- **Parameters:**
  - `pattern_id` (number, required)
  - `stash_id` (number, optional) — link a specific stash yarn
  - `sort_position` (number, optional)
- **Returns:** created queue entry

#### `remove_from_queue`
Remove an entry from the authenticated user's queue.
- **Parameters:**
  - `queue_entry_id` (number, required)
- **Returns:** confirmation

#### `get_stash`
Get the authenticated user's yarn stash.
- **Parameters:**
  - `query` (string, optional)
  - `weight` (string, optional)
  - `color_family` (string, optional)
  - `stash_status` (enum: `stash` | `used` | `gifted`, optional)
  - `page` (number, default 1)
  - `page_size` (number, default 25)
- **Returns:** stash entries with yarn name, company, weight, colorway, yardage,
  skein count, color family, photos

#### `get_projects`
Get the authenticated user's projects.
- **Parameters:**
  - `status` (enum: `inprogress` | `finished` | `hibernating` | `frog`, optional)
  - `craft` (string, optional)
  - `page` (number, default 1)
  - `page_size` (number, default 25)
- **Returns:** projects with name, pattern, status, started/finished dates, yarns used, photos

#### `get_favorites`
Get the authenticated user's favorited patterns.
- **Parameters:**
  - `type` (enum: `patterns` | `yarns` | `people`, optional, default `patterns`)
  - `query` (string, optional)
  - `page` (number, default 1)
  - `page_size` (number, default 25)
- **Returns:** favorited items with added date

#### `add_to_favorites`
Add a pattern or yarn to the authenticated user's favorites.
- **Parameters:**
  - `type` (enum: `pattern` | `yarn`, required)
  - `id` (number, required)
- **Returns:** created favorite entry

#### `get_library`
Get the authenticated user's pattern library (purchased/downloaded patterns).
- **Parameters:**
  - `query` (string, optional)
  - `page` (number, default 1)
  - `page_size` (number, default 25)
- **Returns:** library entries with pattern name, purchase date, PDF availability

---

### 5.5 Designers

#### `get_designer`
Get a designer's profile and pattern summary.
- **Parameters:**
  - `id` (number, required)
- **Returns:** designer name, bio, website, pattern count, top patterns

#### `search_designers`
Search for designers by name.
- **Parameters:**
  - `query` (string, required)
  - `page` (number, default 1)
  - `page_size` (number, default 10)
- **Returns:** list of designers with id, name, pattern count

---

### 5.6 Shops

#### `search_shops`
Find yarn shops by location or name.
- **Parameters:**
  - `query` (string, optional)
  - `lat` (number, optional)
  - `lng` (number, optional)
  - `miles` (number, optional, default 50) — radius for geo search
  - `page` (number, default 1)
  - `page_size` (number, default 10)
- **Returns:** shops with name, city, country, website, Ravelry URL

#### `get_shop`
Get full details for a yarn shop.
- **Parameters:**
  - `id` (number, required)
- **Returns:** shop name, address, contact, hours, website, Ravelry community link

---

### 5.7 Reference Data

#### `get_color_families`
Get all Ravelry color family names and IDs. Useful for filtering stash or yarns.
- **Parameters:** none
- **Returns:** list of color families (cached — rarely changes)

#### `get_yarn_weights`
Get all Ravelry yarn weight definitions (name, WPI range, etc.).
- **Parameters:** none
- **Returns:** list of yarn weights with name and description (cached)

#### `get_pattern_categories`
Get the full Ravelry pattern category tree.
- **Parameters:** none
- **Returns:** nested category structure useful for populating `pc` filter in search_patterns

---

## 6. MCP Resources

Expose the following as MCP resources (readable by any MCP client):

| URI | Description |
|---|---|
| `ravelry://current-user` | Authenticated user's profile and counts |
| `ravelry://patterns/{id}` | Full pattern data |
| `ravelry://yarns/{id}` | Full yarn data |
| `ravelry://queue` | Current user's queue |
| `ravelry://stash` | Current user's stash |

---

## 7. Error Handling

- Ravelry API returns `401` → surface a clear error message directing the user to
  check `RAVELRY_ACCESS_KEY` and `RAVELRY_PERSONAL_KEY` in `claude_desktop_config.json`
- Ravelry API rate limit hit (`429`) → exponential backoff with up to 3 retries; surface error with retry-after advice if all retries exhausted
- Network errors → surface clean error, not a stack trace
- All errors returned as MCP error responses (not thrown exceptions)

---

## 8. Publishing Plan

- Package name: `ravelry-mcp`
- npm publish with `bin` entry pointing to the built `index.js`
- README includes:
  - Ravelry Pro app setup (with screenshots callout)
  - `claude_desktop_config.json` snippet with env var placement
  - Full tool reference table
- Semantic versioning starting at `0.1.0`
- GitHub repo: `buzzsurfr/ravelry-mcp` (or org of your choice)
- MIT license
- Future: `.dxt` Desktop Extension packaging once the ecosystem matures

---

## 9. Ravelry API Base URL and Auth Headers

```
Base URL: https://api.ravelry.com
Auth:      Authorization: Basic base64(RAVELRY_ACCESS_KEY:RAVELRY_PERSONAL_KEY)
Accept:    application/json
```

All endpoints append `.json` to the path (e.g. `/patterns/search.json`).

---

## 10. Known Constraints and Watch-outs

- **Startup credential check is mandatory** — call `GET /current_user.json` before
  accepting any tool calls; a clear `401` message is far better than a cryptic
  failure inside a tool call
- Ravelry's API documentation lives at `ravelry.com/api` (requires Ravelry login to view)
- Write operations (add_to_queue, add_to_favorites) require the app to be created
  with "read/write" access at Ravelry Pro — document this clearly; a read-only app
  will silently fail on write calls with a `401`
- The `get_projects`, `get_stash`, `get_queue`, `get_favorites`, `get_library`
  endpoints use `{username}` in the path — cache this from the startup
  `current_user` call; do not call it again on every tool invocation
- Bulk pattern/yarn fetches (`get_patterns`, `get_yarns`) are significantly more
  efficient than individual calls — chunk arrays into batches of 100
- Rate limits are not publicly documented by Ravelry — add exponential backoff
  on `429` responses as a safe default
- The Access Key and Personal Key are long-lived — document that users should
  treat them like passwords and can regenerate them at any time from the Ravelry
  Pro dashboard without affecting any other part of the setup

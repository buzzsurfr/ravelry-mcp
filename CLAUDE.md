# ravelry-mcp — Claude Code Context

## What This Is

A TypeScript MCP server that connects Claude Desktop to the Ravelry knitting/crochet API.
Intended for npm publication as `ravelry-mcp`. Uses HTTP Basic Auth — no OAuth, no token files.

## Auth Model

- Two env vars: `RAVELRY_ACCESS_KEY` and `RAVELRY_PERSONAL_KEY` (set in `claude_desktop_config.json`)
- Every request sends `Authorization: Basic base64(ACCESS_KEY:PERSONAL_KEY)`
- On startup, `validateCredentials()` in `src/api/client.ts` calls `GET /current_user.json`
  - On success: caches `username` in memory (used for all notebook endpoint paths)
  - On 401: exits with a clear message pointing to `claude_desktop_config.json`
- The server does not start accepting tool calls until this check passes

## Project Structure

```
src/
  index.ts          — Entry point; calls validateCredentials(), then starts MCP server
  server.ts         — Creates McpServer, calls all register*() functions
  api/
    client.ts       — fetch wrapper: Basic Auth, 429 backoff, clean errors
    patterns.ts     — /patterns/search.json, /patterns/{id}.json, /patterns.json?ids=
    yarns.ts        — /yarns/search.json, /yarns/{id}.json, /yarns.json?ids=
    people.ts       — Queue, stash, projects, favorites, library (all /people/{username}/...)
    designers.ts    — /designers/{id}.json, /designers/search.json
    shops.ts        — /shops/search.json, /shops/{id}.json
    reference.ts    — Color families, yarn weights, pattern categories (in-memory cached)
  tools/
    patterns.ts     — search_patterns, get_pattern, get_patterns
    yarns.ts        — search_yarns, get_yarn, get_yarns
    notebook.ts     — get_current_user, queue CRUD, stash, projects, favorites, library
    designers.ts    — get_designer, search_designers
    shops.ts        — search_shops, get_shop
    reference.ts    — ravelry_whoami, get_color_families, get_yarn_weights, get_pattern_categories
  resources/
    index.ts        — 5 MCP resources: current-user, patterns/{id}, yarns/{id}, queue, stash
  types/
    ravelry.ts      — TypeScript interfaces for all Ravelry API responses
```

## Key Implementation Details

- All Ravelry API paths end in `.json` — always include the extension
- Notebook endpoints embed `{username}` in the path — always use `getUsername()` from `client.ts`, never call the API again
- `get_patterns` and `get_yarns` chunk IDs into batches of 100 (`/patterns.json?ids=1,2,...`)
- Reference data (color families, yarn weights, pattern categories) is cached in memory in `api/reference.ts`
- Rate limit (429) handling: exponential backoff, up to 3 retries (1s → 2s → 4s delays)
- All tool handlers wrap in try/catch and return `{ isError: true }` — never throw from a tool handler
- Write operations (add_to_queue, add_to_favorites) require the Ravelry app to be "Basic Auth read/write"

## Build & Test

```bash
npm install
npm run build   # tsup → dist/index.js (with #!/usr/bin/env node banner)
npm test        # vitest run (tests in tests/)
```

Output: `dist/index.js` — single ESM bundle with shebang, referenced in package.json `bin`

## Ravelry API Base URL

```
https://api.ravelry.com
```

Ravelry API docs require a Ravelry login to view at ravelry.com/api.

## Adding New Tools

1. Add the API function to the appropriate `src/api/*.ts` module
2. Add the tool registration to the corresponding `src/tools/*.ts` file using `server.tool(name, description, zodSchema, handler)`
3. No changes needed to `server.ts` if using an existing tool file's `register*()` function
4. Add TypeScript types to `src/types/ravelry.ts` if needed

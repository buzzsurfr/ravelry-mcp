# ravelry-mcp

An MCP server that gives Claude full access to the [Ravelry](https://www.ravelry.com) knitting and crochet API — pattern search, yarn database, and your personal notebook (queue, stash, projects, favorites, library).

## Prerequisites

- Node.js 18 or later
- A free [Ravelry](https://www.ravelry.com) account
- [Claude Desktop](https://claude.ai/download)

## Setup

### 1. Create a Ravelry Pro App

1. Go to [ravelry.com/pro/developer](https://www.ravelry.com/pro/developer) (requires Ravelry login)
2. Click **Create a new app**
3. Fill in the form:
   - **App name:** anything you like (e.g. `claude-mcp`)
   - **App type:** choose **Basic Auth (read/write)**  
     ⚠️ You must choose read/write — a read-only app will silently fail on queue and favorites writes
   - **Website URL:** `http://localhost` is fine
4. After saving, copy the **Access Key** and **Personal Key** — treat these like passwords

### 2. Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ravelry": {
      "command": "npx",
      "args": ["-y", "ravelry-mcp"],
      "env": {
        "RAVELRY_ACCESS_KEY": "your_access_key_here",
        "RAVELRY_PERSONAL_KEY": "your_personal_key_here"
      }
    }
  }
}
```

Replace `your_access_key_here` and `your_personal_key_here` with the credentials from step 1.

### 3. Restart Claude Desktop

The server validates credentials on startup. If something is wrong you'll see an error in the Claude Desktop logs (Help → Open Logs Folder).

To confirm setup worked, ask Claude: *"Am I connected to Ravelry? Who am I logged in as?"*

## Credential Security

- The Access Key and Personal Key are long-lived static credentials — treat them like passwords
- Never commit `claude_desktop_config.json` to source control
- If credentials are compromised, regenerate them at [ravelry.com/pro/developer](https://www.ravelry.com/pro/developer) and update `claude_desktop_config.json` — nothing else needs to change

---

## Tool Reference

### Connection

| Tool | Description |
|---|---|
| `ravelry_whoami` | Verify credentials and return the authenticated user's username, avatar, and profile URL |

### Patterns

| Tool | Parameters | Description |
|---|---|---|
| `search_patterns` | `query`, `craft`, `availability`, `yarn_weight`, `difficulty_min`, `difficulty_max`, `fit`, `pc`, `colors`, `page`, `page_size`, `sort` | Search Ravelry's pattern database |
| `get_pattern` | `id` (required) | Full details for a single pattern |
| `get_patterns` | `ids[]` (required, max 100) | Batch fetch multiple patterns |

### Yarns

| Tool | Parameters | Description |
|---|---|---|
| `search_yarns` | `query`, `weight`, `fiber_type`, `company_name`, `rating_min`, `discontinued`, `page`, `page_size`, `sort` | Search the Ravelry yarn database |
| `get_yarn` | `id` (required) | Full details for a single yarn |
| `get_yarns` | `ids[]` (required, max 100) | Batch fetch multiple yarns |

### User Notebook (requires read/write app)

| Tool | Parameters | Description |
|---|---|---|
| `get_current_user` | — | Authenticated user profile and counts |
| `get_queue` | `query`, `page`, `page_size` | Your pattern queue |
| `add_to_queue` | `pattern_id`, `stash_id?`, `sort_position?` | Add a pattern to your queue |
| `remove_from_queue` | `queue_entry_id` | Remove an entry from your queue |
| `get_stash` | `query`, `weight`, `color_family`, `stash_status`, `page`, `page_size` | Your yarn stash |
| `get_projects` | `status`, `craft`, `page`, `page_size` | Your knitting/crochet projects |
| `update_project` | `id` (required), `status`, `completed`, `started`, `progress`, `notes`, `name` | Update an existing project (status, dates, progress, notes) |
| `get_favorites` | `type`, `query`, `page`, `page_size` | Your favorited patterns, yarns, or people |
| `add_to_favorites` | `type`, `id` | Add a pattern or yarn to favorites |
| `get_library` | `query`, `page`, `page_size` | Your purchased/downloaded pattern library |

### Designers

| Tool | Parameters | Description |
|---|---|---|
| `get_designer` | `id` (required) | Designer profile and pattern summary |
| `search_designers` | `query` (required), `page`, `page_size` | Search designers by name |

### Shops

| Tool | Parameters | Description |
|---|---|---|
| `search_shops` | `query`, `lat`, `lng`, `miles`, `page`, `page_size` | Find yarn shops by name or location |
| `get_shop` | `id` (required) | Full details for a yarn shop |

### Reference Data

| Tool | Description |
|---|---|
| `get_color_families` | All Ravelry color family names and IDs (cached) |
| `get_yarn_weights` | All yarn weight definitions with WPI and gauge info (cached) |
| `get_pattern_categories` | Full pattern category tree — use permalinks as the `pc` parameter in `search_patterns` (cached) |

---

## MCP Resources

These can be accessed directly by MCP clients:

| URI | Description |
|---|---|
| `ravelry://current-user` | Authenticated user profile |
| `ravelry://patterns/{id}` | Full pattern data |
| `ravelry://yarns/{id}` | Full yarn data |
| `ravelry://queue` | Your current queue (first 50 entries) |
| `ravelry://stash` | Your current stash (first 50 entries) |

---

## Development

```bash
npm install
npm run build    # Compile to dist/
npm run dev      # Watch mode
npm test         # Run tests
```

## License

MIT

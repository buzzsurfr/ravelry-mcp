import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getColorFamilies, getYarnWeights, getPatternCategories } from '../api/reference.js';
import { getCurrentUser } from '../api/people.js';

function toolError(err: unknown) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    isError: true as const,
  };
}

export function registerReferenceTools(server: McpServer): void {
  server.tool(
    'ravelry_whoami',
    'Verify the current Ravelry credentials and return the authenticated user basic info. Use this to confirm setup is working.',
    {},
    async () => {
      try {
        const result = await getCurrentUser();
        const u = result.user;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              username: u.username,
              avatar_url: u.small_photo_url,
              profile_url: `https://www.ravelry.com/people/${u.username}`,
            }, null, 2),
          }],
        };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_color_families',
    'Get all Ravelry color family names and IDs. Useful for filtering stash or yarn searches. Results are cached.',
    {},
    async () => {
      try {
        const result = await getColorFamilies();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_yarn_weights',
    'Get all Ravelry yarn weight definitions including name, WPI range, and gauge info. Results are cached.',
    {},
    async () => {
      try {
        const result = await getYarnWeights();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_pattern_categories',
    'Get the full Ravelry pattern category tree. Use the permalink values as the pc parameter in search_patterns. Results are cached.',
    {},
    async () => {
      try {
        const result = await getPatternCategories();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );
}

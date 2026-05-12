import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getDesigner, searchDesigners } from '../api/designers.js';

function toolError(err: unknown) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    isError: true as const,
  };
}

export function registerDesignerTools(server: McpServer): void {
  server.tool(
    'get_designer',
    "Get a designer's Ravelry profile including bio, website, and pattern count.",
    {
      id: z.number().int().positive().describe('Ravelry designer ID'),
    },
    async ({ id }) => {
      try {
        const result = await getDesigner(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'search_designers',
    'Search for Ravelry designers by name.',
    {
      query: z.string().describe('Designer name to search for'),
      page: z.number().int().positive().default(1).describe('Page number'),
      page_size: z.number().int().min(1).max(100).default(10).describe('Results per page'),
    },
    async ({ query, page, page_size }) => {
      try {
        const result = await searchDesigners(query, page, page_size);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );
}

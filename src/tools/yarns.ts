import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchYarns, getYarn, getYarns } from '../api/yarns.js';

const YARN_WEIGHT = z.enum(['fingering', 'sport', 'dk', 'worsted', 'aran', 'bulky', 'super-bulky']);

function toolError(err: unknown) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    isError: true as const,
  };
}

export function registerYarnTools(server: McpServer): void {
  server.tool(
    'search_yarns',
    "Search the Ravelry yarn database by name, weight, fiber type, company, and more.",
    {
      query: z.string().optional().describe('Keyword search query'),
      weight: YARN_WEIGHT.optional().describe('Filter by yarn weight'),
      fiber_type: z.string().optional().describe('Filter by fiber type, e.g. wool, cotton, alpaca'),
      company_name: z.string().optional().describe('Filter by yarn company name'),
      rating_min: z.number().min(0).max(5).optional().describe('Minimum rating (0–5)'),
      discontinued: z.boolean().optional().describe('Filter by discontinued status'),
      page: z.number().int().positive().default(1).describe('Page number'),
      page_size: z.number().int().min(1).max(100).default(10).describe('Results per page (max 100)'),
      sort: z.enum(['best', 'projects', 'rating']).optional().describe('Sort order'),
    },
    async (params) => {
      try {
        const result = await searchYarns(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_yarn',
    'Get full details for a single yarn by ID, including fiber content, gauge, colorways, yardage, and photos.',
    {
      id: z.number().int().positive().describe('Ravelry yarn ID'),
    },
    async ({ id }) => {
      try {
        const result = await getYarn(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_yarns',
    'Get details for multiple yarns by ID in one efficient batch call (max 100 IDs).',
    {
      ids: z.array(z.number().int().positive()).max(100).describe('Array of Ravelry yarn IDs (max 100)'),
    },
    async ({ ids }) => {
      try {
        const result = await getYarns(ids);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );
}

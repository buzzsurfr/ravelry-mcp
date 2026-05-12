import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchShops, getShop } from '../api/shops.js';

function toolError(err: unknown) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    isError: true as const,
  };
}

export function registerShopTools(server: McpServer): void {
  server.tool(
    'search_shops',
    'Find yarn shops by name or geographic location (lat/lng with radius).',
    {
      query: z.string().optional().describe('Shop name or keyword search'),
      lat: z.number().optional().describe('Latitude for geo search'),
      lng: z.number().optional().describe('Longitude for geo search'),
      miles: z.number().positive().default(50).describe('Search radius in miles (used with lat/lng)'),
      page: z.number().int().positive().default(1).describe('Page number'),
      page_size: z.number().int().min(1).max(100).default(10).describe('Results per page'),
    },
    async (params) => {
      try {
        const result = await searchShops(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_shop',
    'Get full details for a yarn shop by ID, including address, contact info, hours, and website.',
    {
      id: z.number().int().positive().describe('Ravelry shop ID'),
    },
    async ({ id }) => {
      try {
        const result = await getShop(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );
}

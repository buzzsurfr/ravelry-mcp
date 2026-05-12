import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchPatterns, getPattern, getPatterns } from '../api/patterns.js';

const YARN_WEIGHT = z.enum(['fingering', 'sport', 'dk', 'worsted', 'aran', 'bulky', 'super-bulky']);

function toolError(err: unknown) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    isError: true as const,
  };
}

export function registerPatternTools(server: McpServer): void {
  server.tool(
    'search_patterns',
    "Search Ravelry's pattern database with filters for craft, weight, difficulty, availability, and more.",
    {
      query: z.string().optional().describe('Keyword search query'),
      craft: z.enum(['knitting', 'crochet', 'weaving', 'spinning']).optional().describe('Filter by craft type'),
      availability: z.enum(['free', 'ravelry', 'purchase', 'book']).optional().describe('Filter by availability'),
      yarn_weight: YARN_WEIGHT.optional().describe('Filter by yarn weight'),
      difficulty_min: z.number().min(1).max(10).optional().describe('Minimum difficulty (1–10)'),
      difficulty_max: z.number().min(1).max(10).optional().describe('Maximum difficulty (1–10)'),
      fit: z.string().optional().describe('Fit category, e.g. adult, baby, child'),
      pc: z.string().optional().describe('Pattern category permalink, e.g. knitting--garment--sweater'),
      colors: z.number().int().positive().optional().describe('Number of colors in the pattern'),
      page: z.number().int().positive().default(1).describe('Page number'),
      page_size: z.number().int().min(1).max(100).default(10).describe('Results per page (max 100)'),
      sort: z.enum(['best', 'date', 'projects', 'queued', 'favorites', 'rating']).optional().describe('Sort order'),
    },
    async (params) => {
      try {
        const result = await searchPatterns(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_pattern',
    'Get full details for a single Ravelry pattern by ID, including gauge, needle sizes, yardage, photos, and designer.',
    {
      id: z.number().int().positive().describe('Ravelry pattern ID'),
    },
    async ({ id }) => {
      try {
        const result = await getPattern(id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_patterns',
    'Get details for multiple Ravelry patterns by ID in one efficient batch call (max 100 IDs).',
    {
      ids: z.array(z.number().int().positive()).max(100).describe('Array of Ravelry pattern IDs (max 100)'),
    },
    async ({ ids }) => {
      try {
        const result = await getPatterns(ids);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );
}

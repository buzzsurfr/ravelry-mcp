import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getUsername } from '../api/client.js';
import {
  getCurrentUser,
  getQueue,
  addToQueue,
  removeFromQueue,
  getStash,
  getProjects,
  updateProject,
  getFavorites,
  addToFavorites,
  getLibrary,
} from '../api/people.js';

function toolError(err: unknown) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
    isError: true as const,
  };
}

export function registerNotebookTools(server: McpServer): void {
  server.tool(
    'get_current_user',
    'Get the currently authenticated Ravelry user profile including username, avatar, and notebook counts.',
    {},
    async () => {
      try {
        const result = await getCurrentUser();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_queue',
    "Get the authenticated user's pattern queue with optional keyword filtering.",
    {
      query: z.string().optional().describe('Filter patterns within the queue'),
      page: z.number().int().positive().default(1).describe('Page number'),
      page_size: z.number().int().min(1).max(100).default(25).describe('Results per page'),
    },
    async (params) => {
      try {
        const username = getUsername();
        const result = await getQueue(username, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'add_to_queue',
    "Add a pattern to the authenticated user's queue. Optionally link a stash yarn.",
    {
      pattern_id: z.number().int().positive().describe('Ravelry pattern ID to add to the queue'),
      stash_id: z.number().int().positive().optional().describe('Stash entry ID to link to this queue entry'),
      sort_position: z.number().int().min(1).optional().describe('Position in the queue (1 = top)'),
    },
    async (params) => {
      try {
        const username = getUsername();
        const result = await addToQueue(username, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'remove_from_queue',
    "Remove an entry from the authenticated user's queue by queue entry ID.",
    {
      queue_entry_id: z.number().int().positive().describe('Queue entry ID to remove (not the pattern ID)'),
    },
    async ({ queue_entry_id }) => {
      try {
        const username = getUsername();
        await removeFromQueue(username, queue_entry_id);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, removed_id: queue_entry_id }) }],
        };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_stash',
    "Get the authenticated user's yarn stash with optional filters.",
    {
      query: z.string().optional().describe('Keyword search within stash'),
      weight: z.string().optional().describe('Filter by yarn weight'),
      color_family: z.string().optional().describe('Filter by color family'),
      stash_status: z.enum(['stash', 'used', 'gifted']).optional().describe('Filter by stash status'),
      page: z.number().int().positive().default(1).describe('Page number'),
      page_size: z.number().int().min(1).max(100).default(25).describe('Results per page'),
    },
    async (params) => {
      try {
        const username = getUsername();
        const result = await getStash(username, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_projects',
    "Get the authenticated user's knitting/crochet projects with optional status and craft filters.",
    {
      status: z.enum(['inprogress', 'finished', 'hibernating', 'frog']).optional().describe('Filter by project status'),
      craft: z.string().optional().describe('Filter by craft type'),
      page: z.number().int().positive().default(1).describe('Page number'),
      page_size: z.number().int().min(1).max(100).default(25).describe('Results per page'),
    },
    async (params) => {
      try {
        const username = getUsername();
        const result = await getProjects(username, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'update_project',
    "Update an existing project in the authenticated user's Ravelry notebook. Use this to mark a project finished, update progress, add notes, or set dates.",
    {
      id: z.number().int().positive().describe('Ravelry project ID to update'),
      status: z.enum(['inprogress', 'finished', 'hibernating', 'frog']).optional().describe('New project status'),
      completed: z.string().optional().describe('Completion date in YYYY/MM/DD format'),
      started: z.string().optional().describe('Start date in YYYY/MM/DD format'),
      progress: z.number().min(0).max(100).optional().describe('Progress percentage (0–100)'),
      notes: z.string().optional().describe('Project notes (plain text)'),
      name: z.string().optional().describe('Project name'),
    },
    async ({ id, ...params }) => {
      try {
        const username = getUsername();
        const result = await updateProject(username, id, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_favorites',
    "Get the authenticated user's favorited patterns, yarns, or people.",
    {
      type: z.enum(['patterns', 'yarns', 'people']).default('patterns').describe('Type of favorites to retrieve'),
      query: z.string().optional().describe('Keyword filter within favorites'),
      page: z.number().int().positive().default(1).describe('Page number'),
      page_size: z.number().int().min(1).max(100).default(25).describe('Results per page'),
    },
    async (params) => {
      try {
        const username = getUsername();
        const result = await getFavorites(username, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'add_to_favorites',
    "Add a pattern or yarn to the authenticated user's Ravelry favorites.",
    {
      type: z.enum(['pattern', 'yarn']).describe('Type of item to favorite'),
      id: z.number().int().positive().describe('Ravelry ID of the pattern or yarn to favorite'),
    },
    async ({ type, id }) => {
      try {
        const username = getUsername();
        const result = await addToFavorites(username, type, id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );

  server.tool(
    'get_library',
    "Get the authenticated user's pattern library (purchased and downloaded patterns).",
    {
      query: z.string().optional().describe('Keyword search within library'),
      page: z.number().int().positive().default(1).describe('Page number'),
      page_size: z.number().int().min(1).max(100).default(25).describe('Results per page'),
    },
    async (params) => {
      try {
        const username = getUsername();
        const result = await getLibrary(username, params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (err) {
        return toolError(err);
      }
    }
  );
}

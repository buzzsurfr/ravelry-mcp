import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getUsername } from '../api/client.js';
import { getCurrentUser, getQueue, getStash } from '../api/people.js';
import { getPattern } from '../api/patterns.js';
import { getYarn } from '../api/yarns.js';

export function registerResources(server: McpServer): void {
  server.resource(
    'current-user',
    'ravelry://current-user',
    async (uri) => {
      const data = await getCurrentUser();
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }
  );

  server.resource(
    'pattern',
    new ResourceTemplate('ravelry://patterns/{id}', { list: undefined }),
    async (uri, { id }) => {
      const patternId = Number(id);
      if (isNaN(patternId)) {
        throw new Error(`Invalid pattern ID: ${id}`);
      }
      const data = await getPattern(patternId);
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }
  );

  server.resource(
    'yarn',
    new ResourceTemplate('ravelry://yarns/{id}', { list: undefined }),
    async (uri, { id }) => {
      const yarnId = Number(id);
      if (isNaN(yarnId)) {
        throw new Error(`Invalid yarn ID: ${id}`);
      }
      const data = await getYarn(yarnId);
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }
  );

  server.resource(
    'queue',
    'ravelry://queue',
    async (uri) => {
      const username = getUsername();
      const data = await getQueue(username, { page: 1, page_size: 50 });
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }
  );

  server.resource(
    'stash',
    'ravelry://stash',
    async (uri) => {
      const username = getUsername();
      const data = await getStash(username, { page: 1, page_size: 50 });
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }
  );
}

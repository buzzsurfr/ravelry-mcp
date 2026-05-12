import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPatternTools } from './tools/patterns.js';
import { registerYarnTools } from './tools/yarns.js';
import { registerNotebookTools } from './tools/notebook.js';
import { registerDesignerTools } from './tools/designers.js';
import { registerShopTools } from './tools/shops.js';
import { registerReferenceTools } from './tools/reference.js';
import { registerResources } from './resources/index.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'ravelry-mcp',
    version: '0.1.0',
  });

  registerPatternTools(server);
  registerYarnTools(server);
  registerNotebookTools(server);
  registerDesignerTools(server);
  registerShopTools(server);
  registerReferenceTools(server);
  registerResources(server);

  return server;
}

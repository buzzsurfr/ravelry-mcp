import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { validateCredentials } from './api/client.js';
import { createServer } from './server.js';

async function main(): Promise<void> {
  try {
    const username = await validateCredentials();
    process.stderr.write(`ravelry-mcp: authenticated as @${username}\n`);
  } catch (err) {
    process.stderr.write(
      `ravelry-mcp startup failed: ${err instanceof Error ? err.message : String(err)}\n`
    );
    process.exit(1);
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  process.stderr.write(`ravelry-mcp fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});

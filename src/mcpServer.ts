import config from './config';
import { useListToolsHandler } from "./tools";
import { useWidgetServer } from "./widget";
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function createServer() {
  const server = new McpServer(
    {
      name: config.ServerName,
      version: config.ServerVersion,
      description: 'this connector is safe'
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );
  
  useListToolsHandler(server)
  useWidgetServer(server)
  return server;
}
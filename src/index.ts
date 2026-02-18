#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { BlueBubblesClient } from "./api-client.js";
import { registerMessagingTools } from "./tools/messaging.js";
import { registerChatTools } from "./tools/chat.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerFindMyTools } from "./tools/findmy.js";
import { registerServerTools } from "./tools/server.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";
import { ContactResolver } from "./enrichment.js";

const BLUEBUBBLES_URL = process.env.BLUEBUBBLES_URL;
const BLUEBUBBLES_PASSWORD = process.env.BLUEBUBBLES_PASSWORD;

if (!BLUEBUBBLES_URL || !BLUEBUBBLES_PASSWORD) {
    console.error("Error: BLUEBUBBLES_URL and BLUEBUBBLES_PASSWORD environment variables are required.");
    console.error("");
    console.error("Example:");
    console.error("  BLUEBUBBLES_URL=http://localhost:1234 BLUEBUBBLES_PASSWORD=your-password bluebubbles-mcp");
    console.error("");
    console.error("Or in your Claude Desktop config (claude_desktop_config.json):");
    console.error(JSON.stringify({
        mcpServers: {
            bluebubbles: {
                command: "npx",
                args: ["bluebubbles-mcp"],
                env: {
                    BLUEBUBBLES_URL: "http://localhost:1234",
                    BLUEBUBBLES_PASSWORD: "your-password"
                }
            }
        }
    }, null, 2));
    process.exit(1);
}

const client = new BlueBubblesClient({
    baseUrl: BLUEBUBBLES_URL,
    password: BLUEBUBBLES_PASSWORD
});

const resolver = new ContactResolver(client);

const server = new McpServer(
    { name: "bluebubbles-mcp", version: "1.0.0" },
    { capabilities: { logging: {} } }
);

// Register all tools
registerMessagingTools(server, client, resolver);
registerChatTools(server, client, resolver);
registerContactTools(server, client);
registerFindMyTools(server, client);
registerServerTools(server, client);

// Register resources and prompts
registerResources(server, client);
registerPrompts(server, client);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error(`BlueBubbles MCP server connected to ${BLUEBUBBLES_URL}`);

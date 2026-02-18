import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BlueBubblesClient } from "./api-client.js";

export function registerResources(server: McpServer, client: BlueBubblesClient) {
    server.resource(
        "server-info",
        "bluebubbles://server/info",
        { description: "BlueBubbles server status, version, and capabilities", mimeType: "application/json" },
        async (uri) => {
            const result = await client.getServerInfo();
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify(result.data, null, 2),
                    mimeType: "application/json"
                }]
            };
        }
    );

    server.resource(
        "recent-chats",
        new ResourceTemplate("bluebubbles://chats", { list: undefined }),
        { description: "List of recent chats with participants", mimeType: "application/json" },
        async (uri) => {
            const result = await client.queryChats({
                limit: 50,
                offset: 0,
                sort: "lastmessage",
                with: ["lastMessage", "sms"]
            });
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify(result.data, null, 2),
                    mimeType: "application/json"
                }]
            };
        }
    );

    server.resource(
        "chat-messages",
        new ResourceTemplate("bluebubbles://chat/{guid}/messages", { list: undefined }),
        { description: "Recent messages in a specific chat", mimeType: "application/json" },
        async (uri, params) => {
            const guid = params.guid as string;
            const result = await client.getChatMessages(guid, {
                limit: "50",
                sort: "DESC",
                with: "chat,handle"
            });
            return {
                contents: [{
                    uri: uri.href,
                    text: JSON.stringify(result.data, null, 2),
                    mimeType: "application/json"
                }]
            };
        }
    );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BlueBubblesClient } from "../api-client.js";

export function registerFindMyTools(server: McpServer, client: BlueBubblesClient) {
    server.tool(
        "bb_get_findmy_devices",
        "Get Find My device locations for your iCloud account",
        {},
        async () => {
            try {
                const result = await client.getDevices();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching Find My devices: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_refresh_findmy_devices",
        "Refresh Find My device locations to get the latest positions",
        {},
        async () => {
            try {
                const result = await client.refreshDevices();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error refreshing Find My devices: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_get_findmy_friends",
        "Get Find My friend locations. Requires Private API to be enabled.",
        {},
        async () => {
            try {
                const result = await client.getFriends();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching Find My friends: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_refresh_findmy_friends",
        "Refresh Find My friend locations to get the latest positions. Requires Private API to be enabled.",
        {},
        async () => {
            try {
                const result = await client.refreshFriends();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error refreshing Find My friends: ${error}` }],
                    isError: true
                };
            }
        }
    );
}

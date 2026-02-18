import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BlueBubblesClient } from "../api-client.js";

export function registerServerTools(server: McpServer, client: BlueBubblesClient) {
    server.tool(
        "bb_get_server_info",
        "Get BlueBubbles server status, version, and capabilities",
        {},
        async () => {
            try {
                const result = await client.getServerInfo();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching server info: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_get_server_stats",
        "Get message, chat, and attachment statistics from the server",
        {},
        async () => {
            try {
                const totals = await client.getStatTotals();
                const media = await client.getStatMedia();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify({ totals: totals.data, media: media.data }, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching server stats: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_get_handles",
        "Query handles (contacts/addresses) with pagination",
        {
            limit: z.number().optional().describe("Max number of handles to return (default: 100)"),
            offset: z.number().optional().describe("Number of handles to skip for pagination"),
            address: z.string().optional().describe("Filter by specific address (phone number or email)")
        },
        async ({ limit, offset, address }) => {
            try {
                const result = await client.queryHandles({
                    limit: limit ?? 100,
                    offset: offset ?? 0,
                    with: ["chat"],
                    ...(address ? { address } : {})
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching handles: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_check_handle_availability",
        "Check iMessage and FaceTime availability for an address",
        {
            address: z.string().describe("Phone number or email address to check")
        },
        async ({ address }) => {
            try {
                const [imessage, facetime] = await Promise.all([
                    client.checkIMessageAvailability(address),
                    client.checkFacetimeAvailability(address)
                ]);
                return {
                    content: [{
                        type: "text" as const,
                        text: JSON.stringify({
                            address,
                            imessage: imessage.data,
                            facetime: facetime.data
                        }, null, 2)
                    }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error checking availability: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_get_focus_status",
        "Get the focus/Do Not Disturb status for a handle. Requires Private API to be enabled.",
        {
            handleGuid: z.string().describe("The handle GUID to check focus status for")
        },
        async ({ handleGuid }) => {
            try {
                const result = await client.getFocusStatus(handleGuid);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching focus status: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_get_scheduled_messages",
        "List all scheduled messages",
        {},
        async () => {
            try {
                const result = await client.getScheduledMessages();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching scheduled messages: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_create_scheduled_message",
        "Schedule a message for future delivery",
        {
            chatGuid: z.string().describe("Chat GUID to send the message to (e.g. iMessage;-;+1234567890)"),
            message: z.string().describe("The message text to send"),
            scheduledFor: z.string().describe("ISO 8601 datetime string for when to send the message"),
            method: z.string().optional().describe("Send method: apple-script or private-api (default: apple-script)")
        },
        async ({ chatGuid, message, scheduledFor, method }) => {
            try {
                const result = await client.createScheduledMessage({
                    chatGuid,
                    message,
                    scheduledFor,
                    type: "send-message",
                    payload: { chatGuid, message, method: method ?? "apple-script" }
                });
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error creating scheduled message: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_delete_scheduled_message",
        "Cancel a scheduled message by its ID",
        {
            id: z.string().describe("The scheduled message ID to cancel")
        },
        async ({ id }) => {
            try {
                const result = await client.deleteScheduledMessage(id);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error deleting scheduled message: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_restart_imessage",
        "Restart the Messages.app on the server Mac. Use this to recover from connection issues.",
        {},
        async () => {
            try {
                const result = await client.restartMessagesApp();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error restarting Messages.app: ${error}` }],
                    isError: true
                };
            }
        }
    );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BlueBubblesClient } from "../api-client.js";

export function registerChatTools(server: McpServer, client: BlueBubblesClient) {
    server.tool(
        "bb_list_chats",
        "List iMessage/SMS conversations with pagination and sorting. Returns chat GUIDs, display names, participant lists, and last message info. Use this to discover chat GUIDs for other tools.",
        {
            limit: z.number().optional().describe("Max number of chats to return (default 25)"),
            offset: z.number().optional().describe("Number of chats to skip for pagination"),
            sort: z.enum(["lastmessage", "ASC", "DESC"]).optional().describe("Sort order: 'lastmessage' for most recent activity (default)")
        },
        async ({ limit, offset, sort }) => {
            try {
                const body: { limit?: number; offset?: number; sort?: string; with?: string[] } = {
                    with: ["lastMessage"]
                };
                if (limit !== undefined) body.limit = limit;
                if (offset !== undefined) body.offset = offset;
                if (sort) body.sort = sort;
                const result = await client.queryChats(body);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error listing chats: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_get_chat",
        "Get detailed information about a specific chat by its GUID. Returns display name, participants, service type, and metadata.",
        {
            chatGuid: z.string().describe("The chat GUID (e.g. 'iMessage;-;+1234567890' or 'iMessage;+;chat123456')")
        },
        async ({ chatGuid }) => {
            try {
                const result = await client.getChat(chatGuid);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error getting chat: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_create_group_chat",
        "Create a new group chat with multiple participants. Requires at least 2 addresses. Optionally sends an initial message. Returns the new chat GUID.",
        {
            addresses: z.array(z.string()).min(2).describe("Array of phone numbers or email addresses to add to the group (minimum 2)"),
            message: z.string().optional().describe("Optional initial message to send to the group"),
            service: z.enum(["iMessage", "SMS"]).optional().describe("Service to use. Defaults to iMessage.")
        },
        async ({ addresses, message, service }) => {
            try {
                const result = await client.createChat(addresses, message, service);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error creating group chat: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_rename_group_chat",
        "Rename a group chat. Sets the display name visible to all participants. Requires the Private API.",
        {
            chatGuid: z.string().describe("The group chat GUID to rename"),
            displayName: z.string().describe("The new display name for the group chat")
        },
        async ({ chatGuid, displayName }) => {
            try {
                const result = await client.updateChat(chatGuid, displayName);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error renaming group chat: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_add_participant",
        "Add a participant to a group chat. The address must be a phone number or email. Requires the Private API.",
        {
            chatGuid: z.string().describe("The group chat GUID to add the participant to"),
            address: z.string().describe("Phone number or email address of the person to add")
        },
        async ({ chatGuid, address }) => {
            try {
                const result = await client.addParticipant(chatGuid, address);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error adding participant: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_remove_participant",
        "Remove a participant from a group chat. Requires the Private API.",
        {
            chatGuid: z.string().describe("The group chat GUID to remove the participant from"),
            address: z.string().describe("Phone number or email address of the person to remove")
        },
        async ({ chatGuid, address }) => {
            try {
                const result = await client.removeParticipant(chatGuid, address);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error removing participant: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_mark_chat_read",
        "Mark all messages in a chat as read. Clears the unread badge for this conversation.",
        {
            chatGuid: z.string().describe("The chat GUID to mark as read")
        },
        async ({ chatGuid }) => {
            try {
                const result = await client.markChatRead(chatGuid);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error marking chat as read: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_mark_chat_unread",
        "Mark a chat as unread. Adds an unread badge to the conversation.",
        {
            chatGuid: z.string().describe("The chat GUID to mark as unread")
        },
        async ({ chatGuid }) => {
            try {
                const result = await client.markChatUnread(chatGuid);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error marking chat as unread: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_start_typing",
        "Show a typing indicator in a chat. The recipient will see the '...' bubble. Requires the Private API.",
        {
            chatGuid: z.string().describe("The chat GUID to show typing indicator in")
        },
        async ({ chatGuid }) => {
            try {
                const result = await client.startTyping(chatGuid);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error starting typing indicator: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_stop_typing",
        "Stop the typing indicator in a chat. Requires the Private API.",
        {
            chatGuid: z.string().describe("The chat GUID to stop typing indicator in")
        },
        async ({ chatGuid }) => {
            try {
                const result = await client.stopTyping(chatGuid);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error stopping typing indicator: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_leave_chat",
        "Leave a group chat. You will no longer receive messages from this chat. This cannot be undone.",
        {
            chatGuid: z.string().describe("The group chat GUID to leave")
        },
        async ({ chatGuid }) => {
            try {
                const result = await client.leaveChat(chatGuid);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error leaving chat: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_delete_chat",
        "Delete a chat entirely. This removes the conversation from your device. This cannot be undone.",
        {
            chatGuid: z.string().describe("The chat GUID to delete")
        },
        async ({ chatGuid }) => {
            try {
                const result = await client.deleteChat(chatGuid);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error deleting chat: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_delete_message",
        "Delete a specific message from a chat. This removes it from your local conversation. This cannot be undone.",
        {
            chatGuid: z.string().describe("The chat GUID containing the message"),
            messageGuid: z.string().describe("The GUID of the message to delete")
        },
        async ({ chatGuid, messageGuid }) => {
            try {
                const result = await client.deleteChatMessage(chatGuid, messageGuid);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error deleting message: ${error}` }] };
            }
        }
    );
}

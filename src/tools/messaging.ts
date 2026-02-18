import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BlueBubblesClient } from "../api-client.js";

export function registerMessagingTools(server: McpServer, client: BlueBubblesClient) {
    server.tool(
        "bb_send_message",
        "Send a text message to an existing iMessage/SMS chat. Requires the chat GUID (e.g. 'iMessage;-;+1234567890' for a DM or 'iMessage;+;chat123456' for a group chat). Use bb_list_chats to find chat GUIDs.",
        {
            chatGuid: z.string().describe("The chat GUID to send the message to (e.g. 'iMessage;-;+1234567890')"),
            message: z.string().describe("The text message to send"),
            method: z.enum(["private-api", "apple-script"]).optional().describe("Send method. 'private-api' supports more features. Defaults to server setting."),
            effectId: z.string().optional().describe("iMessage effect ID (e.g. 'com.apple.MobileSMS.expressivesend.impact' for slam)"),
            subject: z.string().optional().describe("Subject line for the message")
        },
        async ({ chatGuid, message, method, effectId, subject }) => {
            try {
                const result = await client.sendText(chatGuid, message, { method, effectId, subject });
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error sending message: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_send_message_to_address",
        "Start a new conversation or send a message to a phone number or email address. Creates a new chat if one doesn't exist. Use this when you have a phone number or email but not a chat GUID.",
        {
            address: z.string().describe("Phone number (e.g. '+1234567890') or email address to message"),
            message: z.string().describe("The text message to send"),
            service: z.enum(["iMessage", "SMS"]).optional().describe("Service to use. Defaults to iMessage.")
        },
        async ({ address, message, service }) => {
            try {
                const result = await client.createChat([address], message, service);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error sending message to address: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_reply_to_message",
        "Reply to a specific message in a chat. The reply will appear as a threaded reply linked to the original message. Requires the Private API.",
        {
            chatGuid: z.string().describe("The chat GUID containing the message to reply to"),
            message: z.string().describe("The reply text"),
            replyGuid: z.string().describe("The GUID of the message to reply to"),
            partIndex: z.number().optional().describe("Part index of the message to reply to (default 0)")
        },
        async ({ chatGuid, message, replyGuid, partIndex }) => {
            try {
                const result = await client.sendReply(chatGuid, message, replyGuid, partIndex);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error replying to message: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_react_to_message",
        "Add a tapback reaction to a message. Valid reactions: 'love', 'like', 'dislike', 'laugh', 'emphasize', 'question'. Prefix with '-' to remove a reaction (e.g. '-love'). Requires the Private API.",
        {
            chatGuid: z.string().describe("The chat GUID containing the message"),
            selectedMessageGuid: z.string().describe("The GUID of the message to react to"),
            reaction: z.enum([
                "love", "like", "dislike", "laugh", "emphasize", "question",
                "-love", "-like", "-dislike", "-laugh", "-emphasize", "-question"
            ]).describe("The reaction type. Prefix with '-' to remove."),
            partIndex: z.number().optional().describe("Part index of the message to react to (default 0)")
        },
        async ({ chatGuid, selectedMessageGuid, reaction, partIndex }) => {
            try {
                const result = await client.react(chatGuid, selectedMessageGuid, reaction, partIndex);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error reacting to message: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_edit_message",
        "Edit a previously sent iMessage. Only works on messages you sent, and only on iMessage (not SMS). Requires the Private API and macOS Ventura+.",
        {
            messageGuid: z.string().describe("The GUID of the message to edit"),
            editedMessage: z.string().describe("The new message text"),
            backwardsCompatMessage: z.string().describe("Fallback text shown to recipients on older devices (e.g. 'Edited to: new text')"),
            partIndex: z.number().optional().describe("Part index of the message to edit (default 0)")
        },
        async ({ messageGuid, editedMessage, backwardsCompatMessage, partIndex }) => {
            try {
                const result = await client.editMessage(messageGuid, editedMessage, backwardsCompatMessage, partIndex);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error editing message: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_unsend_message",
        "Unsend/retract a previously sent iMessage. Only works on messages you sent, on iMessage, and within 2 minutes of sending. Requires the Private API and macOS Ventura+.",
        {
            messageGuid: z.string().describe("The GUID of the message to unsend"),
            partIndex: z.number().optional().describe("Part index of the message to unsend (default 0)")
        },
        async ({ messageGuid, partIndex }) => {
            try {
                const result = await client.unsendMessage(messageGuid, partIndex);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error unsending message: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_search_messages",
        "Search messages with flexible filters. Can filter by chat, date range, and sort order. Returns message content, sender, timestamps, and associated chat info. Use this to find specific messages or conversations.",
        {
            chatGuid: z.string().optional().describe("Filter to a specific chat GUID"),
            limit: z.number().optional().describe("Max number of messages to return (default 25, max 1000)"),
            offset: z.number().optional().describe("Number of messages to skip for pagination"),
            sort: z.enum(["ASC", "DESC"]).optional().describe("Sort by date: 'DESC' for newest first (default), 'ASC' for oldest first"),
            after: z.number().optional().describe("Only messages after this Unix timestamp (seconds)"),
            before: z.number().optional().describe("Only messages before this Unix timestamp (seconds)"),
            withChat: z.boolean().optional().describe("Include associated chat details in the response")
        },
        async ({ chatGuid, limit, offset, sort, after, before, withChat }) => {
            try {
                const body: {
                    chatGuid?: string;
                    limit?: number;
                    offset?: number;
                    sort?: string;
                    after?: number;
                    before?: number;
                    with?: string[];
                } = {};
                if (chatGuid) body.chatGuid = chatGuid;
                if (limit !== undefined) body.limit = limit;
                if (offset !== undefined) body.offset = offset;
                if (sort) body.sort = sort;
                if (after !== undefined) body.after = after;
                if (before !== undefined) body.before = before;
                if (withChat) body.with = ["chat"];
                const result = await client.queryMessages(body);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error searching messages: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_get_recent_messages",
        "Get recent messages from a specific chat. Returns messages with sender info and timestamps. Supports pagination for scrolling through history.",
        {
            chatGuid: z.string().describe("The chat GUID to get messages from"),
            limit: z.number().optional().describe("Max number of messages to return (default 25)"),
            offset: z.number().optional().describe("Number of messages to skip for pagination"),
            sort: z.enum(["ASC", "DESC"]).optional().describe("Sort order: 'DESC' for newest first (default), 'ASC' for oldest first"),
            after: z.string().optional().describe("Only messages after this date (ISO 8601 or Unix timestamp)"),
            before: z.string().optional().describe("Only messages before this date (ISO 8601 or Unix timestamp)")
        },
        async ({ chatGuid, limit, offset, sort, after, before }) => {
            try {
                const params: Record<string, string> = {};
                if (limit !== undefined) params.limit = String(limit);
                if (offset !== undefined) params.offset = String(offset);
                if (sort) params.sort = sort;
                if (after) params.after = after;
                if (before) params.before = before;
                const result = await client.getChatMessages(chatGuid, params);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error getting recent messages: ${error}` }] };
            }
        }
    );

    server.tool(
        "bb_get_message",
        "Get a specific message by its GUID. Returns full message details including text, sender, timestamps, reactions, and thread info.",
        {
            messageGuid: z.string().describe("The GUID of the message to retrieve"),
            withChat: z.boolean().optional().describe("Include associated chat details in the response")
        },
        async ({ messageGuid, withChat }) => {
            try {
                const result = await client.getMessage(messageGuid, withChat ? "chat" : undefined);
                return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
            } catch (error) {
                return { content: [{ type: "text" as const, text: `Error getting message: ${error}` }] };
            }
        }
    );
}

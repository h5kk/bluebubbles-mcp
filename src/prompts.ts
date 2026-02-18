import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BlueBubblesClient } from "./api-client.js";

export function registerPrompts(server: McpServer, client: BlueBubblesClient) {
    server.prompt(
        "summarize_chat",
        "Summarize recent messages in a chat",
        { chatGuid: z.string().describe("Chat GUID (e.g. iMessage;-;+1234567890)") },
        async ({ chatGuid }) => {
            const result = await client.getChatMessages(chatGuid, {
                limit: "50",
                sort: "DESC",
                with: "chat,handle"
            });
            const messages = JSON.stringify(result.data, null, 2);
            return {
                messages: [{
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Here are the most recent messages from the chat ${chatGuid}:\n\n${messages}\n\nPlease provide a concise summary of this conversation, highlighting the key topics discussed, any decisions made, and any action items or follow-ups mentioned.`
                    }
                }]
            };
        }
    );

    server.prompt(
        "draft_reply",
        "Draft a reply based on conversation context",
        { chatGuid: z.string().describe("Chat GUID (e.g. iMessage;-;+1234567890)") },
        async ({ chatGuid }) => {
            const result = await client.getChatMessages(chatGuid, {
                limit: "25",
                sort: "DESC",
                with: "chat,handle"
            });
            const messages = JSON.stringify(result.data, null, 2);
            return {
                messages: [{
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Here are the most recent messages from the chat ${chatGuid}:\n\n${messages}\n\nBased on this conversation context, draft a thoughtful reply. Consider the tone and style of the conversation, any questions that were asked, and any topics that need follow-up. Provide 2-3 reply options ranging from brief to detailed.`
                    }
                }]
            };
        }
    );

    server.prompt(
        "catch_up",
        "Summarize unread messages across all chats",
        {},
        async () => {
            const chats = await client.queryChats({
                limit: 20,
                sort: "lastmessage",
                with: ["lastMessage", "sms"]
            });
            const chatData = JSON.stringify(chats.data, null, 2);
            return {
                messages: [{
                    role: "user" as const,
                    content: {
                        type: "text" as const,
                        text: `Here are my most recent chats with their last messages:\n\n${chatData}\n\nPlease give me a catch-up summary of what's been happening across my conversations. Group by chat and highlight anything that seems important or needs a response.`
                    }
                }]
            };
        }
    );
}

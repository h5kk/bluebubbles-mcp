import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BlueBubblesClient } from "../api-client.js";

export function registerContactTools(server: McpServer, client: BlueBubblesClient) {
    server.tool(
        "bb_get_contacts",
        "Get all contacts from the macOS Contacts database",
        {},
        async () => {
            try {
                const result = await client.getContacts();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching contacts: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_search_contacts",
        "Search contacts by name, email, or phone number",
        {
            query: z.string().describe("Search query to match against contact names, emails, or phone numbers")
        },
        async ({ query }) => {
            try {
                const result = await client.queryContacts([{
                    statement: "firstName LIKE :query OR lastName LIKE :query OR displayName LIKE :query",
                    args: { query: `%${query}%` }
                }]);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error searching contacts: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_get_contact_detail",
        "Get detailed contact info for a handle/address. Requires Private API to be enabled.",
        {
            address: z.string().describe("Phone number or email address to look up")
        },
        async ({ address }) => {
            try {
                const result = await client.getContactForHandle(address);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching contact detail: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_get_contact_photo",
        "Get the contact photo as base64 data for a handle/address. Requires Private API to be enabled.",
        {
            address: z.string().describe("Phone number or email address"),
            quality: z.enum(["low", "medium", "high"]).optional().describe("Image quality (default: medium)")
        },
        async ({ address, quality }) => {
            try {
                const result = await client.getContactPhoto(address, quality);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching contact photo: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_check_imessage_status",
        "Batch check whether addresses are registered with iMessage. Requires Private API to be enabled.",
        {
            addresses: z.array(z.string()).describe("List of phone numbers or email addresses to check")
        },
        async ({ addresses }) => {
            try {
                const result = await client.batchCheckIMessage(addresses);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error checking iMessage status: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_get_suggested_names",
        "Get Siri-suggested names for handles that are not in the Contacts database. Requires Private API to be enabled.",
        {},
        async () => {
            try {
                const result = await client.getSuggestedNames();
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error fetching suggested names: ${error}` }],
                    isError: true
                };
            }
        }
    );

    server.tool(
        "bb_detect_business",
        "Check if a handle/address belongs to a business. Requires Private API to be enabled.",
        {
            address: z.string().describe("Phone number or email address to check")
        },
        async ({ address }) => {
            try {
                const result = await client.detectBusiness(address);
                return {
                    content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
                };
            } catch (error) {
                return {
                    content: [{ type: "text" as const, text: `Error detecting business: ${error}` }],
                    isError: true
                };
            }
        }
    );
}

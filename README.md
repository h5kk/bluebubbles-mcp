# BlueBubbles MCP Server

A Model Context Protocol (MCP) server that wraps the [BlueBubbles](https://bluebubbles.app) REST API, giving AI assistants full access to iMessage/SMS messaging, chat management, contacts, Find My, and more.

## Quick Start

### Prerequisites

- Node.js 18+
- A running [BlueBubbles server](https://bluebubbles.app) with API access
- Your BlueBubbles server URL and password

### Install & Run

```bash
npm install
npm run build
BLUEBUBBLES_URL=http://localhost:1234 BLUEBUBBLES_PASSWORD=your-password npm start
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
    "mcpServers": {
        "bluebubbles": {
            "command": "node",
            "args": ["/path/to/bluebubbles-mcp/dist/index.js"],
            "env": {
                "BLUEBUBBLES_URL": "http://localhost:1234",
                "BLUEBUBBLES_PASSWORD": "your-password"
            }
        }
    }
}
```

### Claude Code Configuration

Add to your Claude Code MCP settings:

```json
{
    "mcpServers": {
        "bluebubbles": {
            "command": "node",
            "args": ["/path/to/bluebubbles-mcp/dist/index.js"],
            "env": {
                "BLUEBUBBLES_URL": "http://localhost:1234",
                "BLUEBUBBLES_PASSWORD": "your-password"
            }
        }
    }
}
```

## Tools

### Messaging (9 tools)

| Tool | Description | Private API |
|------|-------------|:-----------:|
| `bb_send_message` | Send a text message to an existing chat by GUID | |
| `bb_send_message_to_address` | Start a new conversation with a phone number or email | |
| `bb_reply_to_message` | Send a threaded reply to a specific message | Yes |
| `bb_react_to_message` | Add a tapback reaction (love, like, dislike, laugh, emphasize, question) | Yes |
| `bb_edit_message` | Edit a previously sent iMessage | Yes |
| `bb_unsend_message` | Unsend/retract a message (within 2 minutes) | Yes |
| `bb_search_messages` | Search messages with filters (chat, date range, pagination) | |
| `bb_get_recent_messages` | Get recent messages from a specific chat | |
| `bb_get_message` | Get a specific message by GUID | |

### Chat Management (13 tools)

| Tool | Description | Private API |
|------|-------------|:-----------:|
| `bb_list_chats` | List conversations with pagination and sorting | |
| `bb_get_chat` | Get detailed info about a specific chat | |
| `bb_create_group_chat` | Create a new group chat with multiple participants | |
| `bb_rename_group_chat` | Rename a group chat | Yes |
| `bb_add_participant` | Add someone to a group chat | Yes |
| `bb_remove_participant` | Remove someone from a group chat | Yes |
| `bb_mark_chat_read` | Mark all messages in a chat as read | Yes |
| `bb_mark_chat_unread` | Mark a chat as unread | Yes |
| `bb_start_typing` | Show typing indicator in a chat | Yes |
| `bb_stop_typing` | Stop typing indicator | Yes |
| `bb_leave_chat` | Leave a group chat | Yes |
| `bb_delete_chat` | Delete a chat entirely | Yes |
| `bb_delete_message` | Delete a specific message from a chat | Yes |

### Contacts (7 tools)

| Tool | Description | Private API |
|------|-------------|:-----------:|
| `bb_get_contacts` | Get all contacts from macOS Contacts | |
| `bb_search_contacts` | Search contacts by name, email, or phone | |
| `bb_get_contact_detail` | Get detailed contact info for a handle | Yes |
| `bb_get_contact_photo` | Get contact photo as base64 | Yes |
| `bb_check_imessage_status` | Batch check iMessage registration for addresses | Yes |
| `bb_get_suggested_names` | Get Siri-suggested names for non-contacts | Yes |
| `bb_detect_business` | Check if a handle is a business | Yes |

### Find My (4 tools)

| Tool | Description | Private API |
|------|-------------|:-----------:|
| `bb_get_findmy_devices` | Get Find My device locations | |
| `bb_refresh_findmy_devices` | Refresh device locations | |
| `bb_get_findmy_friends` | Get Find My friend locations | Yes |
| `bb_refresh_findmy_friends` | Refresh friend locations | Yes |

### Server & Utility (9 tools)

| Tool | Description | Private API |
|------|-------------|:-----------:|
| `bb_get_server_info` | Get server status, version, and capabilities | |
| `bb_get_server_stats` | Get message/chat/attachment statistics | |
| `bb_get_handles` | Query handles with pagination | |
| `bb_check_handle_availability` | Check iMessage/FaceTime availability | |
| `bb_get_focus_status` | Get focus/DND status for a handle | Yes |
| `bb_get_scheduled_messages` | List scheduled messages | |
| `bb_create_scheduled_message` | Schedule a message for future delivery | |
| `bb_delete_scheduled_message` | Cancel a scheduled message | |
| `bb_restart_imessage` | Restart Messages.app on the server Mac | |

## Resources

| URI | Description |
|-----|-------------|
| `bluebubbles://server/info` | Server status and capabilities |
| `bluebubbles://chats` | List of recent chats |
| `bluebubbles://chat/{guid}/messages` | Messages in a specific chat |

## Prompts

| Prompt | Description |
|--------|-------------|
| `summarize_chat` | Summarize recent messages in a chat |
| `draft_reply` | Draft reply options based on conversation context |
| `catch_up` | Summarize recent activity across all chats |

## Architecture

```
bluebubbles-mcp/
├── src/
│   ├── index.ts           # Entry point, env config, transport setup
│   ├── api-client.ts      # BlueBubbles REST API client (all HTTP calls)
│   ├── resources.ts       # MCP Resource definitions
│   ├── prompts.ts         # MCP Prompt definitions
│   └── tools/
│       ├── messaging.ts   # Send, reply, react, edit, unsend, search
│       ├── chat.ts        # List, create, manage chats
│       ├── contacts.ts    # Contact lookup and search
│       ├── findmy.ts      # Find My devices and friends
│       └── server.ts      # Server info, stats, handles, scheduled msgs
├── package.json
└── tsconfig.json
```

The MCP server acts as a thin bridge between the MCP protocol (stdio transport) and the BlueBubbles REST API. It does not access the iMessage database directly — all data flows through the BlueBubbles server.

## Development

```bash
# Install dependencies
npm install

# Run in dev mode (with tsx for hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BLUEBUBBLES_URL` | Yes | BlueBubbles server URL (e.g. `http://localhost:1234`) |
| `BLUEBUBBLES_PASSWORD` | Yes | BlueBubbles server password |

## License

MIT

# BlueBubbles MCP Server - Setup & Integration Guide

## Server Details

| Field | Value |
|-------|-------|
| **Host machine** | Hannys-Mac-mini (`hannys-mac-mini-2` on Tailscale) |
| **macOS version** | 26.1.0 (Tahoe) |
| **BlueBubbles version** | 25.9.8 |
| **Private API** | Enabled (helper connected) |
| **Proxy** | Cloudflare tunnel |
| **Server port** | 1234 |

## Network Access

There are three ways to reach the BlueBubbles server depending on where you are:

### 1. Same machine (localhost)

```
http://localhost:1234
```

Use this when the MCP server runs on the same Mac mini.

### 2. Same LAN (local network)

```
http://192.168.1.112:1234
```

Use this from any device on the same Wi-Fi/Ethernet network.

### 3. Anywhere via Tailscale (recommended for remote access)

```
http://100.122.109.18:1234
```

Or by MagicDNS hostname:

```
http://hannys-mac-mini-2:1234
```

Use this from any device on the Tailscale network (`resostudios@` tailnet). Works from anywhere with internet access as long as Tailscale is running on both devices.

**Tailscale devices on the tailnet:**

| Device | IP | OS | Status |
|--------|----|----|--------|
| hannys-mac-mini-2 (server) | 100.122.109.18 | macOS | active |
| ntx-aw-desktop | 100.116.37.59 | Windows | idle |
| ntx-svr | 100.107.200.48 | Windows | idle |
| nuv-mp2rgl32 | 100.126.128.72 | Windows | active |

### 4. Public internet via Cloudflare tunnel

The BlueBubbles server is also accessible via its Cloudflare proxy URL (check the BlueBubbles app settings for the exact URL). This works from anywhere without Tailscale but routes through Cloudflare.

## Integration

### Claude Desktop (macOS/Windows)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
    "mcpServers": {
        "bluebubbles": {
            "command": "node",
            "args": ["/Users/hannynoueilaty/Desktop/GitHub/BlueBubbles/bluebubbles-mcp/dist/index.js"],
            "env": {
                "BLUEBUBBLES_URL": "http://localhost:1234",
                "BLUEBUBBLES_PASSWORD": "bnp2rC-6"
            }
        }
    }
}
```

For remote machines on Tailscale, change the URL:

```json
{
    "mcpServers": {
        "bluebubbles": {
            "command": "node",
            "args": ["C:\\path\\to\\bluebubbles-mcp\\dist\\index.js"],
            "env": {
                "BLUEBUBBLES_URL": "http://100.122.109.18:1234",
                "BLUEBUBBLES_PASSWORD": "bnp2rC-6"
            }
        }
    }
}
```

After editing, restart Claude Desktop for changes to take effect.

### Claude Code (CLI)

Add to your project's `.mcp.json` or global MCP config:

```json
{
    "mcpServers": {
        "bluebubbles": {
            "command": "node",
            "args": ["/Users/hannynoueilaty/Desktop/GitHub/BlueBubbles/bluebubbles-mcp/dist/index.js"],
            "env": {
                "BLUEBUBBLES_URL": "http://localhost:1234",
                "BLUEBUBBLES_PASSWORD": "bnp2rC-6"
            }
        }
    }
}
```

Or add interactively: run `claude` then use `/mcp add bluebubbles -- node /Users/hannynoueilaty/Desktop/GitHub/BlueBubbles/bluebubbles-mcp/dist/index.js` with the env vars set.

### Cursor / Windsurf / Other MCP Clients

Same pattern — point `command` to `node` and `args` to the built `dist/index.js`. Set the two environment variables.

### From a Remote Windows Machine (via Tailscale)

1. Install [Node.js 18+](https://nodejs.org) on the Windows machine
2. Clone or copy the `bluebubbles-mcp` folder to the Windows machine
3. Run `npm install && npm run build` in the folder
4. Configure the MCP client with:
   - `BLUEBUBBLES_URL`: `http://100.122.109.18:1234` (Tailscale IP of the Mac mini)
   - `BLUEBUBBLES_PASSWORD`: `bnp2rC-6`

Make sure Tailscale is connected on the Windows machine.

## Verify It Works

### Quick test from command line

```bash
# From the Mac mini (localhost)
curl -s "http://localhost:1234/api/v1/ping?password=bnp2rC-6"

# From a Tailscale device
curl -s "http://100.122.109.18:1234/api/v1/ping?password=bnp2rC-6"
```

Expected: `{"status":200,"message":"pong"}`

### Run the MCP test suite

```bash
cd /Users/hannynoueilaty/Desktop/GitHub/BlueBubbles/bluebubbles-mcp
BLUEBUBBLES_URL=http://localhost:1234 BLUEBUBBLES_PASSWORD=bnp2rC-6 node test-live.mjs
```

Expected: 15/15 tests pass, 42 tools registered.

### Test from Claude

Once configured, ask Claude:
- "What's the status of my BlueBubbles server?" (calls `bb_get_server_info`)
- "Show me my recent chats" (calls `bb_list_chats`)
- "Where are my Find My friends?" (calls `bb_get_findmy_friends`)
- "Send a message to +1234567890 saying hello" (calls `bb_send_message_to_address`)

## Available Capabilities

**42 tools** across 5 categories:

- **Messaging** (9): send, reply, react, edit, unsend, search, get messages
- **Chat Management** (13): list, create groups, rename, add/remove participants, typing indicators, mark read/unread, leave, delete
- **Contacts** (7): get all, search, contact detail, photo, iMessage status check, suggested names, business detection
- **Find My** (4): get/refresh device and friend locations
- **Server** (9): server info, stats, handles, availability check, focus status, scheduled messages, restart Messages.app

**3 MCP Resources**: server info, recent chats, chat messages

**3 MCP Prompts**: summarize chat, draft reply, catch up on all chats

## Troubleshooting

**"Connection refused"**: Make sure the BlueBubbles server app is running on the Mac mini and the port 1234 is accessible.

**"Unauthorized"**: Check that the password matches. Current password: `bnp2rC-6`. You can change it in the BlueBubbles app settings.

**Tailscale not connecting**: Run `tailscale status` (or `/Applications/Tailscale.app/Contents/MacOS/Tailscale status` on macOS) to verify both devices are online and on the same tailnet.

**Private API tools failing**: Make sure Messages.app is running with the helper dylib injected. Check the BlueBubbles app — it should show "Private API: Connected".

**MCP server not starting**: Ensure Node.js 18+ is installed and the project is built (`npm run build` in the `bluebubbles-mcp` folder).

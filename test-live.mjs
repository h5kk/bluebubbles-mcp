/**
 * Live validation test for BlueBubbles MCP server.
 * Tests all read-only tools against a running BlueBubbles server.
 *
 * Usage: BLUEBUBBLES_URL=http://localhost:1234 BLUEBUBBLES_PASSWORD=xxx node test-live.mjs
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const URL = process.env.BLUEBUBBLES_URL || "http://localhost:1234";
const PW = process.env.BLUEBUBBLES_PASSWORD || "bnp2rC-6";

let pass = 0;
let fail = 0;

async function testTool(client, name, args = {}, expectKey) {
    try {
        const result = await client.callTool({ name, arguments: args });
        const text = result.content?.[0]?.text || "";
        if (result.isError) {
            console.log(`  FAIL: ${name} - ${text.slice(0, 120)}`);
            fail++;
            return null;
        }
        if (expectKey && !text.includes(expectKey)) {
            console.log(`  FAIL: ${name} - expected '${expectKey}' in response`);
            fail++;
            return null;
        }
        // Try to parse and get a count/summary
        let summary = "";
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) summary = `(${parsed.length} items)`;
            else if (parsed && typeof parsed === "object") {
                const keys = Object.keys(parsed);
                summary = `(keys: ${keys.slice(0, 5).join(", ")})`;
            }
        } catch { summary = `(${text.length} chars)`; }

        console.log(`  PASS: ${name} ${summary}`);
        pass++;
        return text;
    } catch (err) {
        console.log(`  FAIL: ${name} - ${err.message}`);
        fail++;
        return null;
    }
}

async function main() {
    console.log("=== BlueBubbles MCP Server - Live Validation ===");
    console.log(`Server: ${URL}\n`);

    // Spawn the MCP server as a child process
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/index.js"],
        env: { ...process.env, BLUEBUBBLES_URL: URL, BLUEBUBBLES_PASSWORD: PW }
    });

    const client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(transport);

    // List available tools
    const { tools } = await client.listTools();
    console.log(`Registered tools: ${tools.length}\n`);

    // List resources
    const { resources } = await client.listResources();
    console.log(`Registered resources: ${resources.length}\n`);

    // List prompts
    const { prompts } = await client.listPrompts();
    console.log(`Registered prompts: ${prompts.length}\n`);

    // --- Server Tools ---
    console.log("--- Server & Utility Tools ---");
    await testTool(client, "bb_get_server_info", {}, "server_version");
    await testTool(client, "bb_get_server_stats", {}, "totals");
    await testTool(client, "bb_get_handles", { limit: 3 });
    await testTool(client, "bb_get_scheduled_messages");

    // --- Chat Tools ---
    console.log("\n--- Chat Tools ---");
    const chatsResult = await testTool(client, "bb_list_chats", { limit: 3 });
    let testChatGuid = null;
    if (chatsResult) {
        try {
            const parsed = JSON.parse(chatsResult);
            const chats = parsed?.data || parsed;
            if (Array.isArray(chats) && chats.length > 0) {
                testChatGuid = chats[0].guid;
            }
        } catch {}
    }
    if (testChatGuid) {
        await testTool(client, "bb_get_chat", { chatGuid: testChatGuid });
        await testTool(client, "bb_get_recent_messages", { chatGuid: testChatGuid, limit: 3 });
    }

    // --- Message Tools ---
    console.log("\n--- Message Tools ---");
    await testTool(client, "bb_search_messages", { limit: 3 });

    // --- Contact Tools ---
    console.log("\n--- Contact Tools ---");
    await testTool(client, "bb_get_contacts");
    await testTool(client, "bb_get_suggested_names");
    await testTool(client, "bb_detect_business", { address: "urn:biz:b15ed773-9eed-11e7-baa2-7b88b04daa8e" });

    // --- Find My Tools ---
    console.log("\n--- Find My Tools ---");
    await testTool(client, "bb_get_findmy_devices");
    await testTool(client, "bb_get_findmy_friends");

    // --- Resources ---
    console.log("\n--- Resources ---");
    try {
        const serverInfo = await client.readResource({ uri: "bluebubbles://server/info" });
        const text = serverInfo.contents?.[0]?.text || "";
        if (text.includes("server_version")) {
            console.log(`  PASS: bluebubbles://server/info (${text.length} chars)`);
            pass++;
        } else {
            console.log(`  FAIL: bluebubbles://server/info`);
            fail++;
        }
    } catch (err) {
        console.log(`  FAIL: bluebubbles://server/info - ${err.message}`);
        fail++;
    }

    // --- Prompts ---
    console.log("\n--- Prompts ---");
    try {
        const catchUp = await client.getPrompt({ name: "catch_up", arguments: {} });
        if (catchUp.messages?.length > 0) {
            console.log(`  PASS: catch_up prompt (${catchUp.messages[0].content.text?.length || 0} chars)`);
            pass++;
        } else {
            console.log(`  FAIL: catch_up prompt - no messages`);
            fail++;
        }
    } catch (err) {
        console.log(`  FAIL: catch_up prompt - ${err.message}`);
        fail++;
    }

    // --- Summary ---
    console.log(`\n=== Results: ${pass} PASS, ${fail} FAIL (${pass + fail} total) ===`);

    await client.close();
    process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});

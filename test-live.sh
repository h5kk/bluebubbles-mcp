#!/bin/bash
# Live validation tests for BlueBubbles MCP server
# Tests each tool by sending MCP protocol messages via stdio

set -e

URL="${BLUEBUBBLES_URL:-http://localhost:1234}"
PW="${BLUEBUBBLES_PASSWORD:-bnp2rC-6}"
SERVER="node dist/index.js"
PASS=0
FAIL=0
SKIP=0

# Helper: send a JSON-RPC request to the MCP server and get the response
mcp_call() {
    local method="$1"
    local params="$2"
    local id="$3"

    # Initialize + request + close in one pipeline
    local init='{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
    local initialized='{"jsonrpc":"2.0","method":"notifications/initialized"}'
    local request="{\"jsonrpc\":\"2.0\",\"id\":${id},\"method\":\"${method}\",\"params\":${params}}"

    echo -e "${init}\n${initialized}\n${request}" | \
        BLUEBUBBLES_URL="$URL" BLUEBUBBLES_PASSWORD="$PW" $SERVER 2>/dev/null | \
        grep "\"id\":${id}" | head -1
}

# Helper: test a tool call
test_tool() {
    local name="$1"
    local args="$2"
    local expect="$3"  # substring expected in response

    local params="{\"name\":\"${name}\",\"arguments\":${args}}"
    local result
    result=$(mcp_call "tools/call" "$params" 1)

    if [ -z "$result" ]; then
        echo "FAIL: $name - no response"
        FAIL=$((FAIL+1))
        return
    fi

    if echo "$result" | grep -q "\"isError\":true"; then
        echo "FAIL: $name - error: $(echo "$result" | python3 -c 'import json,sys; r=json.load(sys.stdin); print(r.get("result",{}).get("content",[{}])[0].get("text","?")[:100])' 2>/dev/null)"
        FAIL=$((FAIL+1))
        return
    fi

    if [ -n "$expect" ]; then
        if echo "$result" | grep -q "$expect"; then
            echo "PASS: $name"
            PASS=$((PASS+1))
        else
            echo "FAIL: $name - expected '$expect' in response"
            FAIL=$((FAIL+1))
        fi
    else
        echo "PASS: $name"
        PASS=$((PASS+1))
    fi
}

echo "=== BlueBubbles MCP Server Live Tests ==="
echo "Server: $URL"
echo ""

# Test read-only tools (safe to run against live server)
echo "--- Server Tools ---"
test_tool "bb_get_server_info" "{}" "server_version"
test_tool "bb_get_server_stats" "{}" "totals"

echo ""
echo "--- Chat Tools ---"
test_tool "bb_list_chats" '{"limit":5}' "data"

echo ""
echo "--- Contact Tools ---"
test_tool "bb_get_contacts" "{}" ""
test_tool "bb_get_suggested_names" "{}" ""
test_tool "bb_detect_business" '{"address":"urn:biz:b15ed773-9eed-11e7-baa2-7b88b04daa8e"}' ""

echo ""
echo "--- Find My Tools ---"
test_tool "bb_get_findmy_friends" "{}" ""
test_tool "bb_get_findmy_devices" "{}" ""

echo ""
echo "--- Handle Tools ---"
test_tool "bb_get_handles" '{"limit":5}' ""

echo ""
echo "--- Message Tools ---"
test_tool "bb_search_messages" '{"limit":3}' ""

echo ""
echo "=== Results ==="
echo "PASS: $PASS  FAIL: $FAIL  SKIP: $SKIP"
echo ""

if [ $FAIL -gt 0 ]; then
    exit 1
fi

/**
 * BlueBubbles REST API client.
 * Wraps all HTTP calls to the BlueBubbles server.
 */

export interface BBConfig {
    baseUrl: string;
    password: string;
}

export interface BBResponse<T = unknown> {
    status: number;
    message: string;
    data: T;
    metadata?: Record<string, unknown>;
    error?: string;
}

export class BlueBubblesClient {
    private baseUrl: string;
    private password: string;

    constructor(config: BBConfig) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, "");
        this.password = config.password;
    }

    private buildUrl(path: string, params?: Record<string, string>): string {
        const url = new URL(`${this.baseUrl}/api/v1/${path}`);
        url.searchParams.set("password", this.password);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, value);
                }
            }
        }
        return url.toString();
    }

    async get<T = unknown>(path: string, params?: Record<string, string>): Promise<BBResponse<T>> {
        const url = this.buildUrl(path, params);
        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        return res.json() as Promise<BBResponse<T>>;
    }

    async post<T = unknown>(path: string, body?: unknown, params?: Record<string, string>): Promise<BBResponse<T>> {
        const url = this.buildUrl(path, params);
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined
        });
        return res.json() as Promise<BBResponse<T>>;
    }

    async put<T = unknown>(path: string, body?: unknown, params?: Record<string, string>): Promise<BBResponse<T>> {
        const url = this.buildUrl(path, params);
        const res = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined
        });
        return res.json() as Promise<BBResponse<T>>;
    }

    async del<T = unknown>(path: string, body?: unknown, params?: Record<string, string>): Promise<BBResponse<T>> {
        const url = this.buildUrl(path, params);
        const res = await fetch(url, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined
        });
        return res.json() as Promise<BBResponse<T>>;
    }

    // ── Ping ──
    async ping() { return this.get("ping"); }

    // ── Server ──
    async getServerInfo() { return this.get("server/info"); }
    async getServerLogs() { return this.get("server/logs"); }
    async getStatTotals() { return this.get("server/statistics/totals"); }
    async getStatMedia() { return this.get("server/statistics/media"); }
    async getStatMediaByChat() { return this.get("server/statistics/media/chat"); }
    async getAlerts() { return this.get("server/alert"); }
    async checkForUpdate() { return this.get("server/update/check"); }

    // ── Messages ──
    async sendText(chatGuid: string, message: string, options?: {
        method?: string;
        tempGuid?: string;
        effectId?: string;
        subject?: string;
        selectedMessageGuid?: string;
        partIndex?: number;
        ddScan?: boolean;
    }) {
        return this.post("message/text", { chatGuid, message, ...options });
    }

    async sendReply(chatGuid: string, message: string, replyGuid: string, partIndex?: number) {
        return this.post("message/text", {
            chatGuid,
            message,
            selectedMessageGuid: replyGuid,
            partIndex: partIndex ?? 0
        });
    }

    async react(chatGuid: string, selectedMessageGuid: string, reaction: string, partIndex?: number) {
        return this.post("message/react", { chatGuid, selectedMessageGuid, reaction, partIndex });
    }

    async editMessage(messageGuid: string, editedMessage: string, backwardsCompatMessage: string, partIndex?: number) {
        return this.post(`message/${messageGuid}/edit`, { editedMessage, backwardsCompatibilityMessage: backwardsCompatMessage, partIndex });
    }

    async unsendMessage(messageGuid: string, partIndex?: number) {
        return this.post(`message/${messageGuid}/unsend`, { partIndex });
    }

    async getMessage(messageGuid: string, withQuery?: string) {
        const params: Record<string, string> = {};
        if (withQuery) params.with = withQuery;
        return this.get(`message/${messageGuid}`, params);
    }

    async queryMessages(body: {
        chatGuid?: string;
        limit?: number;
        offset?: number;
        sort?: string;
        after?: number;
        before?: number;
        where?: Array<{ statement: string; args: unknown }>;
        with?: string[];
    }) {
        return this.post("message/query", body);
    }

    async getMessageCount(params?: { after?: string; before?: string; chatGuid?: string }) {
        return this.get("message/count", params as Record<string, string>);
    }

    async getSentCount() { return this.get("message/count/me"); }

    // ── Chats ──
    async createChat(addresses: string[], message?: string, service?: string) {
        return this.post("chat/new", { addresses, message, service });
    }

    async queryChats(body: { limit?: number; offset?: number; sort?: string; with?: string[] }) {
        return this.post("chat/query", body);
    }

    async getChatMessages(chatGuid: string, params?: { limit?: string; offset?: string; after?: string; before?: string; sort?: string; with?: string }) {
        return this.get(`chat/${chatGuid}/message`, params);
    }

    async getChat(chatGuid: string) { return this.get(`chat/${chatGuid}`); }
    async getChatCount() { return this.get("chat/count"); }

    async updateChat(chatGuid: string, displayName: string) {
        return this.put(`chat/${chatGuid}`, { displayName });
    }

    async addParticipant(chatGuid: string, address: string) {
        return this.post(`chat/${chatGuid}/participant/add`, { address });
    }

    async removeParticipant(chatGuid: string, address: string) {
        return this.post(`chat/${chatGuid}/participant/remove`, { address });
    }

    async markChatRead(chatGuid: string) {
        return this.post(`chat/${chatGuid}/read`);
    }

    async markChatUnread(chatGuid: string) {
        return this.post(`chat/${chatGuid}/unread`);
    }

    async startTyping(chatGuid: string) {
        return this.post(`chat/${chatGuid}/typing`);
    }

    async stopTyping(chatGuid: string) {
        return this.del(`chat/${chatGuid}/typing`);
    }

    async leaveChat(chatGuid: string) {
        return this.post(`chat/${chatGuid}/leave`);
    }

    async deleteChat(chatGuid: string) {
        return this.del(`chat/${chatGuid}`);
    }

    async deleteChatMessage(chatGuid: string, messageGuid: string) {
        return this.del(`chat/${chatGuid}/${messageGuid}`);
    }

    // ── Contacts ──
    async getContacts() { return this.get("contact"); }
    async queryContacts(body: unknown) { return this.post("contact/query", body); }

    // ── Contact Private API ──
    async getHandlesContactInfo(includePhotos?: boolean) {
        return this.get("contact/papi/handles", includePhotos ? { includePhotos: "true" } : undefined);
    }

    async getContactForHandle(address: string) {
        return this.get(`contact/papi/handle/${encodeURIComponent(address)}`);
    }

    async getContactPhoto(address: string, quality?: string) {
        return this.get(`contact/papi/handle/${encodeURIComponent(address)}/photo`, quality ? { quality } : undefined);
    }

    async batchCheckIMessage(addresses: string[]) {
        return this.post("contact/papi/imessage-status", { addresses });
    }

    async getHandleSiblings(address: string) {
        return this.get(`contact/papi/handle/${encodeURIComponent(address)}/siblings`);
    }

    async getSuggestedNames() { return this.get("contact/papi/suggested-names"); }

    async getContactAvailability(address: string) {
        return this.get(`contact/papi/handle/${encodeURIComponent(address)}/availability`);
    }

    async detectBusiness(address: string) {
        return this.get(`contact/papi/handle/${encodeURIComponent(address)}/business`);
    }

    // ── Handles ──
    async queryHandles(body: { limit?: number; offset?: number; with?: string[]; address?: string }) {
        return this.post("handle/query", body);
    }

    async getHandle(guid: string) { return this.get(`handle/${guid}`); }
    async getHandleCount() { return this.get("handle/count"); }

    async checkIMessageAvailability(address: string) {
        return this.get("handle/availability/imessage", { address });
    }

    async checkFacetimeAvailability(address: string) {
        return this.get("handle/availability/facetime", { address });
    }

    async getFocusStatus(handleGuid: string) {
        return this.get(`handle/${handleGuid}/focus`);
    }

    // ── Find My ──
    async getDevices() { return this.get("icloud/findmy/devices"); }
    async refreshDevices() { return this.post("icloud/findmy/devices/refresh"); }
    async getFriends() { return this.get("icloud/findmy/friends"); }
    async refreshFriends() { return this.post("icloud/findmy/friends/refresh"); }

    // ── Attachments ──
    async getAttachment(guid: string) { return this.get(`attachment/${guid}`); }
    async getAttachmentCount() { return this.get("attachment/count"); }

    // ── Scheduled Messages ──
    async getScheduledMessages() { return this.get("message/schedule"); }
    async getScheduledMessage(id: string) { return this.get(`message/schedule/${id}`); }
    async createScheduledMessage(body: unknown) { return this.post("message/schedule", body); }
    async updateScheduledMessage(id: string, body: unknown) { return this.put(`message/schedule/${id}`, body); }
    async deleteScheduledMessage(id: string) { return this.del(`message/schedule/${id}`); }

    // ── iCloud ──
    async getAccountInfo() { return this.get("icloud/account"); }

    // ── macOS ──
    async lockMac() { return this.post("mac/lock"); }
    async restartMessagesApp() { return this.post("mac/imessage/restart"); }

    // ── FaceTime ──
    async startFaceTime(addresses: string[]) {
        return this.post("facetime/session", { addresses });
    }

    // ── Webhooks ──
    async getWebhooks() { return this.get("webhook"); }
    async createWebhook(body: { url: string; events: string[] }) { return this.post("webhook", body); }
    async deleteWebhook(id: string) { return this.del(`webhook/${id}`); }
}

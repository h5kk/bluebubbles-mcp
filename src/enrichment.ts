/**
 * Contact resolution and data enrichment.
 *
 * BlueBubbles chat objects often return blank displayName for 1:1 chats,
 * so you only see raw phone numbers. This module builds a lookup table
 * from the contacts database and enriches chat/message data with resolved names.
 */

import { BlueBubblesClient } from "./api-client.js";

interface ContactEntry {
    name: string;
    phones: string[];
    emails: string[];
}

export class ContactResolver {
    private client: BlueBubblesClient;
    private addressToName: Map<string, string> = new Map();
    private lastFetch = 0;
    private fetchPromise: Promise<void> | null = null;
    private readonly cacheTtlMs = 5 * 60 * 1000; // 5 minutes

    constructor(client: BlueBubblesClient) {
        this.client = client;
    }

    /**
     * Normalize a phone number for matching.
     * Strips everything except digits, then keeps last 10 digits.
     * "+1 (918) 625-7838" → "9186257838"
     * "+19186257838"       → "9186257838"
     * "918-625-7838"       → "9186257838"
     */
    static normalizePhone(phone: string): string {
        const digits = phone.replace(/\D/g, "");
        // Keep last 10 digits (drops country code)
        if (digits.length >= 10) {
            return digits.slice(-10);
        }
        return digits;
    }

    /**
     * Normalize an address (phone or email) for map lookup.
     */
    static normalizeAddress(address: string): string {
        if (!address) return "";
        const trimmed = address.trim().toLowerCase();
        // If it looks like an email, just lowercase
        if (trimmed.includes("@")) return trimmed;
        // Otherwise normalize as phone
        return ContactResolver.normalizePhone(trimmed);
    }

    /**
     * Ensure the contact cache is populated.
     */
    private async ensureLoaded(): Promise<void> {
        const now = Date.now();
        if (now - this.lastFetch < this.cacheTtlMs && this.addressToName.size > 0) {
            return;
        }
        // Deduplicate concurrent fetches
        if (this.fetchPromise) {
            await this.fetchPromise;
            return;
        }
        this.fetchPromise = this.loadContacts();
        try {
            await this.fetchPromise;
        } finally {
            this.fetchPromise = null;
        }
    }

    private async loadContacts(): Promise<void> {
        try {
            const result = await this.client.getContacts();
            const contacts: unknown[] = (result.data as unknown[]) || [];
            this.addressToName.clear();

            for (const c of contacts) {
                const contact = c as Record<string, unknown>;
                // Build display name
                const first = (contact.firstName as string) || "";
                const last = (contact.lastName as string) || "";
                const display = (contact.displayName as string) || "";
                const name = display || `${first} ${last}`.trim();
                if (!name) continue;

                // Index all phone numbers
                const phones = (contact.phoneNumbers as Array<{ address?: string }>) || [];
                for (const p of phones) {
                    const addr = p?.address || (typeof p === "string" ? p : "");
                    if (addr) {
                        this.addressToName.set(ContactResolver.normalizeAddress(addr), name);
                    }
                }

                // Index all email addresses
                const emails = (contact.emails as Array<{ address?: string }>) || [];
                for (const e of emails) {
                    const addr = e?.address || (typeof e === "string" ? e : "");
                    if (addr) {
                        this.addressToName.set(ContactResolver.normalizeAddress(addr), name);
                    }
                }
            }

            this.lastFetch = Date.now();
        } catch {
            // Silently fail — enrichment is best-effort
        }
    }

    /**
     * Resolve an address (phone/email) to a contact name, or return null.
     */
    async resolve(address: string): Promise<string | null> {
        if (!address) return null;
        await this.ensureLoaded();
        const normalized = ContactResolver.normalizeAddress(address);
        return this.addressToName.get(normalized) ?? null;
    }

    /**
     * Enrich a chat object: fill in displayName from participants if blank.
     */
    async enrichChat(chat: Record<string, unknown>): Promise<Record<string, unknown>> {
        const displayName = chat.displayName as string;
        if (displayName && displayName.trim()) return chat;

        // For 1:1 chats, resolve the participant's address
        const participants = (chat.participants as Array<Record<string, unknown>>) || [];
        const handles = participants.map(p => {
            const handle = p.handle as Record<string, unknown> | undefined;
            return (handle?.address as string) || (handle?.id as string) || (p.address as string) || "";
        }).filter(Boolean);

        if (handles.length === 0) {
            // Try extracting from the chat GUID: "iMessage;-;+19186257838"
            const guid = (chat.guid as string) || "";
            const parts = guid.split(";");
            if (parts.length >= 3) {
                handles.push(parts.slice(2).join(";"));
            }
        }

        // Resolve names for all handles
        const names: string[] = [];
        for (const handle of handles) {
            const name = await this.resolve(handle);
            names.push(name || handle);
        }

        if (names.length > 0) {
            chat.displayName = names.join(", ");
            chat._resolvedName = true;
        }

        return chat;
    }

    /**
     * Enrich an array of chat objects.
     */
    async enrichChats(chats: unknown[]): Promise<unknown[]> {
        if (!Array.isArray(chats)) return chats;
        return Promise.all(chats.map(c => this.enrichChat(c as Record<string, unknown>)));
    }

    /**
     * Enrich a message object: add sender name.
     */
    async enrichMessage(msg: Record<string, unknown>): Promise<Record<string, unknown>> {
        const handle = msg.handle as Record<string, unknown> | undefined;
        const address = (handle?.address as string) || (handle?.id as string) || (msg.handleId as string) || "";
        if (address && !msg._senderName) {
            const name = await this.resolve(address);
            if (name) {
                msg._senderName = name;
                if (handle) {
                    (handle as Record<string, unknown>)._resolvedName = name;
                }
            }
        }
        return msg;
    }

    /**
     * Enrich an array of message objects.
     */
    async enrichMessages(messages: unknown[]): Promise<unknown[]> {
        if (!Array.isArray(messages)) return messages;
        return Promise.all(messages.map(m => this.enrichMessage(m as Record<string, unknown>)));
    }
}

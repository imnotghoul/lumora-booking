import * as SecureStore from "expo-secure-store";

import type { ClientContact } from "@/lib/types";

const CONTACT_KEY = "lumora_client_contact";

export async function loadSavedContact(): Promise<ClientContact | null> {
  try {
    const value = await SecureStore.getItemAsync(CONTACT_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<ClientContact>;
    if (typeof parsed.phone !== "string" || typeof parsed.email !== "string") return null;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      phone: parsed.phone,
      email: parsed.email,
    };
  } catch {
    return null;
  }
}

export async function saveContact(contact: ClientContact) {
  try {
    await SecureStore.setItemAsync(CONTACT_KEY, JSON.stringify(contact));
  } catch {
    // Сохранение контакта улучшает UX, но не должно блокировать запись.
  }
}

import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "trackly_session";

export type UserRole = "admin" | "teacher";

interface Session {
  role: UserRole;
  key: string;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function validateKey(key: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from("access_keys")
    .select("key, role, is_active")
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return { role: data.role as UserRole, key: data.key };
}

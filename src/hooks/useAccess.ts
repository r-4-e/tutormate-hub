import { useState, useEffect } from "react";
import { getSession, validateKey, saveSession, clearSession, type UserRole } from "@/lib/access";

type AccessState = "loading" | "granted" | "denied";

export function useAccess() {
  const [state, setState] = useState<AccessState>("loading");
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function check() {
      // 1. Check localStorage
      const existing = getSession();
      if (existing) {
        // Re-validate
        const valid = await validateKey(existing.key);
        if (valid) {
          setRole(valid.role);
          setState("granted");
          return;
        }
        clearSession();
      }

      // 2. Check URL param
      const params = new URLSearchParams(window.location.search);
      const key = params.get("access");
      if (key) {
        const session = await validateKey(key);
        if (session) {
          saveSession(session);
          setRole(session.role);
          setState("granted");
          // Remove key from URL
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }
      }

      setState("denied");
    }
    check();
  }, []);

  return { state, role, isAdmin: role === "admin", logout: () => { clearSession(); setState("denied"); setRole(null); } };
}

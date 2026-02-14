import { createContext, useContext } from "react";
import type { UserRole } from "@/lib/access";

interface AccessContextType {
  role: UserRole;
  isAdmin: boolean;
}

const AccessContext = createContext<AccessContextType>({ role: "teacher", isAdmin: false });

export function AccessProvider({ role, children }: { role: UserRole; children: React.ReactNode }) {
  return (
    <AccessContext.Provider value={{ role, isAdmin: role === "admin" }}>
      {children}
    </AccessContext.Provider>
  );
}

export function useRole() {
  return useContext(AccessContext);
}

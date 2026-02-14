import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/access";

type AuditAction = "create" | "update" | "delete" | "restore";

export async function logAudit(
  action: AuditAction,
  tableName: string,
  recordId: string,
  description: string,
  changes?: Record<string, any>
) {
  const session = getSession();
  const actorRole = session?.role || "unknown";

  await supabase.from("audit_log").insert({
    action,
    table_name: tableName,
    record_id: recordId,
    actor_role: actorRole,
    description,
    changes: changes || null,
  } as any);
}

export async function softDelete(tableName: string, recordId: string, description: string) {
  const { error } = await supabase
    .from(tableName as any)
    .update({ deleted_at: new Date().toISOString() } as any)
    .eq("id", recordId);

  if (!error) {
    await logAudit("delete", tableName, recordId, description);
  }
  return { error };
}

export async function restoreRecord(tableName: string, recordId: string, description: string) {
  const { error } = await supabase
    .from(tableName as any)
    .update({ deleted_at: null } as any)
    .eq("id", recordId);

  if (!error) {
    await logAudit("restore", tableName, recordId, description);
  }
  return { error };
}

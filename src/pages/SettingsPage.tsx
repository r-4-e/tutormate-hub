import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Key, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newRole, setNewRole] = useState("teacher");
  const [batchSubjects, setBatchSubjects] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [kRes, bRes] = await Promise.all([
      supabase.from("access_keys").select("*").order("created_at", { ascending: false }),
      supabase.from("batches").select("*"),
    ]);
    setKeys(kRes.data || []);
    setBatches(bRes.data || []);
    const subjects: Record<string, string> = {};
    (bRes.data || []).forEach((b) => { subjects[b.id] = b.subject || ""; });
    setBatchSubjects(subjects);
  }

  async function addKey() {
    if (!newKey) return toast.error("Enter a key");
    const { error } = await supabase.from("access_keys").insert({ key: newKey, role: newRole });
    if (error) return toast.error("Failed — key might already exist");
    toast.success("Key added!");
    setNewKey("");
    loadData();
  }

  async function deleteKey(id: string) {
    await supabase.from("access_keys").delete().eq("id", id);
    toast.success("Key deleted");
    loadData();
  }

  async function updateSubject(batchId: string, subject: string) {
    await supabase.from("batches").update({ subject }).eq("id", batchId);
    toast.success("Subject updated");
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Settings</h2>

      <section className="space-y-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Access Keys</h3>
        <div className="flex gap-2">
          <Input placeholder="New key..." value={newKey} onChange={(e) => setNewKey(e.target.value)} className="rounded-xl" />
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger className="w-28 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addKey} className="rounded-xl"><Plus className="h-4 w-4" /></Button>
        </div>
        {keys.map((k) => (
          <motion.div key={k.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card border rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{k.key}</code>
              <span className="text-xs capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full">{k.role}</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?access=${k.key}`); toast.success("Link copied!"); }}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteKey(k.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Batch Subjects</h3>
        {batches.map((b) => (
          <div key={b.id} className="bg-card border rounded-xl p-3 space-y-2">
            <Label className="text-sm font-semibold">{b.name}</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Subject..."
                value={batchSubjects[b.id] || ""}
                onChange={(e) => setBatchSubjects({ ...batchSubjects, [b.id]: e.target.value })}
                className="rounded-xl"
              />
              <Button variant="outline" className="rounded-xl" onClick={() => updateSubject(b.id, batchSubjects[b.id] || "")}>Save</Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ClassHistory() {
  const [entries, setEntries] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchFilter, setBatchFilter] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ batch_id: "", topic: "", homework: "", teacher_notes: "" });

  useEffect(() => {
    supabase.from("batches").select("*").then(({ data }) => {
      setBatches(data || []);
      if (data?.[0]) { setBatchFilter(data[0].id); setForm((f) => ({ ...f, batch_id: data[0].id })); }
    });
  }, []);

  useEffect(() => { if (batchFilter) loadEntries(); }, [batchFilter]);

  async function loadEntries() {
    const { data } = await supabase.from("class_history").select("*, batches(name)").eq("batch_id", batchFilter).order("date", { ascending: false });
    setEntries(data || []);
  }

  async function addEntry() {
    if (!form.batch_id) return toast.error("Select a batch");
    const { error } = await supabase.from("class_history").insert({
      batch_id: form.batch_id,
      date: format(new Date(), "yyyy-MM-dd"),
      topic: form.topic || null,
      homework: form.homework || null,
      teacher_notes: form.teacher_notes || null,
    });
    if (error) return toast.error("Failed to save");
    toast.success("Class logged!");
    setAdding(false);
    setForm({ ...form, topic: "", homework: "", teacher_notes: "" });
    loadEntries();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Class History</h2>
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1"><Plus className="h-4 w-4" /> Log Class</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Today's Class</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Batch</Label>
                <Select value={form.batch_id} onValueChange={(v) => setForm({ ...form, batch_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Topic</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
              <div><Label>Homework</Label><Input value={form.homework} onChange={(e) => setForm({ ...form, homework: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea value={form.teacher_notes} onChange={(e) => setForm({ ...form, teacher_notes: e.target.value })} /></div>
              <Button onClick={addEntry} className="w-full rounded-xl">Save Entry</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-1">
        {batches.map((b) => (
          <Button key={b.id} variant={batchFilter === b.id ? "default" : "outline"} size="sm" className="rounded-xl text-xs" onClick={() => setBatchFilter(b.id)}>
            {b.name}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {entries.map((e, i) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm">{e.topic || "No topic"}</span>
              <span className="text-xs text-muted-foreground ml-auto">{e.date}</span>
            </div>
            {e.homework && <p className="text-xs text-muted-foreground">📝 HW: {e.homework}</p>}
            {e.teacher_notes && <p className="text-xs text-muted-foreground mt-1">{e.teacher_notes}</p>}
          </motion.div>
        ))}
        {entries.length === 0 && <p className="text-center text-muted-foreground py-8">No class history yet</p>}
      </div>
    </div>
  );
}

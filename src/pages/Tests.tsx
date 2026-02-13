import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Tests() {
  const [tests, setTests] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ student_id: "", subject: "", marks: "", remarks: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [tRes, sRes] = await Promise.all([
      supabase.from("tests").select("*, students(name)").order("test_date", { ascending: false }),
      supabase.from("students").select("id, name").eq("status", "active").order("name"),
    ]);
    setTests(tRes.data || []);
    setStudents(sRes.data || []);
  }

  async function addTest() {
    if (!form.student_id || !form.subject) return toast.error("Fill required fields");
    const { error } = await supabase.from("tests").insert({
      student_id: form.student_id,
      subject: form.subject,
      marks: form.marks ? Number(form.marks) : null,
      remarks: form.remarks || null,
    });
    if (error) return toast.error("Failed to save");
    toast.success("Test recorded!");
    setAdding(false);
    setForm({ student_id: "", subject: "", marks: "", remarks: "" });
    loadData();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tests</h2>
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1"><Plus className="h-4 w-4" /> Add Test</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Test Score</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Student</Label>
                <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div><Label>Marks</Label><Input type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} /></div>
              <div><Label>Remarks</Label><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
              <Button onClick={addTest} className="w-full rounded-xl">Save Test</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {tests.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-card border rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{t.students?.name}</p>
              <p className="text-xs text-muted-foreground">{t.subject} · {t.test_date}</p>
              {t.remarks && <p className="text-xs text-muted-foreground italic">{t.remarks}</p>}
            </div>
            <span className="text-lg font-bold text-primary">{t.marks ?? "—"}</span>
          </motion.div>
        ))}
        {tests.length === 0 && <p className="text-center text-muted-foreground py-8">No tests recorded yet</p>}
      </div>
    </div>
  );
}

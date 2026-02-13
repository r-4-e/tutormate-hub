import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", class: "", batch_id: "", parent_name: "", parent_phone: "", monthly_fee: "" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [s, b] = await Promise.all([
      supabase.from("students").select("*, batches(name)").eq("status", "active").order("name"),
      supabase.from("batches").select("*"),
    ]);
    setStudents(s.data || []);
    setBatches(b.data || []);
  }

  async function addStudent() {
    if (!form.name) return toast.error("Name is required");
    const { error } = await supabase.from("students").insert({
      name: form.name,
      class: form.class || null,
      batch_id: form.batch_id || null,
      parent_name: form.parent_name || null,
      parent_phone: form.parent_phone || null,
      monthly_fee: Number(form.monthly_fee) || 0,
    });
    if (error) return toast.error("Failed to add student");
    toast.success("Student added!");
    setAdding(false);
    setForm({ name: "", class: "", batch_id: "", parent_name: "", parent_phone: "", monthly_fee: "" });
    loadData();
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.parent_phone?.includes(q) || s.priority_tag?.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Students</h2>
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Class</Label><Input value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} /></div>
              <div>
                <Label>Batch</Label>
                <Select value={form.batch_id} onValueChange={(v) => setForm({ ...form, batch_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Parent Name</Label><Input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} /></div>
              <div><Label>Parent Phone</Label><Input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} /></div>
              <div><Label>Monthly Fee (₹)</Label><Input type="number" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} /></div>
              <Button onClick={addStudent} className="w-full rounded-xl">Add Student</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search students..." className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card border rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/students/${s.id}`)}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">Class {s.class} · {s.batches?.name || "No batch"}</p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">₹{s.monthly_fee}</span>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No students found</p>}
      </div>
    </div>
  );
}

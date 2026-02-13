import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, IndianRupee } from "lucide-react";
import { toast } from "sonner";

export default function Fees() {
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [form, setForm] = useState({ student_id: "", amount: "", payment_mode: "cash" });

  useEffect(() => {
    loadData();
  }, [month]);

  async function loadData() {
    const [fRes, sRes] = await Promise.all([
      supabase.from("fees").select("*, students(name)").eq("month", month).order("created_at", { ascending: false }),
      supabase.from("students").select("id, name, monthly_fee").eq("status", "active").order("name"),
    ]);
    setFees(fRes.data || []);
    setStudents(sRes.data || []);
  }

  async function addFee() {
    if (!form.student_id) return toast.error("Select a student");
    const student = students.find((s) => s.id === form.student_id);
    const amount = Number(form.amount) || student?.monthly_fee || 0;
    const { error } = await supabase.from("fees").insert({
      student_id: form.student_id,
      month,
      amount,
      status: "paid",
      paid_on: new Date().toISOString().split("T")[0],
      payment_mode: form.payment_mode,
    });
    if (error) return toast.error("Failed to add fee");
    toast.success("Fee recorded!");
    setAdding(false);
    setForm({ student_id: "", amount: "", payment_mode: "cash" });
    loadData();
  }

  async function markPaid(feeId: string) {
    await supabase.from("fees").update({ status: "paid", paid_on: new Date().toISOString().split("T")[0] }).eq("id", feeId);
    toast.success("Marked as paid!");
    loadData();
  }

  const paid = fees.filter((f) => f.status === "paid");
  const pending = fees.filter((f) => f.status === "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Fees</h2>
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1"><Plus className="h-4 w-4" /> Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Fee Payment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Student</Label>
                <Select value={form.student_id} onValueChange={(v) => {
                  const st = students.find((s) => s.id === v);
                  setForm({ ...form, student_id: v, amount: String(st?.monthly_fee || "") });
                }}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div>
                <Label>Mode</Label>
                <Select value={form.payment_mode} onValueChange={(v) => setForm({ ...form, payment_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addFee} className="w-full rounded-xl">Record Payment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl" />

      <Tabs defaultValue="pending">
        <TabsList className="w-full grid grid-cols-2 rounded-xl">
          <TabsTrigger value="pending" className="rounded-lg">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="paid" className="rounded-lg">Paid ({paid.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-2 mt-3">
          {pending.length === 0 && <p className="text-center text-muted-foreground py-8">All fees collected! 🎉</p>}
          {pending.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-card border rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{f.students?.name}</p>
                <p className="text-xs text-muted-foreground">₹{f.amount}</p>
              </div>
              <Button size="sm" className="rounded-lg" onClick={() => markPaid(f.id)}>Mark Paid</Button>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="paid" className="space-y-2 mt-3">
          {paid.length === 0 && <p className="text-center text-muted-foreground py-8">No payments yet</p>}
          {paid.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-card border rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{f.students?.name}</p>
                <p className="text-xs text-muted-foreground">₹{f.amount} · {f.payment_mode} · {f.paid_on}</p>
              </div>
              <span className="text-xs bg-success/15 text-success px-2 py-1 rounded-full font-semibold">Paid</span>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

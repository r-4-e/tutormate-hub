import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, IndianRupee, AlertTriangle, CalendarCheck } from "lucide-react";
import StatCard from "@/components/StatCard";

export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [stats, setStats] = useState({ income: 0, pending: 0, attendance: 0 });
  const [pendingList, setPendingList] = useState<any[]>([]);

  useEffect(() => { loadReport(); }, [month]);

  async function loadReport() {
    const [fRes, sRes, aRes] = await Promise.all([
      supabase.from("fees").select("*, students(name, monthly_fee)").eq("month", month),
      supabase.from("students").select("id, name, monthly_fee").eq("status", "active"),
      supabase.from("attendance").select("student_id, status").gte("date", `${month}-01`).lte("date", `${month}-31`),
    ]);

    const fees = fRes.data || [];
    const students = sRes.data || [];
    const att = aRes.data || [];

    const income = fees.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
    const paidIds = new Set(fees.filter((f) => f.status === "paid").map((f) => f.student_id));
    const unpaid = students.filter((s) => !paidIds.has(s.id));
    const pendingAmt = unpaid.reduce((s, st) => s + Number(st.monthly_fee), 0);
    const total = att.length;
    const present = att.filter((a) => a.status === "present").length;

    setStats({ income, pending: pendingAmt, attendance: total > 0 ? Math.round((present / total) * 100) : 0 });
    setPendingList(unpaid);
  }

  function exportCSV() {
    const rows = [["Name", "Monthly Fee", "Status"]];
    pendingList.forEach((s) => rows.push([s.name, String(s.monthly_fee), "Pending"]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Reports</h2>

      <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl" />

      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={IndianRupee} label="Income" value={stats.income} prefix="₹" />
        <StatCard icon={AlertTriangle} label="Pending" value={stats.pending} prefix="₹" />
        <StatCard icon={CalendarCheck} label="Attend %" value={stats.attendance} suffix="%" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Pending List</h3>
        <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="space-y-2">
        {pendingList.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-card border rounded-xl p-3 flex justify-between items-center">
            <span className="font-semibold text-sm">{s.name}</span>
            <span className="text-sm text-destructive font-bold">₹{s.monthly_fee}</span>
          </motion.div>
        ))}
        {pendingList.length === 0 && <p className="text-center text-muted-foreground py-8">All fees collected! 🎉</p>}
      </div>
    </div>
  );
}

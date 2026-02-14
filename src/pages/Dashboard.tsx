import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, IndianRupee, AlertTriangle, CalendarCheck, Plus, ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, collected: 0, pending: 0, attendance: 0 });
  const [defaulters, setDefaulters] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const [studentsRes, feesRes, attendanceRes] = await Promise.all([
        supabase.from("students").select("id, name, monthly_fee, batch_id").eq("status", "active").is("deleted_at", null),
        supabase.from("fees").select("student_id, amount, status").eq("month", month).is("deleted_at", null),
        supabase.from("attendance").select("student_id, status").gte("date", `${month}-01`).is("deleted_at", null),
      ]);

      const students = studentsRes.data || [];
      const fees = feesRes.data || [];
      const att = attendanceRes.data || [];

      const collected = fees.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
      const paidIds = new Set(fees.filter((f) => f.status === "paid").map((f) => f.student_id));
      const pendingStudents = students.filter((s) => !paidIds.has(s.id));
      const pendingAmount = pendingStudents.reduce((s, st) => s + Number(st.monthly_fee), 0);

      const total = att.length;
      const present = att.filter((a) => a.status === "present").length;
      const attPct = total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({ students: students.length, collected, pending: pendingAmount, attendance: attPct });
      setDefaulters(pendingStudents.slice(0, 5));
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold">Welcome back, Ma'am 👋</h2>
        <p className="text-muted-foreground text-sm">Here's today's overview</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Total Students" value={stats.students} />
        <StatCard icon={IndianRupee} label="Collected" value={stats.collected} prefix="₹" />
        <StatCard icon={AlertTriangle} label="Pending" value={stats.pending} prefix="₹" />
        <StatCard icon={CalendarCheck} label="Attendance" value={stats.attendance} suffix="%" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          className="h-14 rounded-2xl text-base font-bold gap-2"
          onClick={() => navigate("/fees")}
        >
          <Plus className="h-5 w-5" /> Quick Fee Entry
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="h-14 rounded-2xl text-base font-bold gap-2"
          onClick={() => navigate("/attendance")}
        >
          <ClipboardCheck className="h-5 w-5" /> Mark Attendance
        </Button>
      </div>

      {defaulters.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Fee Defaulters</h3>
          {defaulters.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border rounded-xl p-3 flex items-center justify-between cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => navigate(`/students/${s.id}`)}
            >
              <div>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground">₹{s.monthly_fee} pending</p>
              </div>
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-semibold">Unpaid</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

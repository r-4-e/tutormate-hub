import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { restoreRecord } from "@/lib/auditLog";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, IndianRupee, AlertTriangle, CalendarCheck, Undo2, Clock, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(340, 82%, 62%)", "hsl(340, 60%, 80%)", "hsl(340, 40%, 90%)"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, collected: 0, pending: 0, attendance: 0 });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [batchData, setBatchData] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [studentsRes, feesRes, attendanceRes, auditRes, deletedStudentsRes, allFeesRes, batchesRes] = await Promise.all([
      supabase.from("students").select("id, name, monthly_fee, batch_id").eq("status", "active").is("deleted_at", null),
      supabase.from("fees").select("student_id, amount, status").eq("month", month).is("deleted_at", null),
      supabase.from("attendance").select("student_id, status").gte("date", `${month}-01`).is("deleted_at", null),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("students").select("id, name, deleted_at").not("deleted_at", "is", null),
      supabase.from("fees").select("amount, status, month").is("deleted_at", null),
      supabase.from("batches").select("id, name"),
    ]);

    const students = studentsRes.data || [];
    const fees = feesRes.data || [];
    const att = attendanceRes.data || [];

    const collected = fees.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
    const paidIds = new Set(fees.filter((f) => f.status === "paid").map((f) => f.student_id));
    const pendingAmount = students.filter((s) => !paidIds.has(s.id)).reduce((s, st) => s + Number(st.monthly_fee), 0);
    const total = att.length;
    const present = att.filter((a) => a.status === "present").length;

    setStats({
      students: students.length,
      collected,
      pending: pendingAmount,
      attendance: total > 0 ? Math.round((present / total) * 100) : 0,
    });

    setAuditLogs(auditRes.data || []);
    setDeletedRecords(deletedStudentsRes.data || []);

    // Revenue by month (last 6 months)
    const allFees = allFeesRes.data || [];
    const monthMap: Record<string, number> = {};
    allFees.filter((f) => f.status === "paid").forEach((f) => {
      monthMap[f.month] = (monthMap[f.month] || 0) + Number(f.amount);
    });
    const sortedMonths = Object.keys(monthMap).sort().slice(-6);
    setRevenueData(sortedMonths.map((m) => ({ month: m, revenue: monthMap[m] })));

    // Batch distribution
    const batches = batchesRes.data || [];
    const batchCounts = batches.map((b) => ({
      name: b.name,
      value: students.filter((s) => s.batch_id === b.id).length,
    }));
    setBatchData(batchCounts);
  }

  async function handleRestore(id: string, name: string) {
    const { error } = await restoreRecord("students", id, `Restored student: ${name}`);
    if (error) return toast.error("Failed to restore");
    toast.success(`${name} restored!`);
    loadAll();
  }

  const actionColors: Record<string, string> = {
    create: "bg-success/15 text-success",
    update: "bg-primary/15 text-primary",
    delete: "bg-destructive/15 text-destructive",
    restore: "bg-accent text-accent-foreground",
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold">Admin Panel 🛡️</h2>
        <p className="text-muted-foreground text-sm">Moderation & analytics overview</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Total Students" value={stats.students} />
        <StatCard icon={IndianRupee} label="Collected" value={stats.collected} prefix="₹" />
        <StatCard icon={AlertTriangle} label="Pending" value={stats.pending} prefix="₹" />
        <StatCard icon={CalendarCheck} label="Attendance" value={stats.attendance} suffix="%" />
      </div>

      <Tabs defaultValue="audit">
        <TabsList className="w-full grid grid-cols-3 rounded-xl">
          <TabsTrigger value="audit" className="rounded-lg text-xs">
            <Activity className="h-3 w-3 mr-1" /> Audit Log
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg text-xs">
            <IndianRupee className="h-3 w-3 mr-1" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="restore" className="rounded-lg text-xs">
            <Undo2 className="h-3 w-3 mr-1" /> Restore
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="mt-3 space-y-2">
          {auditLogs.length === 0 && <p className="text-center text-muted-foreground py-8">No activity yet</p>}
          {auditLogs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-card border rounded-xl p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                  {log.action}
                </span>
                <span className="text-xs text-muted-foreground">{log.table_name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(log.created_at), "dd MMM, HH:mm")}
                </span>
              </div>
              <p className="text-sm">{log.description || "—"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">by <span className="capitalize font-semibold">{log.actor_role}</span></p>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="analytics" className="mt-3 space-y-6">
          <div>
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mb-3">Monthly Revenue</h3>
            {revenueData.length > 0 ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`₹${value}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No revenue data yet</p>
            )}
          </div>

          <div>
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mb-3">Batch Distribution</h3>
            {batchData.some((b) => b.value > 0) ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={batchData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {batchData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No students assigned to batches yet</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="restore" className="mt-3 space-y-2">
          {deletedRecords.length === 0 && <p className="text-center text-muted-foreground py-8">No deleted records to restore</p>}
          {deletedRecords.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card border rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-muted-foreground">Deleted {r.deleted_at ? format(new Date(r.deleted_at), "dd MMM yyyy") : ""}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => handleRestore(r.id, r.name)}>
                <Undo2 className="h-3 w-3" /> Restore
              </Button>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

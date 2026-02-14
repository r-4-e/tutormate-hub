import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logAudit } from "@/lib/auditLog";

export default function Attendance() {
  const [date, setDate] = useState<Date>(new Date());
  const [batchId, setBatchId] = useState<string>("");
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("batches").select("*").then(({ data }) => {
      setBatches(data || []);
      if (data?.[0]) setBatchId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!batchId) return;
    loadStudentsAndAttendance();
  }, [batchId, date]);

  async function loadStudentsAndAttendance() {
    const dateStr = format(date, "yyyy-MM-dd");
    const [sRes, aRes] = await Promise.all([
      supabase.from("students").select("id, name").eq("batch_id", batchId).eq("status", "active").is("deleted_at", null).order("name"),
      supabase.from("attendance").select("student_id, status").eq("date", dateStr).is("deleted_at", null),
    ]);
    setStudents(sRes.data || []);
    const rec: Record<string, string> = {};
    (aRes.data || []).forEach((a) => { rec[a.student_id] = a.status; });
    setRecords(rec);
  }

  function toggle(studentId: string, status: string) {
    setRecords((prev) => ({ ...prev, [studentId]: prev[studentId] === status ? "" : status }));
  }

  async function save() {
    setSaving(true);
    const dateStr = format(date, "yyyy-MM-dd");
    await supabase.from("attendance").delete().eq("date", dateStr).in("student_id", students.map((s) => s.id));

    const rows = Object.entries(records)
      .filter(([, status]) => status)
      .map(([student_id, status]) => ({ student_id, date: dateStr, status }));

    if (rows.length > 0) {
      const { error } = await supabase.from("attendance").insert(rows);
      if (error) { toast.error("Failed to save"); setSaving(false); return; }
    }

    const batch = batches.find((b) => b.id === batchId);
    await logAudit("create", "attendance", batchId, `Marked attendance for ${batch?.name} on ${dateStr} (${rows.length} students)`);
    toast.success("Attendance saved!");
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Attendance</h2>

      <div className="flex gap-2 items-center flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-xl gap-2">
              <CalendarIcon className="h-4 w-4" /> {format(date, "dd MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <div className="flex gap-1">
          {batches.map((b) => (
            <Button
              key={b.id}
              variant={batchId === b.id ? "default" : "outline"}
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setBatchId(b.id)}
            >
              {b.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {students.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-card border rounded-xl p-3 flex items-center justify-between"
          >
            <span className="font-semibold text-sm">{s.name}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={records[s.id] === "present" ? "default" : "outline"}
                className={cn("rounded-lg h-9 w-9 p-0", records[s.id] === "present" && "bg-success hover:bg-success/90")}
                onClick={() => toggle(s.id, "present")}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={records[s.id] === "absent" ? "default" : "outline"}
                className={cn("rounded-lg h-9 w-9 p-0", records[s.id] === "absent" && "bg-destructive hover:bg-destructive/90")}
                onClick={() => toggle(s.id, "absent")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
        {students.length === 0 && <p className="text-center text-muted-foreground py-8">No students in this batch</p>}
      </div>

      {students.length > 0 && (
        <Button onClick={save} disabled={saving} className="w-full rounded-xl h-12 text-base font-bold">
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      )}
    </div>
  );
}

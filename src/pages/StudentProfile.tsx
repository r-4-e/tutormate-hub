import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [batch, setBatch] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [classHistory, setClassHistory] = useState<any[]>([]);
  const [reminder, setReminder] = useState<"polite" | "final" | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [sRes, fRes, aRes, tRes] = await Promise.all([
        supabase.from("students").select("*, batches(name)").eq("id", id).single(),
        supabase.from("fees").select("*").eq("student_id", id).order("month", { ascending: false }),
        supabase.from("attendance").select("*").eq("student_id", id).order("date", { ascending: false }).limit(30),
        supabase.from("tests").select("*").eq("student_id", id).order("test_date", { ascending: false }),
      ]);
      if (sRes.data) {
        setStudent(sRes.data);
        setBatch(sRes.data.batches);
        if (sRes.data.batch_id) {
          const chRes = await supabase.from("class_history").select("*").eq("batch_id", sRes.data.batch_id).order("date", { ascending: false }).limit(20);
          setClassHistory(chRes.data || []);
        }
      }
      setFees(fRes.data || []);
      setAttendance(aRes.data || []);
      setTests(tRes.data || []);
    }
    load();
  }, [id]);

  if (!student) return <p className="text-center py-10 text-muted-foreground">Loading...</p>;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const pendingFee = fees.find((f) => f.status === "pending");

  function getReminderText(type: "polite" | "final") {
    const month = pendingFee?.month || currentMonth;
    const amount = pendingFee?.amount || student.monthly_fee;
    const batchName = batch?.name || "N/A";
    if (type === "polite") {
      return `Hello ${student.parent_name || "Parent"},\nThis is a gentle reminder that ${student.name}'s tuition fee for ${month} is pending.\nAmount Due: ₹${amount}\nBatch: ${batchName}\nThank you.`;
    }
    return `Hello ${student.parent_name || "Parent"},\nThis is the final reminder to clear ${student.name}'s tuition fee for ${month}.\nAmount Due: ₹${amount}\nBatch: ${batchName}\nPlease make the payment at the earliest.`;
  }

  function copyReminder() {
    if (!reminder) return;
    navigator.clipboard.writeText(getReminderText(reminder));
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attPct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/students")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-2xl p-4">
        <h2 className="text-xl font-bold">{student.name}</h2>
        <div className="flex gap-2 mt-1 flex-wrap">
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">{batch?.name || "No batch"}</span>
          <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full font-semibold capitalize">{student.priority_tag}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Class {student.class || "N/A"}</span>
        </div>
      </motion.div>

      <Tabs defaultValue="info">
        <TabsList className="w-full grid grid-cols-6 rounded-xl">
          <TabsTrigger value="info" className="text-xs rounded-lg">Info</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs rounded-lg">Attend</TabsTrigger>
          <TabsTrigger value="fees" className="text-xs rounded-lg">Fees</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs rounded-lg">Notes</TabsTrigger>
          <TabsTrigger value="tests" className="text-xs rounded-lg">Tests</TabsTrigger>
          <TabsTrigger value="history" className="text-xs rounded-lg">History</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-2 mt-3">
          <InfoRow label="Parent" value={student.parent_name || "—"} />
          <InfoRow label="Phone" value={student.parent_phone || "—"} />
          <InfoRow label="Monthly Fee" value={`₹${student.monthly_fee}`} />
          <InfoRow label="Joined" value={student.joined_on || "—"} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-3">
          <p className="text-sm text-muted-foreground mb-2">Last 30 records · {attPct}% present</p>
          <div className="flex flex-wrap gap-1">
            {attendance.map((a) => (
              <div key={a.id} className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${a.status === "present" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                {a.status === "present" ? "P" : "A"}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fees" className="mt-3 space-y-2">
          {fees.length === 0 && <p className="text-muted-foreground text-sm">No fee records</p>}
          {fees.map((f) => (
            <div key={f.id} className="bg-muted/50 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{f.month}</p>
                <p className="text-xs text-muted-foreground">₹{f.amount} · {f.payment_mode}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${f.status === "paid" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                {f.status}
              </span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="notes" className="mt-3">
          <p className="text-sm">{student.notes || "No notes yet"}</p>
        </TabsContent>

        <TabsContent value="tests" className="mt-3 space-y-2">
          {tests.length === 0 && <p className="text-muted-foreground text-sm">No test records</p>}
          {tests.map((t) => (
            <div key={t.id} className="bg-muted/50 rounded-xl p-3">
              <div className="flex justify-between">
                <p className="font-semibold text-sm">{t.subject}</p>
                <span className="text-sm font-bold text-primary">{t.marks}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.test_date} · {t.remarks || ""}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-3 space-y-2">
          {classHistory.length === 0 && <p className="text-muted-foreground text-sm">No class history</p>}
          {classHistory.map((c) => (
            <div key={c.id} className="bg-muted/50 rounded-xl p-3">
              <p className="font-semibold text-sm">{c.topic || "No topic"}</p>
              <p className="text-xs text-muted-foreground">{c.date} · HW: {c.homework || "None"}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Sticky Reminder Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t flex gap-2 max-w-4xl mx-auto">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setReminder("polite")}>Polite Reminder</Button>
        <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => setReminder("final")}>Final Reminder</Button>
      </div>

      <Dialog open={!!reminder} onOpenChange={() => setReminder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{reminder === "polite" ? "Polite" : "Final"} Reminder</DialogTitle></DialogHeader>
          <pre className="whitespace-pre-wrap text-sm bg-muted rounded-xl p-4">{reminder && getReminderText(reminder)}</pre>
          <div className="flex gap-2">
            <Button onClick={copyReminder} className="flex-1 gap-2 rounded-xl">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" onClick={() => setReminder(null)} className="rounded-xl">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

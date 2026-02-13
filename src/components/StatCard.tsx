import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color?: string;
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v)}${suffix}`);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

export default function StatCard({ icon: Icon, label, value, prefix, suffix }: Props) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 8px 30px -12px hsl(340 82% 65% / 0.3)" }}
      whileTap={{ scale: 0.97 }}
      className="bg-card rounded-2xl p-4 border shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground">
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          </p>
        </div>
      </div>
    </motion.div>
  );
}

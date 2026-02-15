import { motion } from "framer-motion";
import { ShieldX } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center space-y-4"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="inline-block"
        >
          <ShieldX className="h-20 w-20 text-primary mx-auto" />
        </motion.div>
        <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground max-w-sm">
          You need a valid access key to use Tracly. Please contact the admin.
        </p>
      </motion.div>
    </div>
  );
}

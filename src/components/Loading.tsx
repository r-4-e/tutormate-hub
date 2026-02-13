import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-center space-y-3"
      >
        <div className="h-12 w-12 rounded-full bg-primary/30 mx-auto flex items-center justify-center">
          <div className="h-6 w-6 rounded-full bg-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground font-medium">Loading Trackly...</p>
      </motion.div>
    </div>
  );
}

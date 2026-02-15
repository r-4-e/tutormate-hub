import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, CalendarCheck, IndianRupee,
  BookOpen, FileText, BarChart3, Settings, Menu, X, Moon, Sun, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import type { UserRole } from "@/lib/access";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/students", icon: Users, label: "Students" },
  { to: "/attendance", icon: CalendarCheck, label: "Attendance" },
  { to: "/fees", icon: IndianRupee, label: "Fees" },
  { to: "/class-history", icon: BookOpen, label: "Class History" },
  { to: "/tests", icon: FileText, label: "Tests" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

interface Props {
  children: React.ReactNode;
  role: UserRole;
  onLogout: () => void;
}

export default function AppLayout({ children, role, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const location = useLocation();

  const allNav = role === "admin"
    ? [...navItems, { to: "/settings", icon: Settings, label: "Settings" }]
    : navItems;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-primary">Tracly</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-accent transition-colors">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Slide Menu */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r z-50 flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b">
                <div>
                  <h2 className="text-xl font-bold text-primary">Tracly</h2>
                  <p className="text-xs text-muted-foreground">Track. Teach. Thrive.</p>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-accent">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                {allNav.map((item, i) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-foreground hover:bg-accent"
                        )
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
              <div className="p-3 border-t space-y-1">
                <div className="px-4 py-2 text-xs text-muted-foreground">
                  Role: <span className="capitalize font-semibold text-foreground">{role}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 w-full transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <main className="p-4 pb-20 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

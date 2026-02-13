import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAccess } from "@/hooks/useAccess";
import Loading from "@/components/Loading";
import AccessDenied from "@/components/AccessDenied";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import StudentProfile from "@/pages/StudentProfile";
import Attendance from "@/pages/Attendance";
import Fees from "@/pages/Fees";
import ClassHistory from "@/pages/ClassHistory";
import Tests from "@/pages/Tests";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";

const queryClient = new QueryClient();

function AppContent() {
  const { state, role, isAdmin, logout } = useAccess();

  if (state === "loading") return <Loading />;
  if (state === "denied" || !role) return <AccessDenied />;

  return (
    <BrowserRouter>
      <AppLayout role={role} onLogout={logout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/class-history" element={<ClassHistory />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/reports" element={<Reports />} />
          {isAdmin && <Route path="/settings" element={<SettingsPage />} />}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

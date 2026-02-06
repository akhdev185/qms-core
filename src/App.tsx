import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ModulePage from "./pages/ModulePage";
import RecordDetail from "./pages/RecordDetail";
import AuditPage from "./pages/AuditPage";
import NotFound from "./pages/NotFound";

import ArchivePage from "./pages/ArchivePage";
import RiskManagementPage from "./pages/RiskManagementPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthProvider } from "./hooks/useAuth";
import { RequireAuth, RequireRole } from "./components/auth/Guards";
import AdminAccounts from "./pages/AdminAccounts";
import AdminGate from "./pages/AdminGate";
import AdminAccessGuard from "./components/auth/AdminAccessGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/module/:moduleId" element={<RequireAuth><ModulePage /></RequireAuth>} />
            <Route path="/record/:code" element={<RequireAuth><RecordDetail /></RequireAuth>} />
            <Route path="/audit" element={<RequireAuth><AuditPage /></RequireAuth>} />
            <Route path="/archive" element={<RequireAuth><ArchivePage /></RequireAuth>} />
            <Route path="/risk-management" element={<RequireAuth><RiskManagementPage /></RequireAuth>} />
            <Route path="/admin" element={<AdminGate />} />
            <Route path="/admin/accounts" element={<AdminAccessGuard><AdminAccounts /></AdminAccessGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

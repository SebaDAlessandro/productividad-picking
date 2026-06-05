import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth";
import { OperationsProvider } from "../hooks/useOperationsData";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { PickingPage } from "../features/picking/PickingPage";
import { TeamPickingPage } from "../features/picking/TeamPickingPage";
import { ControlPanelPage } from "../features/controls/ControlPanelPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { AdminTablesPage } from "../features/admin-tables/AdminTablesPage";
import { AuditPage } from "../features/audit/AuditPage";
import { DocsPage } from "../features/docs/DocsPage";
import { AccessDeniedPage, NotFoundPage } from "../features/docs/SystemPages";

export default function App() {
  return (
    <AuthProvider>
      <OperationsProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route element={<ProtectedRoute permission="picking:write" />}>
                <Route path="picking" element={<PickingPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="team-picking:manage" />}>
                <Route path="team-picking" element={<TeamPickingPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="controls:write" />}>
                <Route path="controls" element={<ControlPanelPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="reports:view" />}>
                <Route path="reports" element={<ReportsPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="admin:manage" />}>
                <Route path="admin" element={<AdminTablesPage />} />
              </Route>
              <Route element={<ProtectedRoute permission="audit:view" />}>
                <Route path="audit" element={<AuditPage />} />
              </Route>
              <Route path="docs/:section" element={<DocsPage />} />
              <Route path="access-denied" element={<AccessDeniedPage />} />
              <Route path="404" element={<NotFoundPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </OperationsProvider>
    </AuthProvider>
  );
}

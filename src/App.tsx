import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './auth/AuthContext'
import { CompanyProvider } from './company/CompanyContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AdminProtectedRoute } from './routes/AdminProtectedRoute'
import { AdminShell } from './components/admin/AdminShell'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminLoginCallbackPage } from './pages/admin/AdminLoginCallbackPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminPlansPage } from './pages/admin/AdminPlansPage'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { CheckEmailPage } from './pages/CheckEmailPage'
import { EmailConfirmedPage } from './pages/EmailConfirmedPage'
import { AcceptInvitationPage } from './pages/AcceptInvitationPage'
import { TermsPage } from './pages/TermsPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { CompanyPage } from './pages/CompanyPage'
import { CustomersPage } from './pages/CustomersPage'
import { ProductsPage } from './pages/ProductsPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { NewInvoicePage } from './pages/NewInvoicePage'
import { SettingsPage } from './pages/SettingsPage'
import { PosPage } from './pages/PosPage'
import { TicketPage } from './pages/TicketPage'

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/check-email" element={<CheckEmailPage />} />
            <Route path="/email-confirmado" element={<EmailConfirmedPage />} />
            <Route path="/invitaciones/:token" element={<AcceptInvitationPage />} />
            <Route path="/terminos" element={<TermsPage />} />
            <Route path="/privacidad" element={<PrivacyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/login-callback" element={<AdminLoginCallbackPage />} />
            <Route element={<AdminProtectedRoute />}>
              <Route element={<AdminShell />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/plans" element={<AdminPlansPage />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/pos" element={<PosPage />} />
              <Route path="/invoices/:id/ticket" element={<TicketPage />} />
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/company" element={<CompanyPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/new" element={<NewInvoicePage />} />
                <Route path="/invoices/:id/edit" element={<NewInvoicePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  )
}

export default App

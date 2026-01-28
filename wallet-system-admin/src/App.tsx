import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { AdminLayout } from './layouts/AdminLayout';

// Pages
import { OverviewPage } from './pages/overview/OverviewPage';
import { LoginPage } from './pages/auth/LoginPage';
import { UsersPage } from './pages/users/UsersPage';
import { UserViewPage } from './pages/users/UserViewPage';
import { PlansPage } from './pages/plans/PlansPage';
import { PlanViewPage } from './pages/plans/PlanViewPage';
import { RechargesPage } from './pages/recharges/RechargesPage';
import { WithdrawalsPage } from './pages/withdrawals/WithdrawalsPage';
import { TicketsPage } from './pages/tickets/TicketsPage';
import { SettingsPage } from './pages/settings/SettingsPage';

// Referral Pages
import { ReferralWindowsPage } from './pages/referrals/ReferralWindowsPage';
import { RewardsPage } from './pages/referrals/RewardsPage';
import { FulfillmentsPage } from './pages/referrals/FulfillmentsPage';
import { FulfillmentDetailPage } from './pages/referrals/FulfillmentDetailPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserViewPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="plans/:id" element={<PlanViewPage />} />
            <Route path="recharges" element={<RechargesPage />} />
            <Route path="withdrawals" element={<WithdrawalsPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Referral Routes */}
            <Route path="referrals/windows" element={<ReferralWindowsPage />} />
            <Route path="referrals/rewards" element={<RewardsPage />} />
            <Route path="referrals/fulfillments" element={<FulfillmentsPage />} />
            <Route path="referrals/fulfillments/:id" element={<FulfillmentDetailPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import HeroNetwork from './components/layout/HeroNetwork';
import TrustBar from './components/sections/TrustBar';
import ValueGrid from './components/sections/ValueGrid';
import StatsSection from './components/sections/StatsSection';
import PlansPreview from './components/sections/PlansPreview';
import Footer from './components/layout/Footer';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import WithdrawVerification from './pages/WithdrawVerification';

// Dashboard Pages
import Overview from './pages/dashboard/Overview';
import MyIndexes from './pages/dashboard/MyIndexes';
import Plans from './pages/dashboard/Plans';
import Wallet from './pages/dashboard/Wallet';
import Settings from './pages/dashboard/Settings';
import Support from './pages/dashboard/Support';
import Referrals from './pages/dashboard/Referrals';
import Verification from './pages/dashboard/Verification';

// Public Pages
import Methodology from './pages/public/Methodology';
import Insights from './pages/public/Insights';
import BlogPost from './pages/public/BlogPost';
import Company from './pages/public/Company';
import LegalPage from './pages/public/LegalPage';
import PlatformPage from './pages/public/PlatformPage';
import Careers from './pages/public/Careers';
import Press from './pages/public/Press';
import Contact from './pages/public/Contact';
import PlansPage from './pages/public/PlansPage';

function PublicLayout({ children }) {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      {children}
      <Footer />
    </main>
  )
}

function LandingPage() {
  return (
    <PublicLayout>
      <HeroNetwork />
      <TrustBar />
      <StatsSection />
      <PlansPreview />
      <ValueGrid />
    </PublicLayout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1A1A1A', color: '#fff' } }} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Content Pages */}
        <Route path="/methodology" element={<PublicLayout><Methodology /></PublicLayout>} />
        <Route path="/insights" element={<PublicLayout><Insights /></PublicLayout>} />
        <Route path="/insights/:id" element={<PublicLayout><BlogPost /></PublicLayout>} />
        <Route path="/company" element={<PublicLayout><Company /></PublicLayout>} />
        <Route path="/careers" element={<PublicLayout><Careers /></PublicLayout>} />
        <Route path="/press" element={<PublicLayout><Press /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/plans" element={<PublicLayout><PlansPage /></PublicLayout>} />

        {/* Platform Feature Pages */}
        <Route path="/market-intelligence" element={<PublicLayout><PlatformPage type="marketIntelligence" /></PublicLayout>} />
        <Route path="/portfolio" element={<PublicLayout><PlatformPage type="portfolioConstruction" /></PublicLayout>} />
        <Route path="/risk-analysis" element={<PublicLayout><PlatformPage type="riskAnalysis" /></PublicLayout>} />

        {/* Legal Pages */}
        <Route path="/privacy" element={<PublicLayout><LegalPage type="privacy" /></PublicLayout>} />
        <Route path="/terms" element={<PublicLayout><LegalPage type="terms" /></PublicLayout>} />
        <Route path="/security" element={<PublicLayout><LegalPage type="security" /></PublicLayout>} />
        <Route path="/disclosures" element={<PublicLayout><LegalPage type="disclosures" /></PublicLayout>} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard/withdraw/verify" element={<WithdrawVerification />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Overview />} />
          <Route path="my-indexes" element={<MyIndexes />} />
          <Route path="plans" element={<Plans />} />
          <Route path="wallet" element={<Wallet />} />
          {/* Redirects/Fallbacks */}
          <Route path="settings" element={<Settings />} />
          <Route path="support" element={<Support />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="verification" element={<Verification />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PublicRoute from '../components/auth/PublicRoute';
import AppLayout from '../components/layouts/AppLayout';

// Lazy loading clinical pages for advanced bundle chunking and performance
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const PatientsPage = lazy(() => import('../pages/PatientsPage'));
const PatientRegistrationPage = lazy(() => import('../pages/PatientRegistrationPage'));
const SmartHealthCardPage = lazy(() => import('../pages/SmartHealthCardPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Role components
const DoctorDashboardPage = lazy(() => import('../pages/DoctorDashboardPage'));
const DoctorPrescriptionsPage = lazy(() => import('../pages/DoctorPrescriptionsPage'));
const OwnerDashboardPage = lazy(() => import('../pages/OwnerDashboardPage'));
const OwnerAnalyticsPage = lazy(() => import('../pages/OwnerAnalyticsPage'));
const ReceptionistDashboardPage = lazy(() => import('../pages/ReceptionistDashboardPage'));

// Patient components
const PatientDashboardPage = lazy(() => import('../pages/PatientDashboardPage'));
const PatientHealthCardPage = lazy(() => import('../pages/PatientHealthCardPage'));
const PatientTimelinePage = lazy(() => import('../pages/PatientTimelinePage'));
const PatientReportsPage = lazy(() => import('../pages/PatientReportsPage'));
const PatientPrescriptionsPage = lazy(() => import('../pages/PatientPrescriptionsPage'));
const PatientAppointmentsPage = lazy(() => import('../pages/PatientAppointmentsPage'));
const PatientAiPage = lazy(() => import('../pages/PatientAiPage'));

// High-fidelity medical skeleton fallbacks for page loading transitions
const PageSkeleton = () => (
  <div className="space-y-6 w-full animate-pulse p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-4 w-64 bg-white/5 rounded-md" />
      </div>
      <div className="h-10 w-32 bg-white/5 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-32 bg-white/5 rounded-2xl" />
      <div className="h-32 bg-white/5 rounded-2xl" />
      <div className="h-32 bg-white/5 rounded-2xl" />
    </div>
    <div className="h-64 bg-white/5 rounded-2xl" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Guest Routes: Doctor entry gateways */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Global Access Error / Status Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Protected Professional Workspace: Nested under AppLayout shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/patients/register" element={<PatientRegistrationPage />} />
            <Route path="/patient/:id" element={<SmartHealthCardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Doctor Workflow Specific Route Shields */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
              <Route path="/doctor/patients" element={<PatientsPage />} />
              <Route path="/doctor/prescriptions" element={<DoctorPrescriptionsPage />} />
            </Route>

            {/* Owner/Admin Operations Route Shields */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
              <Route path="/owner/analytics" element={<OwnerAnalyticsPage />} />
            </Route>

            {/* Receptionist Workspace Specific Route Shields */}
            <Route element={<ProtectedRoute allowedRoles={['receptionist', 'admin']} />}>
              <Route path="/receptionist/dashboard" element={<ReceptionistDashboardPage />} />
            </Route>

            {/* Patient Workspace Specific Route Shields */}
            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
              <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
              <Route path="/patient/card" element={<PatientHealthCardPage />} />
              <Route path="/patient/timeline" element={<PatientTimelinePage />} />
              <Route path="/patient/reports" element={<PatientReportsPage />} />
              <Route path="/patient/prescriptions" element={<PatientPrescriptionsPage />} />
              <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
              <Route path="/patient/ai" element={<PatientAiPage />} />
            </Route>
          </Route>
        </Route>

        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

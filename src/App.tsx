import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { ProtectedRoute } from './components/common/ProtectedRoute.js';

import { LandingPage } from './pages/LandingPage.js';
import { ResourcesPage } from './pages/ResourcesPage.js';
import { ResourceDetailPage } from './pages/ResourceDetailPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { EmergencyHotlinePage } from './pages/EmergencyHotlinePage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AccessDeniedPage } from './pages/AccessDeniedPage.js';

// Role-specific dashboards
import { ProviderDashboard } from './pages/dashboards/ProviderDashboard.js';
import { SeekerDashboard } from './pages/dashboards/SeekerDashboard.js';
import { OrganizationDashboard } from './pages/dashboards/OrganizationDashboard.js';
import { VolunteerDashboard } from './pages/dashboards/VolunteerDashboard.js';
import { AdminDashboard } from './pages/dashboards/AdminDashboard.js';
import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard.js';

export function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/resources/:id" element={<ResourceDetailPage />} />
                <Route path="/hotlines" element={<EmergencyHotlinePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/access-denied" element={<AccessDeniedPage />} />

                {/* Common Authenticated Routes */}
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Server-Enforced Role-Specific Dashboards */}
                <Route
                  path="/dashboard/provider"
                  element={
                    <ProtectedRoute allowedRoles={['provider', 'admin']}>
                      <ProviderDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/seeker"
                  element={
                    <ProtectedRoute allowedRoles={['seeker', 'admin']}>
                      <SeekerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/organization"
                  element={
                    <ProtectedRoute allowedRoles={['organization', 'admin']}>
                      <OrganizationDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/volunteer"
                  element={
                    <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                      <VolunteerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/super-admin"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <SuperAdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './components/dashboard';
import OverviewDashboardPage from './pages/OverviewDashboardPage';
import SubjectListPage from './pages/SubjectListPage';
import SubjectEnrollPage from './pages/SubjectEnrollPage';
import SubjectDetailPage from './pages/SubjectDetailPage';
import DrugPage from './pages/DrugPage';
import UpdateSiteInventoryPage from './pages/drug/UpdateSiteInventoryPage';
import RegisterDrugShipmentPage from './pages/drug/RegisterDrugShipmentPage';
import SubjectAccountabilityPage from './pages/drug/SubjectAccountabilityPage';
import SiteInventoryAccountabilityPage from './pages/drug/SiteInventoryAccountabilityPage';
import OnSiteDestructionPage from './pages/drug/OnSiteDestructionPage';
import ShipmentForDestructionPage from './pages/drug/ShipmentForDestructionPage';
import DispenseDrugPage from './pages/drug/DispenseDrugPage';
import MasterAccountabilityLogPage from './pages/drug/MasterAccountabilityLogPage';
import ReportsPage from './pages/ReportsPage';
import ChangesPage from './pages/ChangesPage';
import AdminPage from './pages/AdminPage';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';

// Protected Route Component with Layout
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/overview"
            element={
              <ProtectedRoute>
                <OverviewDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Subject Routes */}
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <SubjectListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/new"
            element={
              <ProtectedRoute>
                <SubjectEnrollPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:id"
            element={
              <ProtectedRoute>
                <SubjectDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Drug Routes */}
          <Route
            path="/drug"
            element={
              <ProtectedRoute>
                <DrugPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drug/update-site-inventory"
            element={
              <ProtectedRoute>
                <UpdateSiteInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drug/register-shipment"
            element={
              <ProtectedRoute>
                <RegisterDrugShipmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drug/subject-accountability"
            element={
              <ProtectedRoute>
                <SubjectAccountabilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drug/dispense"
            element={
              <ProtectedRoute>
                <DispenseDrugPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drug/site-inventory-accountability"
            element={
              <ProtectedRoute>
                <SiteInventoryAccountabilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drug/on-site-destruction"
            element={
              <ProtectedRoute>
                <OnSiteDestructionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drug/shipment-for-destruction"
            element={
              <ProtectedRoute>
                <ShipmentForDestructionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drug/master-log"
            element={
              <ProtectedRoute>
                <MasterAccountabilityLogPage />
              </ProtectedRoute>
            }
          />

          {/* Reports Route */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Changes Route */}
          <Route
            path="/changes"
            element={
              <ProtectedRoute>
                <ChangesPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

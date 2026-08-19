import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoginPage } from './pages/auth/LoginPage';
import { MainLayout } from './components/layout/MainLayout';

// Dashboards
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';

// Employee Views
import { MyLeavesPage } from './pages/employee/MyLeavesPage';
import { LeaveBalancesPage } from './pages/employee/LeaveBalancesPage';
import { ProfilePage } from './pages/employee/ProfilePage';

// Manager Views
import { PendingApprovalsPage } from './pages/manager/PendingApprovalsPage';
import { TeamMembersPage } from './pages/manager/TeamMembersPage';

// Admin Views
import { EmployeesManagementPage } from './pages/admin/EmployeesManagementPage';
import { DepartmentsManagementPage } from './pages/admin/DepartmentsManagementPage';
import { LeaveTypesManagementPage } from './pages/admin/LeaveTypesManagementPage';
import { LeaveBalancesManagementPage } from './pages/admin/LeaveBalancesManagementPage';
import { AllLeaveRequestsPage } from './pages/admin/AllLeaveRequestsPage';
import { HolidayManagementPage } from './pages/admin/HolidayManagementPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage';
import { CompanyCalendarPage } from './pages/calendar/CompanyCalendarPage';
import { ApplyLeaveModal } from './components/leave/ApplyLeaveModal';

function AppContent() {
  const { user, isAuthenticated, isLoading, isAdmin, isHR, isManager } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-400 tracking-wider uppercase">Loading LeaveEase...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const handleNavigate = (page: string) => {
    if (page === 'apply-leave') {
      setIsApplyModalOpen(true);
      return;
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        if (isAdmin || isHR) {
          return <AdminDashboard onNavigate={handleNavigate} />;
        }
        if (isManager) {
          return (
            <ManagerDashboard
              onNavigate={handleNavigate}
              onApplyLeaveClick={() => setIsApplyModalOpen(true)}
            />
          );
        }
        return (
          <EmployeeDashboard
            onNavigate={handleNavigate}
            onApplyLeaveClick={() => setIsApplyModalOpen(true)}
          />
        );

      case 'my-leaves':
        return <MyLeavesPage onApplyLeaveClick={() => setIsApplyModalOpen(true)} />;

      case 'leave-balances':
        return <LeaveBalancesPage onApplyLeaveClick={() => setIsApplyModalOpen(true)} />;

      case 'calendar':
        return <CompanyCalendarPage />;

      case 'approvals':
        return <PendingApprovalsPage />;

      case 'team-members':
        return <TeamMembersPage />;

      case 'employees':
        return <EmployeesManagementPage />;

      case 'departments':
        return <DepartmentsManagementPage />;

      case 'leave-types':
        return <LeaveTypesManagementPage />;

      case 'all-balances':
        return <LeaveBalancesManagementPage />;

      case 'all-requests':
        return <AllLeaveRequestsPage />;

      case 'holidays':
        return <HolidayManagementPage />;

      case 'reports':
        return <ReportsPage />;

      case 'audit-logs':
        return <AuditLogsPage />;

      case 'settings':
        return <SystemSettingsPage />;

      case 'profile':
        return <ProfilePage />;

      default:
        return <AdminDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}

      {/* Quick Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          setIsApplyModalOpen(false);
          // Auto route to my-leaves if applied
          setCurrentPage('my-leaves');
        }}
      />
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

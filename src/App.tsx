/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/ToastContainer';

// Pages
import { DashboardPage } from './components/pages/DashboardPage';
import { SyllabusNotesPage } from './components/pages/SyllabusNotesPage';
import { QuestionBankPage } from './components/pages/QuestionBankPage';
import { CrashPlannerPage } from './components/pages/CrashPlannerPage';
import { CopyCheckingPage } from './components/pages/CopyCheckingPage';
import { MockInterviewPage } from './components/pages/MockInterviewPage';
import { TasksPage } from './components/pages/TasksPage';
import { CalendarPage } from './components/pages/CalendarPage';
import { GoalsHabitsPage } from './components/pages/GoalsHabitsPage';
import { ProjectsPage } from './components/pages/ProjectsPage';
import { NotificationsPage } from './components/pages/NotificationsPage';
import { SettingsPage } from './components/pages/SettingsPage';

// Modals
import { TaskModal } from './components/modals/TaskModal';
import { GoalModal } from './components/modals/GoalModal';
import { ProjectModal } from './components/modals/ProjectModal';

const AppContent: React.FC = () => {
  const { activePage, sidebarCollapsed } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'syllabus':
        return <SyllabusNotesPage />;
      case 'questions':
        return <QuestionBankPage />;
      case 'planner':
        return <CrashPlannerPage />;
      case 'tests':
        return <CopyCheckingPage />;
      case 'interviews':
        return <MockInterviewPage />;
      case 'tasks':
        return <TasksPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'goals':
        return <GoalsHabitsPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <SettingsPage />;
      // Safe redirects for retired routes
      case 'documents':
        return <SyllabusNotesPage />;
      case 'student':
      case 'analytics':
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-shell min-h-screen bg-[#F4F8FC] dark:bg-[#111827] text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Workspace Frame */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[260px]'
        }`}
      >
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="app-main flex-1 p-4 md:px-8 md:py-7">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <TaskModal />
      <GoalModal />
      <ProjectModal />

      {/* Notification Toast Stack */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

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
import { AIPlannerPage } from './components/pages/AIPlannerPage';
import { TasksPage } from './components/pages/TasksPage';
import { CalendarPage } from './components/pages/CalendarPage';
import { GoalsHabitsPage } from './components/pages/GoalsHabitsPage';
import { ProjectsPage } from './components/pages/ProjectsPage';
import { StudentCenterPage } from './components/pages/StudentCenterPage';
import { DocumentsPage } from './components/pages/DocumentsPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { SettingsPage } from './components/pages/SettingsPage';

// Modals
import { TaskModal } from './components/modals/TaskModal';
import { GoalModal } from './components/modals/GoalModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { NoteModal } from './components/modals/NoteModal';

const AppContent: React.FC = () => {
  const { activePage, sidebarCollapsed } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'planner':
        return <AIPlannerPage />;
      case 'tasks':
        return <TasksPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'goals':
        return <GoalsHabitsPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'student':
        return <StudentCenterPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
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
      <NoteModal />

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

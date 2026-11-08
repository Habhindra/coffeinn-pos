import React, { useState } from 'react';
import { PinLogin } from './components/PinLogin';
import { PosLayout } from './components/PosLayout';
import { OwnerDashboard } from './components/OwnerDashboard';
import { MenuManagement } from './components/MenuManagement';
import { ExpenseDashboard } from './components/ExpenseDashboard';

interface User {
  id: string;
  name: string;
  role: string;
}

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'POS' | 'OWNER_DASHBOARD' | 'MENU_MANAGEMENT' | 'EXPENSES'>('POS');

  if (!currentUser) {
    return <PinLogin onSuccess={(user) => setCurrentUser(user)} />;
  }

  if (currentView === 'OWNER_DASHBOARD' && currentUser.role === 'OWNER') {
    return (
      <OwnerDashboard
        onBackToPos={() => setCurrentView('POS')}
        onOpenMenuManagement={() => setCurrentView('MENU_MANAGEMENT')}
        onOpenExpenses={() => setCurrentView('EXPENSES')}
      />
    );
  }

  if (currentView === 'MENU_MANAGEMENT' && currentUser.role === 'OWNER') {
    return <MenuManagement onBackToDashboard={() => setCurrentView('OWNER_DASHBOARD')} />;
  }

  if (currentView === 'EXPENSES' && currentUser.role === 'OWNER') {
    return <ExpenseDashboard onBackToDashboard={() => setCurrentView('OWNER_DASHBOARD')} />;
  }

  return (
    <PosLayout
      currentUser={currentUser}
      onLogout={() => {
        setCurrentUser(null);
        setCurrentView('POS');
      }}
      onOpenDashboard={() => setCurrentView('OWNER_DASHBOARD')}
    />
  );
}

export default App;
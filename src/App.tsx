import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { FarmerApp } from './components/farmer/FarmerApp';
import { CenterDashboard } from './components/staff/CenterDashboard';
import { SMSPanel } from './components/sms/SMSPanel';
import { AdminAnalytics } from './components/admin/AdminAnalytics';
import { SMSNotificationToast } from './components/sms/SMSNotificationToast';

const MainContent: React.FC = () => {
  const { role } = useApp();

  return (
    <main className="min-h-screen bg-stone-100/70 pb-16 font-sans text-stone-900 antialiased selection:bg-emerald-200">
      <Header />
      
      {role === 'farmer' && <FarmerApp />}
      {role === 'staff' && <CenterDashboard />}
      {role === 'sms' && <SMSPanel />}
      {role === 'admin' && <AdminAnalytics />}

      {/* Global Live SMS Broadcast Toast */}
      <SMSNotificationToast />
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

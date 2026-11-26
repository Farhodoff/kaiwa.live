import React, { useState } from 'react';
import { useStudyData } from '../context/StudyPlannerContext';
import { useLanguage } from '../context/LanguageContext';
import { requestNotificationPermission } from '../utils/notifications';
import PreferencesSection from '../components/settings/PreferencesSection';
import AccountSection from '../components/settings/AccountSection';
import { User, Sliders, Shield, Send } from 'lucide-react';
import { isUserAdmin } from '../utils/admin';
import { toast } from '../hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

import AdminDashboardPage from './AdminDashboardPage';
import TelegramSection from '../components/settings/TelegramSection';
import { useSettingsStore } from '../stores';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const { user } = useStudyData();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('preferences');

  const isCurrentAdmin = isUserAdmin(user);

  const tabs = [
    {
      id: 'preferences',
      label: language === 'ja' ? '一般' : language === 'en' ? 'General' : 'Umumiy',
      icon: Sliders,
    },
    {
      id: 'profile',
      label: language === 'ja' ? 'プロフィール' : language === 'en' ? 'Profile' : 'Profil',
      icon: User,
    },
    { id: 'telegram', label: 'Telegram', icon: Send },
  ];

  // Admin bo'lsa Admin tab qo'shamiz
  if (isCurrentAdmin) {
    tabs.push({
      id: 'admin',
      label: language === 'ja' ? '管理者パネル' : 'Admin Panel',
      icon: Shield,
    });
  }

  const toggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        updateSettings({ notificationsEnabled: true });
        toast({
          title: language === 'ja' ? '🔔 通知が有効になりました' : '🔔 Bildirishnomalar yoqildi',
        });
      } else {
        toast({
          variant: 'destructive',
          title: language === 'ja' ? '❌ 許可が拒否されました' : '❌ Ruxsat rad etildi',
        });
      }
    } else {
      updateSettings({ notificationsEnabled: false });
      toast({
        title: language === 'ja' ? '🔕 通知が無効になりました' : "🔕 Bildirishnomalar o'chirildi",
      });
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-5xl space-y-8 p-4 pb-28 duration-300 animate-in fade-in md:p-8 md:pb-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {language === 'ja' ? '設定' : language === 'en' ? 'Settings' : 'Sozlamalar'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {language === 'ja'
            ? '言語、表示、アカウントを管理します。'
            : language === 'en'
              ? 'Manage your language, appearance and account.'
              : 'Til, ko‘rinish va hisobingizni boshqaring.'}
        </p>
      </header>

      {/* Navigation Tabs (Horizontal Scrollable Pills) */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card/90 p-1.5 shadow-xs backdrop-blur-md">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-11 select-none items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents with Framer Motion Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="mt-6"
        >
          {activeTab === 'profile' && <AccountSection />}

          {activeTab === 'telegram' && <TelegramSection />}

          {activeTab === 'preferences' && (
            <PreferencesSection settings={settings} onToggleNotifications={toggleNotifications} />
          )}

          {activeTab === 'admin' && isCurrentAdmin && <AdminDashboardPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;

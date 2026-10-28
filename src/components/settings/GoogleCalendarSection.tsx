import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, ExternalLink, RefreshCw, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useStudyData } from '../../context/StudyPlannerContext';
import { toast } from '../../hooks/use-toast';

const GoogleCalendarSection: React.FC = () => {
  const { syncGoogleEvents, tasks, events } = useStudyData();
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.provider_token) {
      setIsConnected(true);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncGoogleEvents();
      toast({
        title: '📅 Kalendar Yangilandi',
        description: "Google Calendar ma'lumotlari muvaffaqiyatli sinxronizatsiya qilindi.",
      });
    } catch (error) {
      console.error('Manual sync error:', error);
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Google Calendar bilan sinxronizatsiyada xatolik yuz berdi.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events',
          redirectTo: window.location.origin + '/settings',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('OAuth redirect notice:', err);
      toast({
        title: 'Google OAuth',
        description: 'Google hisobingiz orqali tizimga kiring.',
      });
    }
  };

  const handleExportIcs = () => {
    try {
      const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//kaiwa.live//UZ',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:kaiwa.live Calendar',
        'X-WR-TIMEZONE:Asia/Tashkent',
      ];

      const allItems = [
        ...tasks
          .filter((t) => t.dueDate)
          .map((t) => ({
            title: t.title,
            description: `kaiwa.live vazifasi (Muhimlik: ${t.priority || "o'rta"})`,
            date: new Date(t.dueDate!),
          })),
        ...(events || []).map((e) => ({
          title: e.title,
          description: e.description || 'Dars jadvali tadbiri',
          date: new Date(e.eventDate),
        })),
      ];

      if (allItems.length === 0) {
        toast({
          title: "Tadbirlar yo'q",
          description: 'Eksport qilish uchun avval vazifa yoki dars jadvali yarating.',
        });
        return;
      }

      allItems.forEach((item, idx) => {
        const startStr = item.date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = new Date(item.date.getTime() + 60 * 60 * 1000);
        const endStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:task-${idx}-${Date.now()}@studyplanner.app`,
          `DTSTAMP:${now}`,
          `DTSTART:${startStr}`,
          `DTEND:${endStr}`,
          `SUMMARY:${item.title.replace(/\n/g, ' ')}`,
          `DESCRIPTION:${item.description.replace(/\n/g, ' ')}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
        );
      });

      icsContent.push('END:VCALENDAR');
      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_planner_schedule_${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: '📥 iCalendar Fayli Yuklandi!',
        description:
          'Ushbu .ics faylni Google Calendar yoki Apple iCal ilovangizga import qilishingiz mumkin.',
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: "iCal faylini yaratishda xato bo'ldi.",
      });
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <Calendar size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Google & iCalendar Sinxronizatsiyasi
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Real Sync
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dars jadvali va vazifalarni Google yoki iCal kalendarlariga o'tkazing
            </p>
          </div>
        </div>
        {isConnected && (
          <span className="flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle size={14} /> Bog'langan
          </span>
        )}
      </div>

      <div className="space-y-4">
        {isConnected ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-900/50 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <RefreshCw
                  size={16}
                  className={`text-blue-500 ${isSyncing ? 'animate-spin' : ''}`}
                />
                Avtomatik sinxronizatsiya faol
              </span>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                {isSyncing ? 'Yangilanmoqda...' : 'Sinxronizatsiya'}
              </button>
            </div>
            <Button
              variant="secondary"
              className="flex w-full items-center justify-center gap-2"
              onClick={() => window.open('https://calendar.google.com', '_blank')}
            >
              <ExternalLink size={18} />
              Google Calendar'ni ochish
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Vazifalar, dars jadvallari va imtihon sanalarini to'g'ridan-to'g'ri kalendaringizga
              yuklab oling yoki Google orqali bog'lang:
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={handleExportIcs}
                variant="secondary"
                className="flex w-full items-center justify-center gap-2 border-indigo-200 py-2.5 text-xs dark:border-indigo-800"
              >
                <Download size={15} className="text-indigo-600 dark:text-indigo-400" />
                iCalendar (.ics) Yuklab Olish
              </Button>

              <Button
                onClick={handleConnectGoogle}
                className="flex w-full items-center justify-center gap-2 border border-gray-200 bg-white py-2.5 text-xs text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="h-3.5 w-3.5"
                />
                Google bilan Bog'lash
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarSection;

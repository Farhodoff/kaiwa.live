import React, { useState, useEffect } from 'react';
import { Bell, X, Sparkles } from 'lucide-react';
import { PushNotificationService } from '../../services/PushNotificationService';

export const PushNotificationPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isGranted, setIsGranted] = useState(false);

  useEffect(() => {
    if (!PushNotificationService.isSupported()) return;

    const perm = PushNotificationService.getPermission();
    if (perm === 'granted') {
      setIsGranted(true);
      setIsVisible(false);
    } else if (perm === 'default') {
      const hasDismissed = localStorage.getItem('study_planner_push_prompt_dismissed');
      if (!hasDismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleEnablePermission = async () => {
    const perm = await PushNotificationService.requestPermission();
    if (perm === 'granted') {
      setIsGranted(true);
      setIsVisible(false);
      PushNotificationService.sendTestNotification();
    } else {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('study_planner_push_prompt_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || isGranted) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 duration-300 animate-in slide-in-from-bottom-5 md:left-auto md:right-6 md:max-w-md">
      <div className="relative flex flex-col space-y-3 overflow-hidden rounded-3xl border border-primary/30 bg-card p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
              <Bell size={22} className="animate-bounce" />
            </div>
            <div>
              <h4 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
                Bildirishnomalarni Yoqasizmi? 🔔
              </h4>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Dars jadvalingiz, imtihonlar hamda kunlik zanjir (Streak) eslatmalarini
                qurilmangizda oling!
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={handleDismiss}
            className="px-3.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            Keyinroq
          </button>
          <button
            onClick={handleEnablePermission}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
          >
            <Sparkles size={14} />
            <span>Ruxsat Berish 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};

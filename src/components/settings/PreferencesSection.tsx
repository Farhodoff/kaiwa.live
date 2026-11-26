import { Bell, GraduationCap, Sun, Moon } from 'lucide-react';
import { PushNotificationService } from '../../services/PushNotificationService';
import { useStudyData } from '../../context/StudyPlannerContext';
import { toast } from '../../hooks/use-toast';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import InterfaceLanguageSelect from './InterfaceLanguageSelect';
import AIProviderSection from './AIProviderSection';

import { isSuperAdmin } from '../../utils/admin';

interface Settings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  showFurigana?: boolean;
  showRomaji?: boolean;
}

interface PreferencesSectionProps {
  settings: Settings;
  onToggleNotifications: () => void;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  settings,
  onToggleNotifications,
}) => {
  const { language } = useLanguage();
  const { isDark, setTheme } = useTheme();
  const { user, targetLevel, targetGoal, setPrimaryFocus } = useStudyData();

  const isSuper = Boolean(user?.email && isSuperAdmin(user.email));

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-card p-6 duration-200 animate-in fade-in md:p-8">
      {/* AI Provider & Engine Status (Super Admin Only) */}
      {isSuper && <AIProviderSection />}

      {/* App Interface Language & Notifications */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          {language === 'ja'
            ? '言語と表示'
            : language === 'en'
              ? 'Language and appearance'
              : 'Til va ko‘rinish'}
        </h2>

        <div className="rounded-xl border border-border bg-background/50 p-4">
          <InterfaceLanguageSelect />
        </div>

        {/* Theme Switcher Card */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-background/50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 text-lg text-primary">
              {isDark ? (
                <Moon size={20} className="text-indigo-400" />
              ) : (
                <Sun size={20} className="text-amber-500" />
              )}
            </div>
            <div>
              <span className="block text-sm font-semibold text-foreground">
                {language === 'uz' ? 'Ko‘rinish' : language === 'ja' ? 'テーマ' : 'Theme'}
              </span>
              <span className="text-xs text-muted-foreground">
                {language === 'uz'
                  ? 'Och yoki qora rejimni tanlang'
                  : language === 'ja'
                    ? 'ライト・ダークモードを選択'
                    : 'Choose light or dark mode'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={isDark}
              onClick={() => {
                setTheme('dark');
                toast({
                  title:
                    language === 'ja'
                      ? '墨絵ダークモードに設定しました'
                      : "Qorong'u rejim (Sumi-e) tanlandi",
                });
              }}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                isDark
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <Moon size={14} className={isDark ? 'text-white' : 'text-indigo-400'} />
              <span>{language === 'ja' ? 'ダーク' : language === 'en' ? 'Dark' : 'Qora'}</span>
            </button>
            <button
              type="button"
              aria-pressed={!isDark}
              onClick={() => {
                setTheme('light');
                toast({
                  title:
                    language === 'ja'
                      ? '和紙ライトモードに設定しました'
                      : "Yorug' rejim (Washi) tanlandi",
                });
              }}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                !isDark
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <Sun size={14} className={!isDark ? 'text-white' : 'text-amber-500'} />
              <span>{language === 'ja' ? 'ライト' : language === 'en' ? 'Light' : 'Och'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-background/50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2.5 text-orange-500">
              <Bell size={20} />
            </div>
            <div>
              <span className="block text-sm font-semibold text-foreground">
                Brauzer Bildirishnomalari
              </span>
              <span className="text-xs text-muted-foreground">
                Dars va Streak eslatmalarini qurilmada olish
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {settings.notificationsEnabled && (
              <button
                onClick={async () => {
                  const ok = await PushNotificationService.sendTestNotification();
                  if (ok) {
                    toast({ title: '🔔 Sinov bildirishnomasi yuborildi!' });
                  } else {
                    toast({ title: "Xatolik yoki ruxsat yo'q", variant: 'destructive' });
                  }
                }}
                className="min-h-11 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Sinab ko'rish
              </button>
            )}
            <label className="relative inline-flex min-h-11 cursor-pointer items-center">
              <input
                type="checkbox"
                aria-label="Brauzer bildirishnomalari"
                checked={settings.notificationsEnabled}
                onChange={onToggleNotifications}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[12px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"></div>
            </label>
          </div>
        </div>
      </div>
      {/* Dedicated Learning Focus & Languages Manager */}
      <div id="learning-focus" className="space-y-6 border-t border-border pt-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <GraduationCap size={20} className="text-muted-foreground" />
              O‘quv maqsadi
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">JLPT darajangizni tanlang.</p>
          </div>
        </div>

        {/* Primary & Additional Languages List */}
        <div className="space-y-4">
          {/* 1. PRIMARY LANGUAGE CARD */}
          <div className="rounded-2xl border border-l-4 border-border border-l-primary bg-card/60 p-5 transition-all">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-border bg-background/90 p-2.5 text-4xl shadow-xs">
                  🇯🇵
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-black text-foreground">Yapon Tili (JLPT)</span>
                    <span className="badge-gold text-[10px] font-bold">★ ASOSIY FOKUS</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Maqsad: <strong className="text-foreground">{targetLevel}</strong> •{' '}
                    {targetGoal}
                  </div>
                </div>
              </div>

              {/* Level Quick Select */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <label
                  htmlFor="settings-target-level"
                  className="text-xs font-bold text-muted-foreground"
                >
                  Daraja:
                </label>
                <select
                  id="settings-target-level"
                  value={targetLevel}
                  onChange={(e) => setPrimaryFocus('ja', e.target.value, targetGoal)}
                  className="outline-hidden min-h-11 max-w-full rounded-xl border border-input bg-background px-3 py-2 text-base font-bold text-foreground focus:ring-2 focus:ring-primary sm:text-sm"
                >
                  <option value="N5">JLPT N5 (Boshlang'ich)</option>
                  <option value="N4">JLPT N4</option>
                  <option value="N3">JLPT N3 (O'rta)</option>
                  <option value="N2">JLPT N2 (Biznes)</option>
                  <option value="N1">JLPT N1 (Yuqori)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection;

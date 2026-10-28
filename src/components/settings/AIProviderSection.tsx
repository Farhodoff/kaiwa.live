import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

const AIProviderSection: React.FC = () => {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-700 dark:bg-[#1f2937]">
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          <ShieldCheck size={28} />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              <Cpu size={18} className="text-indigo-600 dark:text-indigo-400" />
              kaiwa.live Engine
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              DeepSeek V3 & R1 Powered · Avtomatlashtirilgan
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            Barcha AI xizmatlari (Shaxsiy Reja, Speaking Coach, Lug‘at va Tahlillar) kaiwa.live
            markaziy serveri orqali xavfsiz va barqaror ishlaydi.
          </p>
          <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span>AI Xizmati Faol va Ulanishga Tayyor</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIProviderSection;

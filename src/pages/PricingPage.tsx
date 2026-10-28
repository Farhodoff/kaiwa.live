import React from 'react';
import {
  ArrowRight,
  Sparkles,
  Heart,
  ShieldCheck,
  BookOpen,
  Mic,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';
import { useStudyData } from '../context/StudyPlannerContext';
import { AppLogo } from '../components/AppLogo';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStudyData();

  useSEO({
    title: 'Barcha Imkoniyatlar Bepul — kaiwa.live',
    description:
      "kaiwa.live barcha o'quvchilar uchun 100% bepul. Speaking Coach va JLPT darslari erkin ochiq.",
    canonical: '/pricing',
  });

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background p-4 text-foreground md:p-8">
      {/* Top Navigation Bar */}
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between py-4">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <AppLogo size="md" />
        </div>
        <button
          onClick={() => navigate(user ? '/jlpt' : '/login')}
          className="cursor-pointer rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-all hover:bg-muted"
        >
          {user ? 'Platformaga kirish' : 'Kirish'}
        </button>
      </div>

      {/* Main Free Showcase Card */}
      <div className="flex flex-1 items-center justify-center py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-2xl space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-6 text-center shadow-2xl sm:p-10"
        >
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10">
            <Sparkles size={32} />
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-black text-emerald-500 shadow-xs">
              <Heart size={13} className="fill-emerald-500" /> 100% BEPUL VA OCHIQ TA'LIM
            </span>
            <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-4xl">
              Hech Qanday To'lov yoki Narxlar Yo'q
            </h1>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              kaiwa.live har bir foydalanuvchi uchun mutlaqo bepul. Pullik obunalar, cheklovlar yoki
              yashirin to'lovlar mavjud emas — barcha imkoniyatlar erkin ochiq.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 text-left sm:grid-cols-3">
            <div className="space-y-1.5 rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Mic size={16} className="text-primary" />
                <span>AI Speaking Coach</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Cheksiz jonli ovozli suhbatlar va grammatik tahrirlar
              </p>
              <span className="inline-block text-[10px] font-bold text-emerald-500">
                Bepul · Cheklovlarsiz
              </span>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <BookOpen size={16} className="text-cyan-500" />
                <span>JLPT N5–N1</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Grammatika, kanji va audiolardan iborat barcha darajalar
              </p>
              <span className="inline-block text-[10px] font-bold text-emerald-500">
                Bepul · Cheklovlarsiz
              </span>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <ShieldCheck size={16} className="text-amber-500" />
                <span>Anki SRS Fleshkartalar</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                SM-2 algoritmi asosida intervalli takrorlash va so'z boyligi
              </p>
              <span className="inline-block text-[10px] font-bold text-emerald-500">
                Bepul · Cheklovlarsiz
              </span>
            </div>
          </div>

          {/* Features list */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" /> Karta kiritish talab etilmaydi
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" /> Reklamalarsiz toza interfeys
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" /> Doimiy bepul ta'lim
            </span>
          </div>

          <div className="pt-4">
            <Button
              size="lg"
              onClick={() => navigate(user ? '/jlpt' : '/register')}
              className="mx-auto flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] hover:bg-primary/90 active:scale-95 sm:w-auto"
            >
              <span>{user ? "Darslarga O'tish" : 'Hoziroq Bepul Boshlang'}</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Simple footer */}
      <div className="mx-auto w-full max-w-4xl py-4 text-center text-xs text-muted-foreground">
        © 2026 kaiwa.live · Barcha o'quvchilar uchun 100% bepul
      </div>
    </div>
  );
};

export default PricingPage;

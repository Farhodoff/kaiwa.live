import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  CheckSquare,
  Calendar,
  BookOpen,
  Copy,
  GraduationCap,
  Mic,
  Clock,
  Settings,
  ArrowRight,
  X,
  Compass,
  Languages,
  Code2,
  BarChart3,
  Users,
  PenTool,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
  icon: React.ComponentType<any>;
  keywords: string[];
}

const COMMANDS: CommandItem[] = [
  // Boshqaruv
  {
    id: 'plan',
    title: "O'quv Rejasi & Roadmap 🎯",
    description: "Shaxsiy o'rganish yo'l xaritasi",
    category: 'Boshqaruv',
    path: '/personal-plan',
    icon: CheckSquare,
    keywords: ['plan', 'maqsad', 'reja', 'roadmap'],
  },
  {
    id: 'progress',
    title: "O'quv Statistikasi & Progress 📊",
    description: 'Haftalik faoliyat, heatmap va tahlillar',
    category: 'Boshqaruv',
    path: '/progress',
    icon: BarChart3,
    keywords: ['progress', 'statistika', 'analitika', 'heatmap', 'grafik', 'tahlil'],
  },
  {
    id: 'calendar',
    title: "O'quv Kalendari",
    description: 'Dars jadvali va voqealar',
    category: 'Boshqaruv',
    path: '/calendar',
    icon: Calendar,
    keywords: ['jadval', 'timetable', 'events', 'kun'],
  },
  {
    id: 'subjects',
    title: 'Fanlar & Kurslar',
    description: 'Fanlar va darsliklar boshqaruvi',
    category: 'Boshqaruv',
    path: '/subjects',
    icon: BookOpen,
    keywords: ['fan', 'dars', 'subjects', 'kurslar'],
  },

  // Fleshkartalar & Lug'at
  {
    id: 'flashcards',
    title: 'Fleshkartalar (Decks)',
    description: "To'plamlar, albomlar va SRS takrorlash",
    category: "Fleshkartalar & Lug'at",
    path: '/flashcards',
    icon: Copy,
    keywords: ['cards', 'lugat', 'kartochkalar', 'anki', 'srs', 'takrorlash'],
  },
  {
    id: 'vocabulary',
    title: "Lug'at Boyligi 📖",
    description: "So'z boyligini kengaytirish",
    category: "Fleshkartalar & Lug'at",
    path: '/vocabulary',
    icon: Languages,
    keywords: ['sozlar', 'vocabulary', 'words', 'lugat'],
  },

  // Til & Imtihonlar
  {
    id: 'jlpt',
    title: 'JLPT Hub 🎌',
    description: 'Yapon tili N5-N1 imtihon va darslari',
    category: 'Til & Imtihonlar',
    path: '/jlpt',
    icon: GraduationCap,
    keywords: ['yapon', 'japanese', 'n5', 'n4', 'n3', 'n2', 'n1', 'kanji'],
  },
  {
    id: 'speaking',
    title: 'AI Speaking Coach 🗣️',
    description: 'Jonli ovozli suhbat mashqi',
    category: 'Til & Imtihonlar',
    path: '/speaking-coach',
    icon: Mic,
    keywords: ['speaking', 'gaplashish', 'audio', 'suhbat'],
  },
  {
    id: 'scenarios',
    title: 'Real Scenarios 🧭',
    description: 'Hayotiy dialoglar va vaziyatlar',
    category: 'Til & Imtihonlar',
    path: '/scenarios',
    icon: Compass,
    keywords: ['dialog', 'suhbat', 'restoran', 'aeroport'],
  },
  {
    id: 'sakubun',
    title: 'JLPT Sakubun (Yaponcha Insho) 📝',
    description: 'Yapon tilida insho yozish va AI baholash',
    category: 'Til & Imtihonlar',
    path: '/jlpt-writing',
    icon: PenTool,
    keywords: ['sakubun', 'insho', 'writing', 'essay', 'yozish', 'mojisuu'],
  },

  // Fokus
  {
    id: 'focus',
    title: 'Fokus Taymer (Pomodoro) ⏱️',
    description: 'Diqqatni jamlash va tanaffus',
    category: 'Fokus',
    path: '/focus',
    icon: Clock,
    keywords: ['pomodoro', 'timer', 'vaqt', 'diqqat'],
  },
  {
    id: 'study-room',
    title: "Jonli O'quv Xonasi (Study Room) 📚",
    description: "Do'stlar bilan birga video/audio o'rganish va oq doska",
    category: 'Fokus',
    path: '/room/library',
    icon: Users,
    keywords: ['room', 'xona', 'study', 'webrtc', 'doska', 'whiteboard', 'video', 'kutubxona'],
  },
  {
    id: 'developers',
    title: 'Dasturchilar & Ochiq API 💻',
    description: 'Tashqi loyihalar uchun REST API va SDK',
    category: 'Boshqaruv',
    path: '/developers',
    icon: Code2,
    keywords: ['api', 'sdk', 'developer', 'dasturchi', 'rest', 'curl', 'token'],
  },
  {
    id: 'settings',
    title: 'Sozlamalar & Profil ⚙️',
    description: 'Profil, maqsadlar va interfeys',
    category: 'Boshqaruv',
    path: '/settings',
    icon: Settings,
    keywords: ['profile', 'theme', 'api', 'sozlash', 'maqsad', 'onboarding'],
  },
];

interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allowedCommands = COMMANDS;

  const filtered = allowedCommands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].path);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 sm:pt-28">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Palette Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 px-4 py-3.5">
              <Search size={20} className="shrink-0 text-primary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Sahifa yoki qurol qidirish... (masalan: Fleshkartalar, Kanji, JLPT, Pomodoro)"
                className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X size={16} />
                </button>
              )}
              <kbd className="hidden items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground sm:inline-flex">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="space-y-2 p-8 text-center text-muted-foreground">
                  <p className="text-sm font-medium">Hech qanday natija topilmadi</p>
                  <p className="text-xs text-muted-foreground/70">
                    Iltimos, boshqa so'z bilan qidirib ko'ring
                  </p>
                </div>
              ) : (
                filtered.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`group flex w-full items-center justify-between rounded-xl p-3 text-left transition-all ${
                        isSelected
                          ? 'border border-primary/20 bg-primary/10 text-primary shadow-sm'
                          : 'text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`shrink-0 rounded-xl p-2 transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 truncate text-sm font-bold">
                            {item.title}
                            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                              {item.category}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        size={16}
                        className={`shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 opacity-100' : '-translate-x-1 opacity-0'}`}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Tips */}
            <div className="flex items-center justify-between border-t border-border/50 bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>
                  Tanlash:{' '}
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono font-bold">
                    ↵ Enter
                  </kbd>
                </span>
                <span>
                  Harakat:{' '}
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono font-bold">
                    ↑ ↓
                  </kbd>
                </span>
              </div>
              <span className="font-medium text-primary">kaiwa.live Quick Jump</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

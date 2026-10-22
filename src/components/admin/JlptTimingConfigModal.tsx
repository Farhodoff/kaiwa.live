import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Loader2, RotateCcw, Save, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from '../../hooks/use-toast';
import { JlptTimingConfigService } from '../../services/JlptTimingConfigService';
import {
  JlptLevel,
  JlptTimingBlockConfig,
  getDefaultTimingConfig,
  getTimingModelLabel,
} from '../../utils/jlptExamTiming';

interface JlptTimingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: unknown;
  onSaved?: () => void;
}

const LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const BLOCK_LABELS: Record<string, { title: string; description: string }> = {
  knowledge: {
    title: 'Language Knowledge',
    description: '文字・語彙 bo‘limi uchun alohida taymer.',
  },
  reading: {
    title: 'Reading (Dokkai)',
    description: '文法・読解 bo‘limi uchun alohida taymer.',
  },
  language_reading: {
    title: 'Language Knowledge + Reading',
    description: 'Rasmiy N2/N1 birlashgan bloki. Ikkala bo‘lim bitta taymerda ochiladi.',
  },
  listening: {
    title: 'Listening (Choukai)',
    description: 'Tinglash bo‘limi taymeri.',
  },
};

export const JlptTimingConfigModal: React.FC<JlptTimingConfigModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaved,
}) => {
  const [activeLevel, setActiveLevel] = useState<JlptLevel>('N2');
  const [configs, setConfigs] = useState<Record<JlptLevel, JlptTimingBlockConfig[]>>({
    N5: getDefaultTimingConfig('N5'),
    N4: getDefaultTimingConfig('N4'),
    N3: getDefaultTimingConfig('N3'),
    N2: getDefaultTimingConfig('N2'),
    N1: getDefaultTimingConfig('N1'),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoading(true);
    JlptTimingConfigService.loadConfig()
      .then((loaded) => {
        if (!mounted) return;
        setConfigs((prev) => {
          const next = { ...prev };
          LEVELS.forEach((level) => {
            if (loaded[level]) next[level] = loaded[level]!;
          });
          return next;
        });
      })
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Vaqt sozlamalarini yuklab bo‘lmadi',
          description: error?.message || 'Standart qiymatlar ishlatiladi.',
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const currentConfig = useMemo(
    () => configs[activeLevel] || getDefaultTimingConfig(activeLevel),
    [configs, activeLevel],
  );

  const updateBlock = (
    block: JlptTimingBlockConfig['block'],
    field: 'officialMinutes' | 'simulationMinutes',
    value: string,
  ) => {
    const parsed = Math.min(300, Math.max(1, Math.round(Number(value) || 1)));
    setConfigs((prev) => ({
      ...prev,
      [activeLevel]: prev[activeLevel].map((item) =>
        item.block === block ? { ...item, [field]: parsed } : item,
      ),
    }));
  };

  const handleReset = () => {
    setConfigs((prev) => ({ ...prev, [activeLevel]: getDefaultTimingConfig(activeLevel) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalized = await JlptTimingConfigService.saveLevelConfig(
        activeLevel,
        currentConfig,
        user,
      );
      setConfigs((prev) => ({ ...prev, [activeLevel]: normalized }));
      toast({
        title: '✅ Vaqt konfiguratsiyasi saqlandi',
        description: `${activeLevel} uchun official va practice vaqtlari yangilandi.`,
      });
      onSaved?.();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Saqlashda xatolik',
        description: error?.message || 'JLPT vaqt sozlamalarini saqlab bo‘lmadi.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl space-y-5 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                JLPT Timing Konfiguratsiyasi
              </h3>
              <p className="text-xs text-muted-foreground">
                Har bir level uchun official va practice vaqt bloklarini boshqaring.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                activeLevel === level
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">
            {getTimingModelLabel(activeLevel, 'official_timed', true)}
          </strong>
          <span className="mx-2">•</span>
          {activeLevel === 'N2' || activeLevel === 'N1'
            ? 'Language Knowledge va Reading bitta blokda, Listening alohida.'
            : 'Har bir bo‘lim alohida taymer blokida.'}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
            <Loader2 size={18} className="animate-spin text-rose-500" /> Sozlamalar yuklanmoqda...
          </div>
        ) : (
          <div className="space-y-3">
            {currentConfig.map((item) => {
              const label = BLOCK_LABELS[item.block] || {
                title: item.block,
                description: '',
              };
              return (
                <div
                  key={item.block}
                  className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <div>
                    <div className="text-xs font-black text-foreground">{label.title}</div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{label.description}</p>
                  </div>
                  <label className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                    Official
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={item.officialMinutes}
                      onChange={(e) => updateBlock(item.block, 'officialMinutes', e.target.value)}
                      className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-bold text-foreground"
                      aria-label={`${label.title} official daqiqa`}
                    />
                    <span>daq</span>
                  </label>
                  <label className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                    Practice
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={item.simulationMinutes}
                      onChange={(e) => updateBlock(item.block, 'simulationMinutes', e.target.value)}
                      className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-bold text-foreground"
                      aria-label={`${label.title} practice daqiqa`}
                    />
                    <span>daq</span>
                  </label>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading || saving}
            className="gap-2 rounded-xl"
          >
            <RotateCcw size={15} /> Standartga qaytarish
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl"
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || saving}
              className="gap-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Saqlash
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useLanguage, type Language } from '../../context/LanguageContext';

export default function InterfaceLanguageSelect() {
  const { language, setLanguage } = useLanguage();
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>
        {language === 'uz' ? 'Ilova tili' : language === 'ja' ? '表示言語' : 'App language'}
      </span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
      >
        <option value="uz">O‘zbekcha</option>
        <option value="ja">日本語</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}

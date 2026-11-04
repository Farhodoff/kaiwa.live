import { Type } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { FontType, useFontPreference } from '../hooks/useFontPreference';

const fonts: { id: FontType; name: string; class: string; example: string }[] = [
  { id: 'sans', name: 'Sans-Serif', class: 'font-sans', example: 'Zamonaviy va toza' },
  { id: 'serif', name: 'Serif', class: 'font-serif', example: 'Kitob uslubi' },
  { id: 'mono', name: 'Monospace', class: 'font-mono', example: 'Kod va algoritmlar' },
];

const FontSelector: React.FC = () => {
  const { font, changeFont } = useFontPreference();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleFontSelect = (fontId: FontType) => {
    changeFont(fontId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Aa Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Shrift turini tanlash"
      >
        <Type size={16} />
        <span className="text-sm">Aa</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-3 px-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            Shrift turi
          </p>
          <div className="flex flex-col gap-2">
            {fonts.map((f) => (
              <button
                key={f.id}
                onClick={() => handleFontSelect(f.id)}
                className={`rounded-lg border p-3 text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  f.class
                } ${
                  font === f.id
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-900/20 dark:ring-blue-400/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{f.name}</div>
                    <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {f.example}
                    </div>
                  </div>
                  {font === f.id && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FontSelector;

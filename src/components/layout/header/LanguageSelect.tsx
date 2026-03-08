'use client';

import { useEffect, useRef, useState } from 'react';

const LANGUAGES = ['ru', 'en', 'am'];

export default function LanguageSelect() {
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex w-[75px] items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-800 hover:border-[#E21321] hover:text-[#E21321] transition-colors z-[-1] relative"
      >
        <i className="fa-solid fa-globe text-[14px]" />
        <span className="tracking-wide">{lang.toUpperCase()}</span>
        <i
          className={`fa-solid fa-chevron-down text-[10px] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-28 rounded-xl border border-gray-100 bg-white shadow-lg p-1 text-xs z-30">
          {LANGUAGES.map((langItem) => (
            <button
              key={langItem}
              type="button"
              onClick={() => {
                setLang(langItem);
                setOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left rounded-[4px] mb-1 ${
                lang === langItem
                  ? 'bg-[#E21321]/5 text-[#E21321] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {langItem.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

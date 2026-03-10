'use client';

import { CATEGORIES } from '@/lib/supabase';

type Props = {
  selected: string;
  onSelect: (key: string) => void;
};

export default function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onSelect(cat.key)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
            ${selected === cat.key
              ? 'bg-accent text-white shadow-lg shadow-accent/30'
              : 'bg-card-bg text-gray-400 hover:bg-card-hover hover:text-white border border-border'
            }
          `}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

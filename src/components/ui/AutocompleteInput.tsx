import { useState, useRef, useEffect } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  maxResults?: number;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function AutocompleteInput({
  value,
  onChange,
  options,
  maxResults = 2,
  placeholder,
  className,
  required
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredOptions = options.filter(opt => {
    if (!value) return true;
    return normalize(opt).includes(normalize(value));
  }).slice(0, maxResults);

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setHasFocus(true);
          setIsOpen(true);
        }}
        onBlur={() => {
          setHasFocus(false);
        }}
        className={className}
        placeholder={placeholder}
        autoComplete="new-password"
      />
      
      {isOpen && hasFocus && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
          {filteredOptions.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:bg-slate-100 dark:focus:bg-slate-700 focus:outline-none"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

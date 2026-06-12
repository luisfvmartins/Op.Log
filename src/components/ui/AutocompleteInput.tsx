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
        <div className="absolute z-10 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.12)] overflow-hidden">
          {filteredOptions.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors focus:bg-[var(--bg-base)] focus:outline-none"
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

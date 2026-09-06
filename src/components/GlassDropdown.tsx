import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

interface GlassDropdownProps<T extends string = string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function GlassDropdown<T extends string = string>({
  value,
  options,
  onChange,
  ariaLabel,
}: GlassDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="glass-dropdown-container" ref={containerRef}>
      <button
        type="button"
        className={`glass-dropdown-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
      >
        <span className="glass-dropdown-label">{selectedOption?.label || value}</span>
        <ChevronDown size={14} className={`glass-dropdown-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <ul className="glass-dropdown-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`glass-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={13} className="glass-dropdown-check" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

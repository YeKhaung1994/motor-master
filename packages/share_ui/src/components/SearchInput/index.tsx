import { useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent } from 'react';
import { SearchIcon } from '../../icons';
import { cx } from '../../utils/cx';
import styles from './styles.module.css';

export interface SearchSuggestion {
  id: number | string;
  name: string;
  brand: string;
  slug: string;
}

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onSelect' | 'type'> {
  label?: string;
  /** `dark` is the top-bar treatment on --mm-tyre. */
  variant?: 'light' | 'dark';
  suggestions?: SearchSuggestion[];
  onSelectSuggestion?: (suggestion: SearchSuggestion) => void;
  emptyMessage?: string;
}

export function SearchInput({
  label = 'Search bikes',
  variant = 'light',
  suggestions,
  onSelectSuggestion,
  emptyMessage = 'No bikes match that search.',
  placeholder = 'Search model, e.g. "CB650R"',
  className,
  id,
  value,
  onKeyDown,
  ...rest
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-results`;
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = suggestions ?? [];
  const hasQuery = typeof value === 'string' && value.trim().length > 0;
  const showResults = open && hasQuery && Boolean(suggestions);

  function choose(index: number) {
    const item = items[index];
    if (item && onSelectSuggestion) {
      onSelectSuggestion(item);
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (!showResults || items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
    } else if (event.key === 'Enter') {
      if (activeIndex >= 0) {
        event.preventDefault();
        choose(activeIndex);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className={cx(styles.root, variant === 'dark' && styles.dark, className)}>
      <label className={styles.visuallyHidden} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.shell}>
        <SearchIcon className={styles.icon} size={15} />
        <input
          id={inputId}
          type="search"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && items[activeIndex] ? `${listboxId}-${activeIndex}` : undefined
          }
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={handleKeyDown}
          {...rest}
        />
      </div>
      {showResults ? (
        <ul className={styles.results} id={listboxId} role="listbox" aria-label="Search results">
          {items.length === 0 ? (
            <li className={styles.empty}>{emptyMessage}</li>
          ) : (
            items.map((item, index) => (
              <li
                key={item.id}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={styles.result}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  choose(index);
                }}
              >
                <span className={styles.resultName}>{item.name}</span>
                <span className={styles.resultBrand}>{item.brand}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

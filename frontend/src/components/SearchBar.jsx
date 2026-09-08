import { useEffect, useRef, useState } from 'react';

/**
 * A debounced search input.
 * Props: placeholder, onSearch(query), delay (ms), dark (styling variant), autoFocus
 */
export default function SearchBar({ placeholder = 'Search...', onSearch, delay = 350, autoFocus = false }) {
  const [value, setValue] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onSearch(value.trim()), delay);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="input-wrap">
      <span className="search-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="search"
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        aria-label={placeholder}
      />
    </div>
  );
}

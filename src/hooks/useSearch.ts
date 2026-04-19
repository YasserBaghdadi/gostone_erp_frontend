import { useState, useEffect, useMemo } from 'react';

interface UseSearchOptions {
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Initial search value */
  initialValue?: string;
  /** Callback when debounced value changes */
  onDebouncedChange?: (value: string) => void;
}

interface UseSearchReturn {
  /** Current input value (updates immediately) */
  searchTerm: string;
  /** Debounced search value (updates after delay) */
  debouncedTerm: string;
  /** Update the search term */
  setSearchTerm: (value: string) => void;
  /** Clear the search */
  clear: () => void;
  /** Whether a search is active */
  hasSearch: boolean;
}

/**
 * Custom hook for search input with debouncing
 * 
 * @example
 * const { searchTerm, debouncedTerm, setSearchTerm, clear } = useSearch({ debounceMs: 300 });
 * 
 * // Use debouncedTerm in your query
 * const { data } = useCustomers({ search: debouncedTerm, page, page_size: pageSize });
 * 
 * // In your input
 * <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 300, initialValue = '', onDebouncedChange } = options;
  
  const [searchTerm, setSearchTermState] = useState(initialValue);
  const [debouncedTerm, setDebouncedTerm] = useState(initialValue);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      onDebouncedChange?.(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs, onDebouncedChange]);

  const setSearchTerm = (value: string) => {
    setSearchTermState(value);
  };

  const clear = () => {
    setSearchTermState('');
    setDebouncedTerm('');
  };

  const hasSearch = useMemo(() => debouncedTerm.trim().length > 0, [debouncedTerm]);

  return {
    searchTerm,
    debouncedTerm,
    setSearchTerm,
    clear,
    hasSearch,
  };
}

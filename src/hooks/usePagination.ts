import { useState, useCallback } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const DEFAULT_PAGE_SIZE = 25;

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
  canGoNext: (totalPages: number) => boolean;
  canGoPrev: () => boolean;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, pageSize: initialPageSize = DEFAULT_PAGE_SIZE } = options;
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPage = useCallback((newPage: number) => {
    if (newPage >= 1) {
      setPageState(newPage);
    }
  }, []);

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPageState(1);
  }, []);

  const nextPage = useCallback(() => {
    setPageState((prev) => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPageState((prev) => Math.max(1, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setPageState(initialPage);
  }, [initialPage]);

  const canGoNext = useCallback((totalPages: number) => {
    return page < totalPages;
  }, [page]);

  const canGoPrev = useCallback(() => {
    return page > 1;
  }, [page]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    reset,
    canGoNext,
    canGoPrev,
  };
}

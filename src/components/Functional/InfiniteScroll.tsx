import React, { useEffect, useRef, useCallback } from "react";

interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  className?: string;
}

const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 500,
  className = "",
}) => {
  const isLoadingRef = useRef(isLoading);
  const hasMoreRef = useRef(hasMore);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef(0);

  // Update refs to avoid stale closures
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const handleScroll = useCallback(() => {
    const now = Date.now();

    // Throttle scroll events (max once per 100ms)
    if (now - lastScrollTimeRef.current < 100) {
      return;
    }
    lastScrollTimeRef.current = now;

    // Clear any pending timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }

    // Use window scroll instead of container scroll
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

    if (isNearBottom && hasMoreRef.current && !isLoadingRef.current) {
      // Debounce the loadMore call slightly to prevent rapid firing
      loadMoreTimeoutRef.current = setTimeout(() => {
        // Double-check conditions before calling loadMore
        if (hasMoreRef.current && !isLoadingRef.current) {
          onLoadMore();
        }
      }, 50);
    }
  }, [onLoadMore, threshold]);

  useEffect(() => {
    // Listen to window scroll instead of container scroll
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      // Clean up timeout on unmount
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Clean up timeout when component unmounts or dependencies change
  useEffect(() => {
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, []);

  return <div className={className}>{children}</div>;
};

export default InfiniteScroll;

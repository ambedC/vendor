import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 10;
const DEFAULT_SEARCHES: string[] = [];

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
          } else {
            setRecentSearches(DEFAULT_SEARCHES);
          }
        } else {
          setRecentSearches(DEFAULT_SEARCHES);
        }
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
      setRecentSearches(DEFAULT_SEARCHES);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever recentSearches changes
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches));
      } catch (error) {
        console.error("Error saving recent searches:", error);
      }
    }
  }, [recentSearches, isLoaded]);

  const addSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setRecentSearches((prev) => {
      // Remove if already exists and add to beginning
      const filtered = prev.filter(
        (search) => search.toLowerCase() !== trimmedQuery.toLowerCase()
      );
      const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      return updated;
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    setRecentSearches((prev) =>
      prev.filter((search) => search.toLowerCase() !== query.toLowerCase())
    );
  }, []);

  const clearAll = useCallback(() => {
    setRecentSearches(DEFAULT_SEARCHES);
  }, []);

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearAll,
    isLoaded,
  };
};

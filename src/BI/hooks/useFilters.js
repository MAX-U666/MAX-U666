import { useState, useCallback } from "react";

const defaultFilters = {
  dateRange: "today",
  selectedShop: "all",
  customStartDate: null,
  customEndDate: null
};

export function useFilters(initialFilters = {}) {
  const [filters, setFilters] = useState({
    ...defaultFilters,
    ...initialFilters
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const setDateRange = useCallback((range) => {
    updateFilter("dateRange", range);
  }, [updateFilter]);

  const setSelectedShop = useCallback((shop) => {
    updateFilter("selectedShop", shop);
  }, [updateFilter]);

  const setCustomDateRange = useCallback((start, end) => {
    setFilters(prev => ({
      ...prev,
      dateRange: "custom",
      customStartDate: start,
      customEndDate: end
    }));
  }, []);

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    setDateRange,
    setSelectedShop,
    setCustomDateRange
  };
}

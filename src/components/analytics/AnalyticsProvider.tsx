'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type DateRange = '24h' | '7d' | '30d';

interface AnalyticsContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  return (
    <AnalyticsContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

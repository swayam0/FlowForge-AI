'use client';

import React from 'react';
import { useAnalytics } from './AnalyticsProvider';
import { Button } from '@/components/ui/Button';
import { Download, Printer, FileJson } from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsHeaderProps {
  analyticsData: any;
}

export function AnalyticsHeader({ analyticsData }: AnalyticsHeaderProps) {
  const { dateRange, setDateRange } = useAnalytics();

  const handleExportCsv = () => {
    if (!analyticsData) return;
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Success,Fail\n"
        + analyticsData.executionTrends.map((e: any) => `${e.date},${e.success},${e.fail}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `flowforge-analytics-${dateRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV exported successfully');
    } catch (e) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportJson = () => {
    if (!analyticsData) return;
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analyticsData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `flowforge-analytics-${dateRange}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success('JSON exported successfully');
    } catch (e) {
      toast.error('Failed to export JSON');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Analytics & Observability</h1>
        <p className="text-muted-foreground mt-1">Monitor workflow health, AI performance, and system reliability.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <div className="flex items-center bg-card border border-border rounded-lg p-1 w-full sm:w-auto">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateRange === range ? 'bg-blue-600 text-white shadow-sm' : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson} className="hidden sm:flex">
            <FileJson className="h-4 w-4 mr-2" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

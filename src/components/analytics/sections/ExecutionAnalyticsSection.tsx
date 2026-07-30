'use client';

import React from 'react';
import { AreaChartComponent } from '../charts/AreaChartComponent';
import { BarChartComponent } from '../charts/BarChartComponent';

export function ExecutionAnalyticsSection({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-[#050505] border border-border rounded-xl p-5">
        <h3 className="font-semibold text-gray-200 mb-6">Executions Over Time</h3>
        <AreaChartComponent data={data.executionTrends} dataKey="success" color="#3b82f6" />
      </div>

      <div className="bg-[#050505] border border-border rounded-xl p-5">
        <h3 className="font-semibold text-gray-200 mb-6">Success vs Failure</h3>
        <BarChartComponent data={data.executionTrends} dataKeys={['success', 'fail']} colors={['#22c55e', '#ef4444']} />
      </div>
    </div>
  );
}

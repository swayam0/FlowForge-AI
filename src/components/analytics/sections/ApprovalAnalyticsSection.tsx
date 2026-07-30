'use client';

import React from 'react';
import { PieChartComponent } from '../charts/PieChartComponent';

export function ApprovalAnalyticsSection({ data }: { data: any }) {
  if (!data) return null;
  const appr = data.approvalAnalytics;

  const approvalSplit = [
    { name: 'Approved', value: appr.approvedPercent },
    { name: 'Rejected', value: appr.rejectedPercent }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-[#050505] border border-border rounded-xl p-5 flex flex-col justify-center">
        <h3 className="font-semibold text-gray-200 mb-6">Approval Bottlenecks</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Pending Approvals</span>
              <span className="font-bold text-orange-400">{appr.pendingApprovals}</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 w-[60%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Average Review Time</span>
              <span className="font-bold text-gray-200">4h 12m</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[40%]" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#050505] border border-border rounded-xl p-5">
        <h3 className="font-semibold text-gray-200 mb-6">Approval Resolution</h3>
        <PieChartComponent data={approvalSplit} colors={['#22c55e', '#ef4444']} />
      </div>
    </div>
  );
}

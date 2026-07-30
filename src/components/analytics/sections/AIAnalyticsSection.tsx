'use client';

import React from 'react';
import { Zap, AlertTriangle, Database, DollarSign } from 'lucide-react';
import { PieChartComponent } from '../charts/PieChartComponent';

export function AIAnalyticsSection({ data }: { data: any }) {
  if (!data) return null;
  const ai = data.aiAnalytics;

  const modelUsage = [
    { name: 'Gemini 3.1 Pro', value: 70 },
    { name: 'Gemini 1.5 Flash', value: 30 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
        <div className="bg-[#050505] border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total AI Calls</h4>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {ai.aiCalls} <Zap className="h-5 w-5 text-purple-400" />
          </p>
        </div>
        
        <div className="bg-[#050505] border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Est Tokens Processed</h4>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {ai.totalTokens.toLocaleString()} <Database className="h-5 w-5 text-blue-400" />
          </p>
        </div>

        <div className="bg-[#050505] border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] pointer-events-none" />
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Estimated Cost</h4>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            ${ai.estimatedCost.toFixed(2)} <DollarSign className="h-5 w-5 text-green-400" />
          </p>
        </div>

        <div className="bg-[#050505] border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[40px] pointer-events-none" />
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hallucination Warnings</h4>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {ai.hallucinationWarnings} <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </p>
        </div>
      </div>

      <div className="bg-[#050505] border border-border rounded-xl p-5">
        <h3 className="font-semibold text-gray-200 mb-6">Model Distribution</h3>
        <PieChartComponent data={modelUsage} colors={['#a855f7', '#3b82f6']} />
      </div>
    </div>
  );
}

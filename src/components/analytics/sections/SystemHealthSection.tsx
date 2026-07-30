'use client';

import React from 'react';
import { Database, Server, Cpu, Bot, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SystemHealthSection({ data }: { data: any }) {
  if (!data) return null;
  const health = data.systemHealth;

  const services = [
    { name: 'Database', status: health.database, icon: Database },
    { name: 'API Services', status: health.api, icon: Server },
    { name: 'Execution Engine', status: health.executionEngine, icon: Cpu },
    { name: 'AI Provider', status: health.aiProvider, icon: Bot }
  ];

  return (
    <div className="bg-[#050505] border border-border rounded-xl p-6 mb-8">
      <h3 className="font-semibold text-gray-200 mb-6 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        All Systems Operational
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <div key={service.name} className="p-4 bg-card border border-border rounded-lg flex items-center gap-4">
            <div className="p-2 bg-green-500/10 rounded-md">
              <service.icon className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">{service.name}</p>
              <p className="text-xs text-green-500 mt-0.5">{service.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

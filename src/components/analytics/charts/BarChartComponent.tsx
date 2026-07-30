'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function BarChartComponent({ data, dataKeys, colors }: { data: any[], dataKeys: string[], colors: string[] }) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: dataKeys.map((key, i) => ({
      label: key,
      data: data.map(d => d[key]),
      backgroundColor: colors[i % colors.length],
      borderRadius: 4,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#111',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#666' } },
      y: { grid: { color: '#333', borderDash: [3, 3] }, ticks: { color: '#666' }, border: { display: false } },
    },
  };

  return (
    <div className="w-full h-[200px]">
      <Bar data={chartData} options={options} />
    </div>
  );
}

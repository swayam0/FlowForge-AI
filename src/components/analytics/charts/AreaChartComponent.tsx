'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export function AreaChartComponent({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        fill: true,
        label: dataKey,
        data: data.map(d => d[dataKey]),
        borderColor: color,
        backgroundColor: `${color}33`, // 20% opacity
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
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
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="w-full h-[200px]">
      <Line data={chartData} options={options} />
    </div>
  );
}

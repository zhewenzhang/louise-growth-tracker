import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const GrowthChart = ({ data, whoData, label, color, unit, spanGaps = false }) => {
  const monthLabels = Array.from({ length: 25 }, (_, i) => `${i}月`);

  // Prepare WHO percentile datasets
  const whoP3Data = whoData.p3;
  const whoP50Data = whoData.p50;
  const whoP97Data = whoData.p97;

  // Prepare Louise's data - map to correct month positions
  const louiseData = new Array(25).fill(null);
  data.forEach((val, idx) => {
    if (val !== null && idx >= 0 && idx < 25) {
      louiseData[idx] = val;
    }
  });

  // Use useMemo to cache chart data
  const chartData = useMemo(() => ({
    labels: monthLabels,
    datasets: [
      // P3-P97 fill area
      {
        label: '正常範圍 (P3-P97)',
        data: whoP97Data,
        fill: '-1',
        backgroundColor: 'rgba(232, 144, 154, 0.08)',
        borderColor: 'transparent',
        pointRadius: 0,
        tension: 0.4,
        spanGaps: spanGaps,
        order: 3
      },
      // P97 line
      {
        label: 'P97',
        data: whoP97Data,
        borderColor: 'rgba(255,255,255,0.15)',
        borderDash: [4, 4],
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.4,
        spanGaps: spanGaps,
        order: 2
      },
      // P50 line
      {
        label: 'P50 (中位數)',
        data: whoP50Data,
        borderColor: 'rgba(255,255,255,0.3)',
        borderDash: [6, 4],
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.4,
        spanGaps: spanGaps,
        order: 2
      },
      // P3 line
      {
        label: 'P3',
        data: whoP3Data,
        borderColor: 'rgba(255,255,255,0.15)',
        borderDash: [4, 4],
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.4,
        spanGaps: spanGaps,
        order: 2
      },
      // Louise's actual data
      {
        label: label,
        data: louiseData,
        borderColor: color,
        backgroundColor: color,
        fill: false,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#1e0d14',
        pointBorderColor: color,
        pointBorderWidth: 2,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.3,
        spanGaps: spanGaps,
        order: 1
      }
    ]
  }), [data, whoData, label, color, monthLabels]);

  // Use useMemo to cache chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: { 
        display: true,
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.5)',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 11
          },
          filter: (item) => {
            // Only show certain legends
            return ['正常範圍 (P3-P97)', 'P50 (中位數)', label].includes(item.text);
          }
        }
      },
      tooltip: { 
        enabled: true,
        backgroundColor: 'rgba(30, 13, 20, 0.95)',
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.85)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (items) => {
            return `月齡: ${items[0].label}`;
          },
          label: (context) => {
            let label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null || value === undefined) return null;
            if (label === '正常範圍 (P3-P97)') return null;
            return `${label}: ${value.toFixed(1)}${unit || ''}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { 
          color: 'rgba(255,255,255,0.5)',
          font: { size: 11 },
          padding: 8,
          callback: function(value) {
            return value.toFixed(0) + (unit || '');
          }
        },
        grid: { 
          color: 'rgba(255,255,255,0.06)',
          drawBorder: false
        },
        border: {
          display: false
        }
      },
      x: {
        ticks: { 
          color: 'rgba(255,255,255,0.5)',
          font: { size: 11 },
          padding: 8,
          maxRotation: 0,
          callback: function(val, index) {
            // Show every 3 months to avoid crowding
            return index % 3 === 0 ? this.getLabelForValue(val) : null;
          }
        },
        grid: { 
          display: false 
        },
        border: {
          display: false
        }
      }
    }
  }), [unit]);

  return <Line data={chartData} options={options} />;
};

export default GrowthChart;

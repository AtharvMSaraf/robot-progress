import { useEffect } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const YELLOW = '#facc15';
const AMBER  = '#f59e0b';
const YELLOW_SOFT = 'rgba(250, 204, 21, 0.15)';

export function useChartDefaults() {
  useEffect(() => {
    ChartJS.defaults.color = '#a3a3a3';
    ChartJS.defaults.borderColor = '#262626';
    ChartJS.defaults.font.family = 'ui-sans-serif, system-ui, Inter, sans-serif';
  }, []);
}

const darkAxes = {
  y: { beginAtZero: true, grid: { color: '#1f1f1f' }, ticks: { color: '#a3a3a3' } },
  x: { grid: { color: '#141414' }, ticks: { color: '#a3a3a3' } },
};

export function TrendChart({ byDay }) {
  const data = {
    labels: byDay.map(p => p.date),
    datasets: [{
      label: 'Marks', data: byDay.map(p => p.marks),
      borderColor: YELLOW, backgroundColor: YELLOW_SOFT,
      fill: true, tension: 0.3, pointBackgroundColor: YELLOW, pointBorderColor: '#000',
    }],
  };
  return <Line data={data} options={{ plugins: { legend: { display: false } }, scales: darkAxes, responsive: true, maintainAspectRatio: false }} />;
}

export function ProjectChart({ byProject }) {
  const palette = [YELLOW, AMBER, '#eab308', '#d97706', '#713f12', '#a16207'];
  const data = {
    labels: byProject.map(p => p.label),
    datasets: [{
      data: byProject.map(p => p.marks),
      backgroundColor: byProject.map((_, i) => palette[i % palette.length]),
      borderColor: '#0a0a0a', borderWidth: 2,
    }],
  };
  return <Doughnut data={data} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#d4d4d4' } } }, responsive: true, maintainAspectRatio: false }} />;
}

export function RobotChart({ byRobot }) {
  const data = {
    labels: byRobot.map(p => p.label),
    datasets: [{ label: 'Marks', data: byRobot.map(p => p.marks), backgroundColor: YELLOW, borderRadius: 4 }],
  };
  return <Bar data={data} options={{ plugins: { legend: { display: false } }, scales: darkAxes, responsive: true, maintainAspectRatio: false }} />;
}

export function OperatorChart({ byOperator }) {
  const data = {
    labels: byOperator.map(p => p.label),
    datasets: [{ label: 'Marks', data: byOperator.map(p => p.marks), backgroundColor: AMBER, borderRadius: 4 }],
  };
  return <Bar data={data} options={{
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: '#1f1f1f' }, ticks: { color: '#a3a3a3' } },
      y: { grid: { display: false }, ticks: { color: '#a3a3a3' } },
    },
    responsive: true, maintainAspectRatio: false,
  }} />;
}

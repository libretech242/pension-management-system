import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../services/pensionService';

const ContributionChart = ({ data }) => {
  // Transform data for the chart
  const chartData = Object.entries(data).map(([month, amount]) => ({
    month,
    amount,
  })).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          }}
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }}
        />
        <Legend />
        <Bar dataKey="amount" fill="#8884d8" name="Contributions" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ContributionChart;

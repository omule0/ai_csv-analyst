'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function DataVisualizer({ data, columns }) {
  const [selectedColumn, setSelectedColumn] = useState(columns[0]);

  // Determine data type and prepare visualization data
  const chartData = useMemo(() => {
    if (!data || !selectedColumn) return [];

    const values = data.map(row => row[selectedColumn]);
    const isNumeric = values.every(v => !isNaN(v));

    if (isNumeric) {
      // For numeric data, create frequency distribution
      const frequencies = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(frequencies).map(([value, count]) => ({
        value: Number(value),
        count
      }));
    } else {
      // For categorical data, create category counts
      const categories = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(categories).map(([category, count]) => ({
        category,
        count
      }));
    }
  }, [data, selectedColumn]);

  // Determine if data is numeric
  const isNumericData = useMemo(() => {
    if (!data || !selectedColumn) return false;
    return data.every(row => !isNaN(row[selectedColumn]));
  }, [data, selectedColumn]);

  return (
    <div className="space-y-4">
      {/* Column selector */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium">Select column:</label>
        <select
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
          className="border rounded-md px-2 py-1"
        >
          {columns.map(column => (
            <option key={column} value={column}>{column}</option>
          ))}
        </select>
      </div>

      {/* Visualization */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer>
          {isNumericData ? (
            // Bar chart for numeric data
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="value" />
              <YAxis dataKey="count" />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          ) : (
            // Pie chart for categorical data
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({category, count}) => `${category}: ${count}`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary statistics */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Summary Statistics for {selectedColumn}</h4>
        {isNumericData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Average"
              value={average(data.map(row => Number(row[selectedColumn])))}
            />
            <StatCard
              title="Median"
              value={median(data.map(row => Number(row[selectedColumn])))}
            />
            <StatCard
              title="Min"
              value={Math.min(...data.map(row => Number(row[selectedColumn])))}
            />
            <StatCard
              title="Max"
              value={Math.max(...data.map(row => Number(row[selectedColumn])))}
            />
          </div>
        ) : (
          <div>
            <p>Unique categories: {new Set(data.map(row => row[selectedColumn])).size}</p>
            <p>Most common: {findMostCommon(data.map(row => row[selectedColumn]))}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper components and functions
function StatCard({ title, value }) {
  return (
    <div className="p-3 bg-white rounded-md shadow-sm">
      <h5 className="text-sm text-gray-600">{title}</h5>
      <p className="text-lg font-semibold">{value.toFixed(2)}</p>
    </div>
  );
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function findMostCommon(arr) {
  return Object.entries(
    arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {})
  ).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
} 
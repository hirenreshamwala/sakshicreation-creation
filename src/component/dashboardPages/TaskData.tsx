"use client";

import React from 'react';
import { Box, TableCell, Typography } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Props {
  activeTab: number;
  startDate: string;
  endDate: string;
  staffFilter: string[];
  data: any[];
  loading: boolean;
  companyName: string;
}

const columns = [
  { id: 'staffName', label: 'Staff Name' },
  { id: 'total', label: 'Total Tasks' },
  { id: 'completed', label: 'Completed Tasks' },
  { id: 'cancelled', label: 'Cancelled Tasks' },
  { id: 'reschduled', label: 'Reschduled Tasks' },
];

const TaskData: React.FC<Props> = ({ activeTab, startDate, endDate, staffFilter, data, loading, companyName }) => {
  // Handle click events for table cells
  const handleClick = (staffId: string, companyId: string) => {
    const url = `/admin/assign-task?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}`;
    window.open(url, '_blank');
  };

  const handleCompletedClick = (staffId: string, companyId: string) => {
    const url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=completed`;
    window.open(url, '_blank');
  };

  const handleCancelledClick = (staffId: string, companyId: string) => {
    const url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=cancelled`;
    window.open(url, '_blank');
  };

  const handleRescheduledClick = (staffId: string, companyId: string) => {
    const url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=rescheduled`;
    window.open(url, '_blank');
  };

  // Prepare data for the bar chart
  const chartData = {
    labels: data.map((row) => row.staffName), // Staff names as x-axis labels
    datasets: [
      {
        label: 'Total Tasks',
        data: data.map((row) => Number(row.totalTasks) || 0),
        backgroundColor: '#3b82f6', // Blue
        borderColor: '#ffffff',
        borderWidth: 1,
      },
      {
        label: 'Completed Tasks',
        data: data.map((row) => Number(row.completedTasks) || 0),
        backgroundColor: '#22c55e', // Green
        borderColor: '#ffffff',
        borderWidth: 1,
      },
      {
        label: 'Cancelled Tasks',
        data: data.map((row) => Number(row.cancelledTasks) || 0),
        backgroundColor: '#ef4444', // Red
        borderColor: '#ffffff',
        borderWidth: 1,
      },
      {
        label: 'Rescheduled Tasks',
        data: data.map((row) => Number(row.rescheduledTasks) || 0),
        backgroundColor: '#f59e0b', // Yellow
        borderColor: '#ffffff',
        borderWidth: 1,
      },
    ],
  };

  // Bar chart options with click handler
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Staff',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Number of Tasks',
        },
        beginAtZero: true,
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const dataIndex = element.index;
        const label = chartData.datasets[datasetIndex].label;
        const row = data[dataIndex]; // Get the corresponding staff data

        if (!row) return;

        const { staffId, companyId } = row;
        let url = '';

        switch (label) {
          case 'Total Tasks':
            url = `/admin/assign-task?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}`;
            break;
          case 'Completed Tasks':
            url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=completed`;
            break;
          case 'Cancelled Tasks':
            url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=cancelled`;
            break;
          case 'Rescheduled Tasks':
            url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=rescheduled`;
            break;
          default:
            return;
        }

        window.open(url, '_blank');
      }
    },
  };

  return (
    <Box sx={{ p: 2 }}>
      {!loading && data.length > 0 ? (
        <>
          {/* Bar Chart */}
          <Box sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>
              Task Distribution by Staff for {companyName} ({startDate} to {endDate})
            </Typography>
            <Bar data={chartData} options={chartOptions} />
          </Box>

          {/* Table */}
          {/* <BasicTable
            showDatePicker={false}
            showFillter={false}
            showSearch={false}
            title="Task Data"
            tableHeader={columns}
            rowData={data}
            renderRow={(row) => (
              <>
                <TableCell>{row.staffName}</TableCell>
                <TableCell onClick={() => handleClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>
                  {row.totalTasks}
                </TableCell>
                <TableCell onClick={() => handleCompletedClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>
                  {row.completedTasks}
                </TableCell>
                <TableCell onClick={() => handleCancelledClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>
                  {row.cancelledTasks}
                </TableCell>
                <TableCell onClick={() => handleRescheduledClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>
                  {row.rescheduledTasks}
                </TableCell>
              </>
            )}
          /> */}
        </>
      ) : (
        !loading && (
          <Box sx={{ textAlign: 'center', color: 'gray', mt: 4 }}>
            No data for {companyName}
          </Box>
        )
      )}
    </Box>
  );
};

export default TaskData;
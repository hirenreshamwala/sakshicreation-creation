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
  { id: 'total', label: 'Total Party Call' },
  { id: 'completed', label: 'Completed Party Call' },
  { id: 'cancelled', label: 'Cancelled Party Call' },
  { id: 'reschduled', label: 'Reschduled Party Call' },
];

const LeadData: React.FC<Props> = ({ activeTab, startDate, endDate, staffFilter, data, loading, companyName }) => {
  // Handle click events for table cells
  const handleClick = (staffId: string, companyId: string) => {
    const url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}`;
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
        label: 'Total Party Call',
        data: data.map((row) => Number(row.totalLeads) || 0),
        backgroundColor: '#3b82f6', // Blue
        borderColor: '#ffffff',
        borderWidth: 1,
      },
      {
        label: 'Completed Party Call',
        data: data.map((row) => Number(row.completedLeads) || 0),
        backgroundColor: '#22c55e', // Green
        borderColor: '#ffffff',
        borderWidth: 1,
      },
      {
        label: 'Cancelled Party Call',
        data: data.map((row) => Number(row.cancelledLeads) || 0),
        backgroundColor: '#ef4444', // Red
        borderColor: '#ffffff',
        borderWidth: 1,
      },
      {
        label: 'Rescheduled Party Call',
        data: data.map((row) => Number(row.rescheduledLeads) || 0),
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
          text: 'Number of Party Calls',
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
          case 'Total Party Call':
            url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}`;
            break;
          case 'Completed Party Call':
            url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=completed`;
            break;
          case 'Cancelled Party Call':
            url = `/admin/party-call?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}&status=cancelled`;
            break;
          case 'Rescheduled Party Call':
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
              Party Call Distribution by Staff for {companyName} ({startDate} to {endDate})
            </Typography>
            <Bar data={chartData} options={chartOptions} />
          </Box>

          {/* Table */}
          {/* <BasicTable
            showDatePicker={false}
            showFillter={false}
            showSearch={false}
            title="Party Call Data"
            tableHeader={columns}
            rowData={data}
            renderRow={(row) => (
              <>
                <TableCell>{row.staffName}</TableCell>
                <TableCell onClick={() => handleClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>
                  {row.totalLeads}
                </TableCell>
                <TableCell onClick={() => handleCompletedClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>
                  {row.completedLeads}
                </TableCell>
                <TableCell onClick={() => handleCancelledClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>
                  {row.cancelledLeads}
                </TableCell>
                <TableCell onClick={() => handleRescheduledClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>
                  {row.rescheduledLeads}
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

export default LeadData;
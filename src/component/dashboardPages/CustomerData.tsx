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
  { id: 'new', label: 'Total New Party' },
  { id: 'customer', label: 'New To Customer' },
];

const CustomerData: React.FC<Props> = ({ activeTab, startDate, endDate, staffFilter, data, loading, companyName }) => {
  // Handle click events for table cells
  const handleNewClick = (staffId: string, companyId: string) => {
    const url = `/admin/account-master?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&partyTag=new&c=${companyName}`;
    window.open(url, '_blank');
  };

  const handleCustomerClick = (staffId: string, companyId: string) => {
    const url = `/admin/account-master?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&partyTag=customer&c=${companyName}`;
    window.open(url, '_blank');
  };

  // Prepare data for the bar chart
  const chartData = {
    labels: data.map((row) => row.staffName), // Staff names as x-axis labels
    datasets: [
      {
        label: 'Total New Party',
        data: data.map((row) => Number(row.newparty) || 0),
        backgroundColor: '#3b82f6', // Blue
        borderColor: '#ffffff',
        borderWidth: 16,
      },
      {
        label: 'New To Customer',
        data: data.map((row) => Number(row.customerparty) || 0),
        backgroundColor: '#22c55e', // Green
        borderColor: '#ffffff',
        borderWidth: 16,
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
          text: 'Number of Parties',
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
          case 'Total New Party':
            url = `/admin/account-master?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&partyTag=new&c=${companyName}`;
            break;
          case 'New To Customer':
            url = `/admin/account-master?staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&partyTag=customer&c=${companyName}`;
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
              Customer Distribution by Staff for {companyName} ({startDate} to {endDate})
            </Typography>
            <Bar data={chartData} options={chartOptions} />
          </Box>

          {/* Table */}
          {/* <BasicTable
            showDatePicker={false}
            showFillter={false}
            showSearch={false}
            title="Customer Data"
            tableHeader={columns}
            rowData={data}
            renderRow={(row) => (
              <>
                <TableCell>{row.staffName}</TableCell>
                <TableCell onClick={() => handleNewClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>
                  {row.newparty}
                </TableCell>
                <TableCell onClick={() => handleCustomerClick(row.staffId, row.companyId)} sx={{ cursor: 'pointer' }}>
                  {row.customerparty}
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

export default CustomerData;
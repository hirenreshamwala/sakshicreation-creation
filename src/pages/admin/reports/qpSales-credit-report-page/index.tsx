import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TableCell } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';
import DateRangePicker from '@/component/daterangepicker';
import moment from 'moment';
import { reportService } from '@/services/reportService';

// API Response Types for QP Sales Credit
interface OrderDetail {
  orderNumber: number;
  totalKg: string;
  createdAt: string;
}

interface StaffQPSalesData {
  _id: string;
  staffName: string;
  totalKgSum: number;
  totalOrders: number;
  createdBy: string;
  orders: OrderDetail[];
}

interface QPSalesCreditApiResponse {
  success: boolean;
  message: string;
  data: {
    report: StaffQPSalesData[];
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
}

const QPSalesCreditReportPage = () => {
  const [startDate, setStartDate] = useState<Date | null>(moment().subtract(30, 'days').toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());

  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
  });

  const [reportData, setReportData] = useState<StaffQPSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only 3 columns - same as previous Sales Credit style
  const columns = [
    { id: 'staffName', label: 'Staff Name' },
    { id: 'totalOrders', label: 'Total Orders' },
    { id: 'totalKgSum', label: 'Total Kg' },
  ];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // New method we'll add in service
        const response: QPSalesCreditApiResponse = await reportService.getQPSalesCreditReport(dateRange);

        if (response.success && response.data?.report) {
          const staffList = response.data.report;

          // Optional: Sort by highest Kg first
          staffList.sort((a, b) => b.totalKgSum - a.totalKgSum);

          setReportData(staffList);
        } else {
          setReportData([]);
        }
      } catch (err: any) {
        console.error('Error fetching QP sales credit report:', err);
        setError(err.message || 'Failed to load data');
        setReportData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      setDateRange({
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
      });
    }
  };

  const displayedDateRange = startDate && endDate
    ? `${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`
    : 'Select date range';

  // Loading
  if (loading) {
    return <Typography>Loading QP sales credit report...</Typography>;
  }

  // Error
  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  // Empty
  if (reportData.length === 0) {
    return (
      <div>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
          <Button variant="contained" color="primary" onClick={handleApplyDateRange}>
            Apply
          </Button>
        </Box>
        <Typography>No QP sales credit data available for selected date range.</Typography>
      </div>
    );
  }

  return (
    <div>
      {/* Date Range Picker */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        <Button variant="contained" color="primary" onClick={handleApplyDateRange}>
          Apply
        </Button>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 2, color: '#555' }}>
        Showing data for: <strong>{displayedDateRange}</strong>
      </Typography>

      {/* Summary Table */}
      <BasicTable
        tableHeader={columns}
        rowData={reportData}
        showDatePicker={false}
        renderRow={(row: StaffQPSalesData) => (
          <>
            {/* Staff Name */}
            <TableCell sx={{ fontWeight: 'medium', color: '#333' }}>
              {row.staffName}
            </TableCell>

            {/* Total Orders */}
            <TableCell  sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {row.totalOrders}
            </TableCell>

            {/* Total Kg - Right aligned, bold, highlighted */}
            <TableCell sx={{ fontWeight: 'bold', color: '#d32f2f', pr: 4 }}>
              {row.totalKgSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg
            </TableCell>
          </>
        )}
      />
    </div>
  );
};

export default QPSalesCreditReportPage;
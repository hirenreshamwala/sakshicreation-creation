import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TableCell } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';
import DateRangePicker from '@/component/daterangepicker';
import moment from 'moment';
import { reportService } from '@/services/reportService';

// API Response Types (Simplified)
interface StaffSalesData {
  _id: string;
  staffName: string;
  totalFinalAmount: number;
  totalOrders: number;
}

interface SalesCreditApiResponse {
  success: boolean;
  message: string;
  data: {
    report: StaffSalesData[];
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
}

const SalesCreditReportPage = () => {
  const [startDate, setStartDate] = useState<Date | null>(moment().subtract(30, 'days').toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());

  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
  });

  const [reportData, setReportData] = useState<StaffSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only 3 columns
  const columns = [
    { id: 'staffName', label: 'Staff Name' },
    { id: 'totalOrders', label: 'Total Orders' },
    { id: 'totalFinalAmount', label: 'Total Amount' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response: SalesCreditApiResponse = await reportService.getSalesCreditReport(dateRange);

        if (response.success && response.data?.report) {
          const staffList = response.data.report.map(staff => ({
            _id: staff._id,
            staffName: staff.staffName,
            totalOrders: staff.totalOrders,
            totalFinalAmount: staff.totalFinalAmount,
          }));

          // Sort by highest amount first
          staffList.sort((a, b) => b.totalFinalAmount - a.totalFinalAmount);

          setReportData(staffList);
        } else {
          setReportData([]);
        }
      } catch (err: any) {
        console.error('Error fetching sales credit report:', err);
        setError(err.message || 'Failed to load data');
        setReportData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Fixed: Removed typo "NO"
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

  if (loading) {
    return <Typography>Loading sales credit report...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

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
        <Typography>No sales credit data available for selected date range.</Typography>
      </div>
    );
  }

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

      <Typography variant="subtitle1" sx={{ mb: 2, color: '#555' }}>
        Showing data for: <strong>{displayedDateRange}</strong>
      </Typography>

      <BasicTable
        tableHeader={columns}
        rowData={reportData}
        showDatePicker={false}
        renderRow={(row: StaffSalesData) => (
          <>
            <TableCell sx={{ fontWeight: 'medium', color: '#333' }}>
              {row.staffName}
            </TableCell>
            <TableCell  sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {row.totalOrders}
            </TableCell>
            <TableCell  sx={{ fontWeight: 'bold', color: '#d32f2f', pr: 4 }}>
              ₹{row.totalFinalAmount.toFixed(2)}
            </TableCell>
          </>
        )}
      />
    </div>
  );
};

export default SalesCreditReportPage;
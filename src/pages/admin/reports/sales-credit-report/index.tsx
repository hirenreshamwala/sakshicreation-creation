import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TableCell, Alert } from '@mui/material';
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
  data?: {
    report: StaffSalesData[];
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
}

const SalesCreditReportPage = () => {
  const defaultStartDate = moment().subtract(30, 'days').toDate();
  const defaultEndDate = moment().toDate();

  const [startDate, setStartDate] = useState<Date | null>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | null>(defaultEndDate);

  const [dateRange, setDateRange] = useState({
    startDate: moment(defaultStartDate).format('YYYY-MM-DD'),
    endDate: moment(defaultEndDate).format('YYYY-MM-DD'),
  });

  const [reportData, setReportData] = useState<StaffSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Only 3 columns
  const columns = [
    { id: 'staffName', label: 'Staff Name' },
    { id: 'totalOrders', label: 'Total Orders' },
    { id: 'totalFinalAmount', label: 'Total Amount' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setApiMessage(null);
      setHasData(false);
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
          setHasData(true);
        } else {
          setReportData([]);
          setHasData(false);
          setApiMessage(response.message || "No data available");
        }
      } catch (err: any) {
        console.error('Error fetching sales credit report:', err);
        setReportData([]);
        setHasData(false);
        setApiMessage(err.message || 'Failed to load data. Please try again.');
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

  const handleClearDateRange = () => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setDateRange({
      startDate: moment(defaultStartDate).format('YYYY-MM-DD'),
      endDate: moment(defaultEndDate).format('YYYY-MM-DD'),
    });
  };

  const displayedDateRange = startDate && endDate
    ? `${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`
    : 'Select date range';

  const isDateRangeChanged = !(
    moment(startDate).isSame(defaultStartDate, 'day') &&
    moment(endDate).isSame(defaultEndDate, 'day')
  );

  if (loading) {
    return <Typography>Loading sales credit report...</Typography>;
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
        {isDateRangeChanged && (
          <Button variant="outlined" color="error" onClick={handleClearDateRange}>
            Clear
          </Button>
        )}
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 2, color: '#555' }}>
        Showing data for: <strong>{displayedDateRange}</strong>
      </Typography>

      {apiMessage && !hasData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {apiMessage}
        </Alert>
      )}

      {hasData && reportData.length > 0 ? (
      <BasicTable
        tableHeader={columns}
        rowData={reportData}
        showDatePicker={false}
        showSearch={false}
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
      ) : null}
    </div>
  );
};

export default SalesCreditReportPage;
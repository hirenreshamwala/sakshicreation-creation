import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BasicTable from '@/component/common_component/Table/themetable';
import { Box, TableCell, Typography, Button } from '@mui/material';
import DateRangePicker from '@/component/daterangepicker';
import moment from 'moment';
import { reportService, PrinterPerformance } from '@/services/reportService';

const columns = [
  { id: 'name', label: 'Printer Name' },
  { id: 'totalAssignedOrders', label: 'Total Assigned' },
  { id: 'printingCompletedCount', label: 'Completed' },
  { id: 'pendingOrdersCount', label: 'Pending' },
  { id: 'inProgressOrdersCount', label: 'In Progress' },
];

const PrintersPage = () => {
  const router = useRouter();

  const defaultStartDate = moment().subtract(30, 'days').toDate();
  const defaultEndDate = moment().toDate();

  const [startDate, setStartDate] = useState<Date | null>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | null>(defaultEndDate);

  const [dateRange, setDateRange] = useState({
    startDate: moment(defaultStartDate).format('YYYY-MM-DD'),
    endDate: moment(defaultEndDate).format('YYYY-MM-DD'),
  });

  const [printers, setPrinters] = useState<PrinterPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrinterData();
  }, [dateRange]);

  const fetchPrinterData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getPrinterPerformance(dateRange);
      if (response.success && response.data) {
        setPrinters(response.data);
      }
    } catch (error) {
      console.error('Error fetching printer data:', error);
    } finally {
      setLoading(false);
    }
  };
// useEffect(() => {
//   if (startDate && endDate) {
//     const newDateRange = {
//       startDate: moment(startDate).format('YYYY-MM-DD'),
//       endDate: moment(endDate).format('YYYY-MM-DD'),
//     };
//     setDateRange(newDateRange);
//   }
// }, [startDate, endDate]);
  // Apply button handler
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

  if (loading && printers.length === 0) {
    return <Typography>Loading printer data...</Typography>;
  }

  return (
    <>
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

      <BasicTable
        tableHeader={columns}
        rowData={printers}
        showDatePicker={false}
        renderRow={(row: PrinterPerformance) => (
          <>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.totalAssignedOrders}</TableCell>
            <TableCell>{row.printingCompletedCount}</TableCell>
            <TableCell>{row.pendingOrdersCount}</TableCell>
            <TableCell>{row.inProgressOrdersCount}</TableCell>
          </>
        )}
      />
    </>
  );
};

export default PrintersPage;
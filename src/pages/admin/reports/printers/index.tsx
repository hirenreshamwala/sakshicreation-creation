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

  // Date picker states (Date objects)
  const [startDate, setStartDate] = useState<Date | null>(moment().subtract(30, 'days').toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());

  // Formatted date range for API (YYYY-MM-DD)
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
  });

  const [printers, setPrinters] = useState<PrinterPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data on mount and when dateRange changes
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
      const newDateRange = {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
      };
      setDateRange(newDateRange);
      // fetchPrinterData will be triggered automatically by useEffect
    }
  };

  // Display formatted selected range
  const displayedDateRange = startDate && endDate
    ? `${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`
    : 'Select date range';

  if (loading && printers.length === 0) {
    return <Typography>Loading printer data...</Typography>;
  }

  return (
    <>
      {/* Date Range Picker + Apply Button */}
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

      {/* Show selected date range */}
      <Typography variant="subtitle1" sx={{ mb: 2, color: '#555' }}>
        Showing data for: <strong>{displayedDateRange}</strong>
      </Typography>

      {/* Table */}
      <BasicTable
        tableHeader={columns}
        rowData={printers}
        showDatePicker={false} 
        renderRow={(row: any) => (
          <>
            <TableCell>
              <Box sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}>
                {row.name}
                {/* Optional chevron if row is clickable */}
                {/* <FaChevronRight size={14} /> */}
              </Box>
            </TableCell>
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
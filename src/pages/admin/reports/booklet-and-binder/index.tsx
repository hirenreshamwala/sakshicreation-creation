import React, { useState, useEffect } from 'react';
import BasicTable from '@/component/common_component/Table/themetable';
import { Box, TableCell, Typography, Button } from '@mui/material';
import DateRangePicker from '@/component/daterangepicker';
import moment from 'moment';
import { reportService, BookletBinderPerformance } from '@/services/reportService';

const columns = [
  { id: 'name', label: 'Booklet Binder Name' },
  { id: 'totalAssignedOrders', label: 'Total Assigned' },
  { id: 'bookletBindingCompletedCount', label: 'Completed' },
  { id: 'pendingOrdersCount', label: 'Pending' },
  { id: 'inProgressOrdersCount', label: 'In Progress' },
];

const BookletAndBinderPage = () => {
  // Date picker states (Date objects)
  const [startDate, setStartDate] = useState<Date | null>(moment().subtract(30, 'days').toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());

  // Formatted date range for API
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
  });

  const [bookletBinders, setBookletBinders] = useState<BookletBinderPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data whenever dateRange changes
  useEffect(() => {
    fetchBookletBinderData();
  }, [dateRange]);

  const fetchBookletBinderData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getBookletBinderPerformance(dateRange);
      if (response.success && response.data) {
        setBookletBinders(response.data);
      }
    } catch (error) {
      console.error('Error fetching booklet binder data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply button handler
  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      const newDateRange = {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
      };
      setDateRange(newDateRange);
      // useEffect will trigger fetch automatically
    }
  };

  // Display formatted selected range
  const displayedDateRange = startDate && endDate
    ? `${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`
    : 'Select date range';

  if (loading && bookletBinders.length === 0) {
    return <Typography>Loading booklet binder data...</Typography>;
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
        rowData={bookletBinders}
        showDatePicker={false} 
        renderRow={(row: BookletBinderPerformance) => (
          <>
            <TableCell>
              <Box sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}>
                {row.name}
              </Box>
            </TableCell>
            <TableCell>{row.totalAssignedOrders}</TableCell>
            <TableCell>{row.bookletBindingCompletedCount}</TableCell>
            <TableCell>{row.pendingOrdersCount}</TableCell>
            <TableCell>{row.inProgressOrdersCount}</TableCell>
          </>
        )}
      />
    </>
  );
};

export default BookletAndBinderPage;
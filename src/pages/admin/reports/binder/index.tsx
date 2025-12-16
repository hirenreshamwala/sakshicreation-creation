import React, { useState, useEffect } from 'react';
import BasicTable from '@/component/common_component/Table/themetable';
import { Box, TableCell, Typography, Button } from '@mui/material';
import DateRangePicker from '@/component/daterangepicker';
import moment from 'moment';
import { reportService, BinderPerformance } from '@/services/reportService';

const columns = [
  { id: 'name', label: 'Binder Name' },
  { id: 'totalAssignedOrders', label: 'Total Assigned' },
  { id: 'bindingCompletedCount', label: 'Completed' },
  { id: 'pendingOrdersCount', label: 'Pending' },
  { id: 'inProgressOrdersCount', label: 'In Progress' },
];

const BinderPage = () => {
  // Date picker states (Date objects)
  const [startDate, setStartDate] = useState<Date | null>(moment().subtract(30, 'days').toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());

  // Formatted date range for API
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
  });

  const [binders, setBinders] = useState<BinderPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data whenever dateRange changes
  useEffect(() => {
    fetchBinderData();
  }, [dateRange]);

  const fetchBinderData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getBinderPerformance(dateRange);
      if (response.success && response.data) {
        setBinders(response.data);
      }
    } catch (error) {
      console.error('Error fetching binder data:', error);
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
    }
  };

  // Display formatted selected range
  const displayedDateRange = startDate && endDate
    ? `${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`
    : 'Select date range';

  if (loading && binders.length === 0) {
    return <Typography>Loading binder data...</Typography>;
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
        rowData={binders}
        showDatePicker={false} 
        renderRow={(row: BinderPerformance) => (
          <>
            <TableCell>
              <Box sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}>
                {row.name}
              </Box>
            </TableCell>
            <TableCell>{row.totalAssignedOrders}</TableCell>
            <TableCell>{row.bindingCompletedCount}</TableCell>
            <TableCell>{row.pendingOrdersCount}</TableCell>
            <TableCell>{row.inProgressOrdersCount}</TableCell>
          </>
        )}
      />
    </>
  );
};

export default BinderPage;
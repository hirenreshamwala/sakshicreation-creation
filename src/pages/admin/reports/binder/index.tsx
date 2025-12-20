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
  const defaultStartDate = moment().subtract(30, 'days').toDate();
  const defaultEndDate = moment().toDate();

  const [startDate, setStartDate] = useState<Date | null>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | null>(defaultEndDate);

  const [dateRange, setDateRange] = useState({
    startDate: moment(defaultStartDate).format('YYYY-MM-DD'),
    endDate: moment(defaultEndDate).format('YYYY-MM-DD'),
  });

  const [binders, setBinders] = useState<BinderPerformance[]>([]);
  const [loading, setLoading] = useState(false);

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

  if (loading && binders.length === 0) {
    return <Typography>Loading binder data...</Typography>;
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
        rowData={binders}
        showDatePicker={false}
        renderRow={(row: BinderPerformance) => (
          <>
            <TableCell>{row.name}</TableCell>
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
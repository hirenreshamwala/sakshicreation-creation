import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BasicTable from '@/component/common_component/Table/themetable';
import { TableCell, Box, Typography, Button } from '@mui/material';
import DateRangePicker from '@/component/daterangepicker';
import moment from 'moment';
import { reportService, DesignerPerformance } from '@/services/reportService';

const columns = [
  { id: 'name', label: 'Designer Name' },
  { id: 'totalOrders', label: 'Total Orders' },
  { id: 'approved', label: 'Approved' },
  { id: 'newDesigns', label: 'New Designs' },
  { id: 'rework', label: 'Rework' },
  { id: 'pending', label: 'Pending' },
  { id: 'inProgress', label: 'In Progress' },
];

const DesignerPage = () => {
  const router = useRouter();

  const defaultStartDate = moment().subtract(30, 'days').toDate();
  const defaultEndDate = moment().toDate();

  const [startDate, setStartDate] = useState<Date | null>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | null>(defaultEndDate);

  const [dateRange, setDateRange] = useState({
    startDate: moment(defaultStartDate).format('YYYY-MM-DD'),
    endDate: moment(defaultEndDate).format('YYYY-MM-DD'),
  });

  const [designers, setDesigners] = useState<DesignerPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDesignerData();
  }, [dateRange]);

  const fetchDesignerData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getDesignerPerformance(dateRange);
      if (response.success && response.data) {
        setDesigners(response.data);
      }
    } catch (error) {
      console.error('Error fetching designer data:', error);
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

  if (loading && designers.length === 0) {
    return <Typography>Loading designer data...</Typography>;
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

      <BasicTable
        tableHeader={columns}
        rowData={designers}
        showDatePicker={false}
        renderRow={(row: DesignerPerformance) => (
          <>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.totalOrders}</TableCell>
            <TableCell>{row.approved}</TableCell>
            <TableCell>{row.newDesigns}</TableCell>
            <TableCell>{row.rework}</TableCell>
            <TableCell>{row.pending}</TableCell>
            <TableCell>{row.inProgress}</TableCell>
          </>
        )}
      />
    </div>
  );
};

export default DesignerPage;
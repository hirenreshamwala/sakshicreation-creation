import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BasicTable from '@/component/common_component/Table/themetable';
import { TableCell, Box, Typography, Button } from '@mui/material';
import DateRangePicker from '@/component/daterangepicker';  // Your custom component
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

  // State for Date objects (used by DateRangePicker)
  const [startDate, setStartDate] = useState<Date | null>(moment().subtract(30, 'days').toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());

  // State for formatted strings to send to API
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
  });

  const [designers, setDesigners] = useState<DesignerPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data on mount and whenever dateRange changes
  useEffect(() => {
    fetchDesignerData();
  }, [dateRange]); // Re-fetch when dateRange changes

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

  // Handle Apply button click (or you can auto-fetch on change)
  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      const newDateRange = {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
      };
      setDateRange(newDateRange);
      // fetch will trigger automatically due to useEffect
    }
  };

  // Optional: Auto-fetch on date change (remove Apply button if you use this)
  // useEffect(() => {
  //   handleApplyDateRange();
  // }, [startDate, endDate]);

  const displayedDateRange = startDate && endDate
    ? `${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`
    : 'Select date range';

  if (loading) {
    return <Typography>Loading designer data...</Typography>;
  }

  return (
    <div>
      {/* Date Range Picker Section */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />

        {/* Optional Apply Button - remove if you auto-fetch on change */}
        <Button variant="contained" color="primary" onClick={handleApplyDateRange}>
          Apply
        </Button>
      </Box>

      {/* Display selected range */}
      <Typography variant="subtitle1" sx={{ mb: 2, color: '#555' }}>
        Showing data for: <strong>{displayedDateRange}</strong>
      </Typography>

      {/* Table */}
      <BasicTable
        tableHeader={columns}
        rowData={designers}
        showDatePicker={false} // Already handled above
        renderRow={(row: any) => (
          <>
            <TableCell>
              <Box sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}>
                {row.name}
                {/* Optional: Add chevron if clickable */}
                {/* <FaChevronRight size={14} /> */}
              </Box>
            </TableCell>
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
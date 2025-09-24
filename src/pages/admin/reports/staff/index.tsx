import React, { useState, useEffect, useMemo } from 'react';
import { Box, TableCell, Button, TextField, Popover, List, ListItem, ListItemText } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';
import { useAppSelector } from '@/store';
import { companyOptions } from '@/constants';
import Request from '@/services/axios';
import Loader from '@/component/common_component/loader';
import TabComponent from '@/component/Dialog/TabComponent';

const columns = [
  { id: 'staffName', label: 'Staff Name' },
  { id: 'companyName', label: 'Company' },
  { id: 'doneTasks', label: 'Tasks Done' },
  { id: 'rescheduledTasks', label: 'Rescheduled Tasks' },
  { id: 'partyVisit', label: 'Party Visit' },
  { id: 'donePartyVisit', label: 'Done Party Visit' },
  { id: 'cancelledPartyVisit', label: 'Cancelled Party Visit' },
  { id: 'doneLeads', label: 'Leads Done' },
  { id: 'rescheduledLeads', label: 'Rescheduled Leads' },
  { id: 'ordersGiven', label: 'Orders Punched' },
  { id: 'totalSale', label: 'Total Sale' },
  { id: 'newToCustomerParties', label: 'New to Customer Convert' },
  { id: 'createdParties', label: 'New Customer Added' },
];

// Helper function to format date
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get date range based on preset
const getDateRange = (preset: string) => {
  const today = new Date();
  let startDate, endDate;

  switch (preset) {
    case 'today':
      startDate = new Date(today);
      endDate = new Date(today);
      break;
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      endDate = new Date(startDate);
      break;
    case 'lastWeek':
      endDate = new Date(today);
      endDate.setDate(today.getDate() - 1);
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);
      break;
    case 'lastMonth':
      endDate = new Date(today);
      endDate.setDate(today.getDate() - 1);
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
      startDate.setDate(1);
      break;
    default:
      return { startDate: today, endDate: today };
  }

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};

const StaffPage = () => {
  const [tab, setTab] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('lastWeek');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const { user } = useAppSelector((state) => state.auth);

  // Permission checks
  const hasBothPermissions = user?.sakshi && user?.qp;
  const hasSakshiOnly = user?.sakshi && !user?.qp;
  const hasQpOnly = !user?.sakshi && user?.qp;

  // Determine company name and API endpoint based on permissions
  const getCompanyConfig = () => {
    if (hasBothPermissions) {
      return {
        companyName: companyOptions[tab],
        apiEndpoint: tab === 0 ? '/api/report/getsc' : '/api/report/getqp'
      };
    } else if (hasSakshiOnly) {
      return {
        companyName: companyOptions[0],
        apiEndpoint: '/api/report/getsc'
      };
    } else if (hasQpOnly) {
      return {
        companyName: companyOptions[1],
        apiEndpoint: '/api/report/getqp'
      };
    }
    return { companyName: '', apiEndpoint: '' };
  };

  const { companyName, apiEndpoint } = getCompanyConfig();

  // Excel headers and data
  const excelHeaders = useMemo(() => [
    'Staff Name',
    'Company',
    'Tasks Done',
    'Rescheduled Tasks',
    'Party Visit',
    'Done Party Visit',
    'Cancelled Party Visit',
    'Leads Done',
    'Rescheduled Leads',
    'Orders Punched',
    'Total Sale',
    'New to Customer Convert',
    'New Customer Added'
  ], []);

  const excelData = useMemo(() => {
    return reportData.map(row => ({
      'Staff Name': row.staffName,
      'Company': row.companyName,
      'Tasks Done': row.doneTask,
      'Cancelled Tasks': row.cancelledTasks,
      'Rescheduled Tasks': row.rescheduledTasks,
      'Party Visit': row.partyVisit,
      'Done Party Visit': row.donePartyVisit,
      'Cancelled Party Visit': row.cancelledPartyVisit,
      'Leads Done': row.doneLeads,
      'Cancelled Leads': row.cancelledLeads,
      'Rescheduled Leads': row.rescheduledLeads,
      'Orders Punched': row.ordersGiven,
      'Total Sale': row.totalSale,
      'New to Customer Convert': row.newToCustomerParties,
      'New Customer Added': row.createdParties
    }));
  }, [reportData]);

  // Fetch report data
  const fetchReport = async () => {
    if (!startDate || !endDate || !apiEndpoint) return;

    setLoading(true);
    setError(null);
    try {
      const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";
      const url = `${BaseURL}${apiEndpoint}`;

      const response = await Request.post(url, { startDate, endDate });

      if (response.data.success) {
        // Use API data as-is
        setReportData(response.data.data);
      } else {
        setError(response.data.message);
        setReportData([]);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setError(error.response ? error.response.data.message : 'Network error');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Date picker logic
  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last Week', value: 'lastWeek' },
    { label: 'Last Month', value: 'lastMonth' },
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    const { startDate, endDate } = getDateRange(preset);
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setStartDate(startDate);
    setEndDate(endDate);
    handleClose();
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      setSelectedPreset('custom');
      setStartDate(customStartDate);
      setEndDate(customEndDate);
      handleClose();
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'date-range-popover' : undefined;

  const getDisplayText = () => {
    if (selectedPreset === 'custom') {
      return `${customStartDate} to ${customEndDate}`;
    }
    const preset = presets.find(p => p.value === selectedPreset);
    return preset ? preset.label : 'Select Date Range';
  };

  const handleTaskClick = (staffId) => {
    const url = `/admin/assign-task?staffId=${staffId}&startDate=${startDate}&endDate=${endDate}&status=completed,cancelled`;
    window.open(url, '_blank');
  };

  // Set initial date range
  useEffect(() => {
    const { startDate: initialStart, endDate: initialEnd } = getDateRange('lastWeek');
    setStartDate(initialStart);
    setEndDate(initialEnd);
    setCustomStartDate(initialStart);
    setCustomEndDate(initialEnd);
  }, []);

  // Fetch data when tab, dates, or endpoint changes
  useEffect(() => {
    if (user) fetchReport();
  }, [tab, startDate, endDate, apiEndpoint]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Conditionally render tabs based on permissions */}
      {hasBothPermissions && <TabComponent activeTab={tab} setActiveTab={setTab} />}

      {/* Show company name when user has only one permission */}
      {!hasBothPermissions && companyName && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          Showing data for: {companyName}
        </Box>
      )}

      {/* Date Range Picker */}
      <Box sx={{ mb: 3 }}>
        <Button
          aria-describedby={id}
          variant="outlined"
          onClick={handleClick}
          sx={{ minWidth: 200, justifyContent: 'flex-start' }}
        >
          {getDisplayText()}
        </Button>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <Box sx={{ p: 2, width: 300 }}>
            <List>
              {presets.map((preset) => (
                <ListItem
                  button
                  key={preset.value}
                  onClick={() => handlePresetSelect(preset.value)}
                  selected={selectedPreset === preset.value}
                >
                  <ListItemText primary={preset.label} />
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
              <TextField
                label="Start Date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ mb: 1 }}
              />
              <TextField
                label="End Date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ mb: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleCustomDateChange}
                disabled={!customStartDate || !customEndDate}
                fullWidth
              >
                Apply Custom Range
              </Button>
            </Box>
          </Box>
        </Popover>
      </Box>

      {loading && <Loader />}

      {/* Staff Table with Excel Download */}
      {!loading && reportData.length > 0 ? (
        <BasicTable
          showDatePicker={false}
          showFillter={false}
          showSearch={false}
          showExcelDownload={true}
          excelHeaders={excelHeaders}
          excelData={excelData}
          tableHeader={columns}
          rowData={reportData}
          renderRow={(row) => {
    console.log("DEBUG : row:", row);
    return (<>
              <TableCell sx={{ fontWeight: 500, cursor: 'pointer' }}>
                {row.staffName}
              </TableCell>
              <TableCell>{row.companyName}</TableCell>
              <TableCell onClick={() => handleTaskClick(row.staffId)} sx={{ cursor: 'pointer' }}>
                {row.doneTask}
              </TableCell>
              <TableCell>{row.rescheduledTasks}</TableCell>
              <TableCell>{row.partyVisit}</TableCell>
              <TableCell>{row.donePartyVisit}</TableCell>
              <TableCell>{row.cancelledPartyVisit}</TableCell>
              <TableCell>{row.doneLeads}</TableCell>
              <TableCell>{row.rescheduledLeads}</TableCell>
              <TableCell>{row.ordersGiven}</TableCell>
              <TableCell>{row.totalSale}</TableCell>
              <TableCell>{row.newToCustomerParties}</TableCell>
              <TableCell>{row.createdParties}</TableCell>
            </>);
}}
        />
      ) : (
        !loading && (
          <Box sx={{ textAlign: 'center', color: 'gray', mt: 4 }}>
            No data found for {companyName} in the selected date range.
          </Box>
        )
      )}
    </Box>
  );
};

export default StaffPage;
import React, { useState, useEffect, useMemo } from 'react';
import { Box, TableCell, Button, TextField, Popover, List, ListItem, ListItemText, Chip, Menu, MenuItem, Checkbox, FormControlLabel, Typography, Stack, Paper, Grid, Divider, Table, TableBody, TableContainer, TableHead, TableRow } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';
import { useAppDispatch, useAppSelector } from '@/store';
import { companyOptions } from '@/constants';
import Request from '@/services/axios';
import Loader from '@/component/common_component/loader';
import TabComponent from '@/component/Dialog/TabComponent';
import { getCompanyWisePermission } from '@/utills/utills';
import FilterDropdown from '@/component/fillter';
import { getAllStaffThunk } from '@/store/slices/staffSlice';

// Task reasons for filtering
const TASK_REASONS = [
  'delivery',
  'getpayment',
  'getvisit',
  'order',
  'complain',
  'sampleapproval',
  'other'
];

const REASON_LABELS = {
  delivery: 'Delivery',
  getpayment: 'Get Payment',
  getvisit: 'Visit',
  order: 'Order',
  complain: 'Complain',
  sampleapproval: 'Sample Approval',
  other: 'Other'
};

// Lead reasons for filtering
const LEAD_REASONS = [
  'coldcall',
  'proofapproval',
  'inquirycall',
  'confirmationcall',
  'other'
];

const LEAD_LABELS = {
  coldcall: 'Cold Call',
  proofapproval: 'Proof Approval',
  inquirycall: 'Enquiry Call',
  confirmationcall: 'Confirmation Call',
  other: 'Others'
};

const STATUS_TYPES = ['total', 'completed', 'cancelled', 'pending', 'rescheduled'];

const STATUS_LABELS = {
  total: 'Total',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending: 'Pending',
  rescheduled: 'Rescheduled'
};

// Function to format reason for URL parameter (add spaces where needed)
const formatReasonForUrl = (reason: string): string => {
  const reasonMap: { [key: string]: string } = {
    'getpayment': 'Get Payment',
    'sampleapproval': 'Sample Approval',
    'coldcall': 'Cold Call',
    'proofapproval': 'Proof Approval',
    'inquirycall': 'Enquiry Call',
    'confirmationcall': 'Confirmation Call',
    'delivery': 'Delivery',
    'getvisit': 'Visit',
    'order': 'Order',
    'complain': 'Complain',
    'other': 'Other'
  };

  return reasonMap[reason] || reason;
};

// Generate dynamic columns for tasks - grouped by status first, then reason
const generateTaskColumns = (selectedReasons: string[]) => {
  const baseColumns = [
    { id: 'srNo', label: 'Sr. No.' },
    { id: 'staffName', label: 'Staff Name' },
    { id: 'companyName', label: 'Company' }
  ];

  // Add columns grouped by status first
  STATUS_TYPES.forEach(status => {
    selectedReasons.forEach(reason => {
      baseColumns.push({
        id: `task_${reason}_${status}`,
        label: `${REASON_LABELS[reason]} ${STATUS_LABELS[status]}`
      });
    });
  });

  return baseColumns;
};

// Generate dynamic columns for leads - grouped by status first, then reason
const generateLeadColumns = (selectedLeadReasons: string[]) => {
  const baseColumns = [
    { id: 'srNo', label: 'Sr. No.' },
    { id: 'staffName', label: 'Staff Name' },
    { id: 'companyName', label: 'Company' }
  ];

  // Add columns grouped by status first
  STATUS_TYPES.forEach(status => {
    selectedLeadReasons.forEach(reason => {
      baseColumns.push({
        id: `lead_${reason}_${status}`,
        label: `${LEAD_LABELS[reason]} ${STATUS_LABELS[status]}`
      });
    });
  });

  return baseColumns;
};

const visitSummaryColumns = [
  { id: 'staffName', label: 'Staff Name' },
  { id: 'visit', label: 'Total Visits', description: 'Total completed visits' },
  { id: 'newPartyVisit', label: 'New Party Visits', description: 'Visits to NEW parties' },
  { id: 'newPartyToCustomer', label: 'New to Customer', description: 'NEW parties converted to CUSTOMER' },
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
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('lastWeek');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedTaskReasons, setSelectedTaskReasons] = useState<string[]>(TASK_REASONS);
  const [selectedLeadReasons, setSelectedLeadReasons] = useState<string[]>(LEAD_REASONS);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const [taskFilterAnchorEl, setTaskFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [leadFilterAnchorEl, setLeadFilterAnchorEl] = useState<null | HTMLElement>(null);
  const { user } = useAppSelector((state) => state.auth);
  const { staffList = [], loading: staffLoading } = useAppSelector((state) => state.staff || {});

  // Permission checks
  const hasBothPermissions = getCompanyWisePermission(0)
  const hasSakshiOnly = getCompanyWisePermission(3)
  const hasQpOnly = getCompanyWisePermission(4)

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

  // Generate dynamic columns based on selected reasons
  const taskColumns = useMemo(() => generateTaskColumns(selectedTaskReasons), [selectedTaskReasons]);
  const leadColumns = useMemo(() => generateLeadColumns(selectedLeadReasons), [selectedLeadReasons]);

  // Sales staff filter
  const salesStaff = useMemo(() =>
    staffList.filter((staff: any) => staff.role?.roleName?.includes('Sales Staff')),
    [staffList]
  );


  const uniqueStaffNames = useMemo(() =>
    [...new Set(salesStaff.map((staff: any) => staff.name))].sort(),
    [salesStaff]
  );

  // Filtered report data based on staff filter
  const filteredReportData = useMemo(() => {
    if (!filters['Staff Name'] || filters['Staff Name'].length === 0) {
      return reportData;
    }
    return reportData.filter((row: any) =>
      filters['Staff Name'].includes(row.staffName)
    );
  }, [reportData, filters]);

  // Handle remove filter
  const handleRemoveFilter = (field: string, value?: string) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[field] = newFilters[field].filter((v: string) => v !== value);
      if (newFilters[field].length === 0) {
        delete newFilters[field];
      }
    } else {
      delete newFilters[field];
    }
    setFilters(newFilters);
  };

  // Fetch staff on mount
  useEffect(() => {
    if (staffList.length === 0 && !staffLoading) {
      dispatch(getAllStaffThunk());
    }
  }, [dispatch, staffList.length, staffLoading]);

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
        setReportData(response.data.data);
        setSummary(response.data.summary);
      } else {
        setError(response.data.message);
        setReportData([]);
        setSummary(null);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setError(error.response ? error.response.data.message : 'Network error');
      setReportData([]);
      setSummary(null);
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

  // Filter handlers for tasks
  const handleTaskFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setTaskFilterAnchorEl(event.currentTarget);
  };

  const handleTaskFilterClose = () => {
    setTaskFilterAnchorEl(null);
  };

  const handleTaskReasonToggle = (reason: string) => {
    setSelectedTaskReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSelectAllTaskReasons = () => {
    setSelectedTaskReasons(selectedTaskReasons.length === TASK_REASONS.length ? [] : TASK_REASONS);
  };

  // Filter handlers for leads
  const handleLeadFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setLeadFilterAnchorEl(event.currentTarget);
  };

  const handleLeadFilterClose = () => {
    setLeadFilterAnchorEl(null);
  };

  const handleLeadReasonToggle = (reason: string) => {
    setSelectedLeadReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSelectAllLeadReasons = () => {
    setSelectedLeadReasons(selectedLeadReasons.length === LEAD_REASONS.length ? [] : LEAD_REASONS);
  };

  // Task click handlers - Fixed URL parameters with proper reason formatting
  const handleTaskClick = (staffId: string, companyId: string, reason: string, status: string, value: number) => {
    // If zero, do nothing
    if (!value || value === 0) return;

    let params = `staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}`;

    // Only add status if it is not "total"
    if (status !== 'total') {
      params += `&status=${status}`;
    }

    // Only add reason if not "all"
    if (reason !== 'all') {
      const formattedReason = formatReasonForUrl(reason);
      params += `&reason=${encodeURIComponent(formattedReason)}`;
    }

    window.open(`/admin/assign-task?${params}`, '_blank');
  };


  // Lead click handlers - Fixed URL parameters with proper reason formatting
  const handleLeadClick = (staffId: string, companyId: string, reason: string, status: string, value: number) => {
    if (!value || value === 0) return;

    let params = `staffId=${staffId}&companyName=${companyId}&startDate=${startDate}&endDate=${endDate}&c=${companyName}`;

    if (status !== 'total') {
      params += `&status=${status}`;
    }

    if (reason !== 'all') {
      const formattedReason = formatReasonForUrl(reason);
      params += `&reason=${encodeURIComponent(formattedReason)}`;
    }

    window.open(`/admin/party-call?${params}`, '_blank');
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

      {/* Controls Row */}
      <Box
        sx={{
          mb: 3,
          mt: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Side Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            aria-describedby={id}
            variant="outlined"
            onClick={handleClick}
            sx={{ minWidth: 200, justifyContent: 'flex-start' }}
          >
            {getDisplayText()}
          </Button>

          <Button
            variant="outlined"
            onClick={handleTaskFilterClick}
            sx={{ minWidth: 200, justifyContent: 'flex-start' }}
          >
            Task Reasons ({selectedTaskReasons.length})
          </Button>

          <Button
            variant="outlined"
            onClick={handleLeadFilterClick}
            sx={{ minWidth: 200, justifyContent: 'flex-start' }}
          >
            Lead Reasons ({selectedLeadReasons.length})
          </Button>
        </Box>

        {/* Right Side Filter */}
        <Box sx={{ marginLeft: 'auto' }}>
          <FilterDropdown
            filterOptions={['Staff Name']}
            uniqueValues={uniqueStaffNames}
            onFiltersChange={setFilters}
            filters={filters}
            selectedField={selectedField}
            onFieldSelect={setSelectedField}
          />
        </Box>
      </Box>


      {/* Selected Reasons Chips - FIXED: Now showing both task and lead chips */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {selectedTaskReasons.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mr: 1, fontWeight: 'bold' }}>Tasks:</Typography>
            {selectedTaskReasons.map(reason => (
              <Chip
                key={reason}
                label={REASON_LABELS[reason]}
                size="small"
                onDelete={() => handleTaskReasonToggle(reason)}
                color="primary"
                variant="outlined"
              />
            ))}
          </>
        )}

        {selectedLeadReasons.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mr: 1, ml: 2, fontWeight: 'bold' }}>Leads:</Typography>
            {selectedLeadReasons.map(reason => (
              <Chip
                key={reason}
                label={LEAD_LABELS[reason]}
                size="small"
                onDelete={() => handleLeadReasonToggle(reason)}
                color="primary"
                variant="outlined"
              />
            ))}
          </>
        )}
      </Box>

      {/* Date Range Popover */}
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

      {/* Task Reason Filter Menu */}
      <Menu
        anchorEl={taskFilterAnchorEl}
        open={Boolean(taskFilterAnchorEl)}
        onClose={handleTaskFilterClose}
        PaperProps={{
          style: {
            width: 250,
          },
        }}
      >
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedTaskReasons.length === TASK_REASONS.length}
                indeterminate={selectedTaskReasons.length > 0 && selectedTaskReasons.length < TASK_REASONS.length}
                onChange={handleSelectAllTaskReasons}
              />
            }
            label="Select All Tasks"
          />
        </MenuItem>
        {TASK_REASONS.map((reason) => (
          <MenuItem key={reason} onClick={() => handleTaskReasonToggle(reason)}>
            <Checkbox checked={selectedTaskReasons.includes(reason)} />
            <ListItemText primary={REASON_LABELS[reason]} />
          </MenuItem>
        ))}
      </Menu>

      {/* Lead Reason Filter Menu */}
      <Menu
        anchorEl={leadFilterAnchorEl}
        open={Boolean(leadFilterAnchorEl)}
        onClose={handleLeadFilterClose}
        PaperProps={{
          style: {
            width: 250,
          },
        }}
      >
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedLeadReasons.length === LEAD_REASONS.length}
                indeterminate={selectedLeadReasons.length > 0 && selectedLeadReasons.length < LEAD_REASONS.length}
                onChange={handleSelectAllLeadReasons}
              />
            }
            label="Select All Leads"
          />
        </MenuItem>
        {LEAD_REASONS.map((reason) => (
          <MenuItem key={reason} onClick={() => handleLeadReasonToggle(reason)}>
            <Checkbox checked={selectedLeadReasons.includes(reason)} />
            <ListItemText primary={LEAD_LABELS[reason]} />
          </MenuItem>
        ))}
      </Menu>

      {(loading || staffLoading) && <Loader />}

      {/* Summary Section */}
      {!loading && !staffLoading && summary && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Summary Report
          </Typography>

          <Grid container spacing={3}>
            {/* Party Visit Summary */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Party Visit Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Total New Party Visits:</Typography>
                  <Typography variant="body1" fontWeight="bold">{summary.totalNewPartyVisits || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">New Party Visits to Customer:</Typography>
                  <Typography variant="body1" fontWeight="bold">{summary.totalNewToCustomer || 0}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Order Summary */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Order Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Total Stationary Orders:</Typography>
                  <Typography variant="body1" fontWeight="bold">{summary.totalStationaryOrders || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Total Booklet Orders:</Typography>
                  <Typography variant="body1" fontWeight="bold">{summary.totalBookletOrders || 0}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Sales Summary */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Sales Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Total Stationary Sales:</Typography>
                <Typography variant="body1" fontWeight="bold">₹{(summary.totalStationarySales || 0).toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">Total Booklet Sales:</Typography>
                <Typography variant="body1" fontWeight="bold">₹{(summary.totalBookletSales || 0).toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total Sales:</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  ₹{(summary.totalSales || 0).toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            {/* Itemwise Stationary Orders */}
            {summary.totalStationaryItemwise && summary.totalStationaryItemwise.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Stationary Orders (Itemwise)
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item Name</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.totalStationaryItemwise.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">₹{item.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            {/* Itemwise Booklet Orders */}
            {summary.totalBookletItemwise && summary.totalBookletItemwise.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Booklet Orders (Itemwise)
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item Name</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.totalBookletItemwise.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">₹{item.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {!loading && !staffLoading && filteredReportData.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>
            Visit Report
          </Typography>
          <BasicTable
            showDatePicker={false}
            showFillter={false}
            showSearch={false}
            tableHeader={visitSummaryColumns}
            rowData={filteredReportData}
            renderRow={(row, index) => {
              return (
                <>
                  <TableCell sx={{ fontWeight: 500 }}>{row.staffName}</TableCell>
                  <TableCell>{row.visit || 0}</TableCell>
                  <TableCell>{row.newPartyVisit || 0}</TableCell>
                  <TableCell>{row.newPartyToCustomer || 0}</TableCell>
                </>
              );
            }}
          />
        </>
      )}

      {/* Tasks Table */}
      {!loading && !staffLoading && filteredReportData.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>
            Tasks Report
          </Typography>
          <BasicTable
            showDatePicker={false}
            showFillter={false}
            showSearch={false}
            tableHeader={taskColumns}
            rowData={filteredReportData}
            renderRow={(row, index) => {
              return (
                <>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {row.staffName}
                  </TableCell>
                  <TableCell>{row.companyName}</TableCell>

                  {/* Dynamic task reason columns - grouped by status first */}
                  {STATUS_TYPES.map(status => (
                    selectedTaskReasons.map(reason => {
                      const taskData = row.tasksByReason?.[reason];
                      let value = 0;
                      let displayValue = '0';

                      if (taskData) {
                        // In your tasks table renderRow function, the switch statement already has 'pending' case:
                        switch (status) {
                          case 'total':
                            value = taskData.total || 0;
                            break;
                          case 'completed':
                            value = taskData.completed || 0;
                            break;
                          case 'cancelled':
                            value = taskData.cancelled || 0;
                            break;
                          case 'pending':
                            value = taskData.pending || 0; // This will now be included
                            break;
                          case 'rescheduled':
                            value = taskData.rescheduled || 0;
                            break;
                        }
                        displayValue = value.toString();
                      }

                      return (
                        <TableCell
                          key={`task_${reason}_${status}`}
                          onClick={() => handleTaskClick(row.staffId, row.companyId, reason, status, value)}
                          sx={{
                            cursor: value > 0 ? 'pointer' : 'default',
                          }}
                        >
                          {displayValue}
                        </TableCell>
                      );
                    })
                  ))}
                </>
              );
            }}
          />
        </>
      )}

      {/* Leads Table */}
      {!loading && !staffLoading && filteredReportData.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>
            Leads Report
          </Typography>
          <BasicTable
            showDatePicker={false}
            showFillter={false}
            showSearch={false}
            tableHeader={leadColumns}
            rowData={filteredReportData}
            renderRow={(row, index) => {
              return (
                <>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {row.staffName}
                  </TableCell>
                  <TableCell>{row.companyName}</TableCell>

                  {/* Dynamic lead reason columns - grouped by status first */}
                  {STATUS_TYPES.map(status => (
                    selectedLeadReasons.map(reason => {
                      const leadData = row.leadsByReason?.[reason];
                      let value = 0;
                      let displayValue = '0';

                      if (leadData) {
                        switch (status) {
                          case 'total':
                            value = leadData.total || 0;
                            break;
                          case 'completed':
                            value = leadData.completed || 0;
                            break;
                          case 'cancelled':
                            value = leadData.cancelled || 0;
                            break;
                          case 'rescheduled':
                            value = leadData.rescheduled || 0;
                            break;
                        }
                        displayValue = value.toString();
                      }

                      return (
                        <TableCell
                          key={`lead_${reason}_${status}`}
                          onClick={() => value > 0 && handleLeadClick(row.staffId, row.companyId, reason, status, value)}
                          sx={{
                            cursor: value > 0 ? 'pointer' : 'default',
                          }}
                        >
                          {displayValue}
                        </TableCell>
                      );
                    })
                  ))}
                </>
              );
            }}
          />
        </>
      )}

      {!loading && !staffLoading && filteredReportData.length === 0 && (
        <Box sx={{ textAlign: 'center', color: 'gray', mt: 4 }}>
          No data found for {companyName} in the selected date range.
        </Box>
      )}
    </Box>
  );
};

export default StaffPage;
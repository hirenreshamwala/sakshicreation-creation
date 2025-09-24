import React, { useState, useEffect, useMemo } from 'react';
import { Box, Paper, Tabs, Tab, TableCell, Button, TextField, Popover, List, ListItem, ListItemText } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';
import { useRouter } from 'next/router';
import { companyOptions } from '@/constants';
import Request from '@/services/axios';
import Loader from '@/component/common_component/loader';
import { useAppSelector } from '@/store';
import TabComponent from '@/component/Dialog/TabComponent';

const columns = [
  { id: 'name', label: 'Staff Name' },
  { id: 'department', label: 'Company' },
  { id: 'task', label: 'Task Done' },
  { id: 'lead', label: 'Party Call Done' },
  { id: 'orders', label: 'Orders Punched' },
  { id: 'newtocustomer', label: 'New to Customer Convert' },
  { id: 'newcustomeradded', label: 'New Customer Added' },
];

// Helper functions (formatDate, getDateRange) - same as before
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

// DateRangePickerWithPresets component - same as before
const DateRangePickerWithPresets = ({ onDateRangeChange }: { onDateRangeChange: (start: string, end: string) => void }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('lastWeek');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last Week', value: 'lastWeek' },
    { label: 'Last Month', value: 'lastMonth' },
  ];

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    const { startDate, endDate } = getDateRange(preset);
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    onDateRangeChange(startDate, endDate);
    handleClose();
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      setSelectedPreset('custom');
      onDateRangeChange(customStartDate, customEndDate);
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

  return (
    <div>
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
    </div>
  );
};

const StaffPage = () => {
  const [tab, setTab] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth)
  console.log(user, 'user')

  // Determine if user has both permissions
  const hasBothPermissions = user?.sakshi && user?.qp;
  const hasSakshiOnly = user?.sakshi && !user?.qp;
  const hasQpOnly = !user?.sakshi && user?.qp;

  // Determine which company to show based on permissions
  const getSelectedCompanyName = () => {
    if (hasBothPermissions) {
      return companyOptions[tab];
    } else if (hasSakshiOnly) {
      return companyOptions[0]; // Replace with actual company name from companyOptions
    } else if (hasQpOnly) {
      return companyOptions[1]; // Replace with actual company name from companyOptions
    }
    return ''; // No permissions case
  };

  const selectedCompanyName = getSelectedCompanyName();

  // Excel के लिए headers और data prepare करें
  const excelHeaders = useMemo(() => [
    'Staff Name',
    'Company',
    'Task Done',
    'Party Call Done',
    'Orders Punched',
    'New to Customer Convert',
    'New Customer Added'
  ], []);

  const excelData = useMemo(() => {
    return reportData.map(row => ({
      'Staff Name': row.name,
      'Company': row.department,
      'Task Done': row.task,
      'Party Call Done': row.lead,
      'Orders Punched': row.orders,
      'New to Customer Convert': row.newtocustomer,
      'New Customer Added': row.newcustomeradded
    }));
  }, [reportData]);
  console.log(reportData, "zdgsdgsg")

  const fetchStaffReport = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);
    try {
      const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";
      const url = `${BaseURL}/api/report/get`;

      // Prepare request body based on permissions
      const requestBody: any = {
        startDate,
        endDate,
      };

      // Add company ID based on permissions if user doesn't have both
      if (!hasBothPermissions) {
        if (hasSakshiOnly) {
          requestBody.companyId = user?.sakshiCompanyId; // Replace with actual company ID
        } else if (hasQpOnly) {
          requestBody.companyId = user?.qpCompanyId; // Replace with actual company ID
        }
      }
      // If user has both permissions, don't send companyId - let the backend handle all companies

      const response = await Request.post(url, requestBody);

      if (response.data.success) {
        const apiData = response.data.data;

        const mappedTableData = apiData.map((staff) => {
          const companyData = staff.companyBreakdown.find(
            (c) => c.companyName === selectedCompanyName
          );

          if (!companyData) return null;

          return {
            staffId: staff.staffId,
            name: staff.staffName,
            department: companyData._id,
            task: companyData.completedTasks + companyData.cancelledTasks,
            lead: companyData.completedLeads + companyData.cancelledLeads,
            orders: companyData.ordersGiven,
            newtocustomer: companyData.newToCustomerParties,
            newcustomeradded: companyData.newPartiesStillNew,
          };
        }).filter(Boolean);

        setReportData(mappedTableData);
      } else {
        setError(response.data.message);
        setReportData([]);
      }
    } catch (error) {
      console.error('Error fetching staff report:', error);
      setError(error.response ? error.response.data.message : 'Network error');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchStaffReport();
  }, [tab, startDate, endDate, selectedCompanyName]);

  useEffect(() => {
    const { startDate: initialStart, endDate: initialEnd } = getDateRange('lastWeek');
    setStartDate(initialStart);
    setEndDate(initialEnd);
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      {/* Conditionally render tabs based on permissions */}
      {hasBothPermissions && <TabComponent activeTab={tab} setActiveTab={setTab} />}

      {/* Show current company name when user has only one permission */}
      {!hasBothPermissions && selectedCompanyName && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          Showing data for: {selectedCompanyName}
        </Box>
      )}

      {/* Date Range Picker */}
      <Box sx={{ mb: 3 }}>
        <DateRangePickerWithPresets
          onDateRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
      </Box>

      {loading && <Loader />}

      {error && (
        <Box sx={{ color: 'error.main', textAlign: 'center', mb: 2 }}>
          Error: {error}
        </Box>
      )}

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
          renderRow={(row) => (
            <>
              <TableCell sx={{ fontWeight: 500, cursor: 'pointer' }}>
                {row.name}
              </TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{row.task}</TableCell>
              <TableCell>{row.lead}</TableCell>
              <TableCell>{row.orders}</TableCell>
              <TableCell>{row.newtocustomer}</TableCell>
              <TableCell>{row.newcustomeradded}</TableCell>
            </>
          )}
        />
      ) : (
        !loading && (
          <Box sx={{ textAlign: 'center', color: 'gray', mt: 4 }}>
            No data found for {selectedCompanyName} in the selected date range.
          </Box>
        )
      )}
    </Box>
  );
};

export default StaffPage;
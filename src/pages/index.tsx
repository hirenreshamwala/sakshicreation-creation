"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Box,
  Button,
  Popover,
  List,
  ListItem,
  ListItemText,
  TextField,
  Card,
  CardContent,
  Typography,
  Divider,
  Paper,
  Stack,
  alpha
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import TabComponent from "@/component/Dialog/TabComponent";
import FilterDropdown from "@/component/fillter";
import TaskData from "@/component/dashboardPages/TaskData";
import LeadData from "@/component/dashboardPages/LeadData";
import VisitData from "@/component/dashboardPages/VisitData";
// import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import { formatDateToDDMMYYYY, getCompanyWisePermission } from "@/utills/utills";
import LeadManagementPage from "./admin/party-call";
import CustomerData from "@/component/dashboardPages/CustomerData";
import Request from "@/services/axios";
import Loader from "@/component/common_component/loader";
import InactivePartiesData from "@/component/dashboardPages/InactivePartiesData";
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StoreIcon from '@mui/icons-material/Store';

const IndexPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth)
  // const { companies } = useAppSelector((state) => state.company);
  const { staffList } = useAppSelector((state) => state.staff);

  // --- Tabs ---
  const [companyTab, setCompanyTab] = useState(0);

  // --- Date Picker ---
  const [selectedPreset, setSelectedPreset] = useState("lastWeek");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // --- Staff Filter ---
  const [staffFilter, setStaffFilter] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>("Staff Name");

  // --- Single Data State ---
  const [apiData, setApiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);


  // Permissions
  const hasSakshi = !!getCompanyWisePermission(5);
  const hasQP = !!getCompanyWisePermission(6);
  const hasBothCompanies = hasSakshi && hasQP;

  const getCompanyConfig = () => {
    if (hasBothCompanies) {
      return {
        companyName: companyTab === 0 ? 'Sakshi' : 'QP',
        apiEndpoint: companyTab === 0 ? '/api/report/getsc' : '/api/report/getqp'
      };
    } else if (hasSakshi) {
      return { companyName: 'Sakshi', apiEndpoint: '/api/report/getsc' };
    } else if (hasQP) {
      return { companyName: 'QP', apiEndpoint: '/api/report/getqp' };
    }
    return { companyName: '', apiEndpoint: '' };
  };

  const { apiEndpoint, companyName } = getCompanyConfig();

  // Fetch companies and staff on mount
  useEffect(() => {
    // if (!companies.length && user?.id) dispatch(getAllCompaniesThunk(true));
    if (!staffList.length && user?.id) dispatch(getAllStaffThunk());
  }, []);

  // Date helper
  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

  const getDateRange = (preset: string) => {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    switch (preset) {
      case "today":
        break;
      case "yesterday":
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case "lastWeek":
        end.setDate(today.getDate() - 1);
        start.setDate(today.getDate() - 7);
        break;
      case "lastMonth":
        end.setDate(today.getDate() - 1);
        start.setMonth(today.getMonth() - 1);
        start.setDate(1);
        break;
      default:
        break;
    }
    return { startDate: formatDate(start), endDate: formatDate(end) };
  };

  // Initialize date range
  useEffect(() => {
    if (selectedPreset === "custom") return;

    const { startDate: s, endDate: e } = getDateRange(selectedPreset);
    setStartDate(s);
    setEndDate(e);
    setCustomStartDate(s);
    setCustomEndDate(e);
  }, [selectedPreset]);


  // Main API Call Function
  const fetchData = async () => {
    if (!startDate || !endDate || !apiEndpoint) return;

    setLoading(true);
    try {
      const BaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8383';
      const res = await Request.post(`${BaseURL}${apiEndpoint}`, {
        startDate,
        endDate
      });

      if (res.data.success) {
        setApiData(res.data.data || []);
      } else {
        setApiData([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setApiData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate && apiEndpoint && user?.id) {
      fetchData();
    }
  }, [startDate, endDate, apiEndpoint, companyTab]);

  // Filter data based on staff selection - memoized for performance
  const filteredData = useMemo(() => {
    const filterArray = Array.isArray(staffFilter)
      ? staffFilter
      : staffFilter && Array.isArray(staffFilter["Staff Name"])
        ? staffFilter["Staff Name"]
        : [];

    if (!filterArray || filterArray.length === 0) return apiData;

    // Create a Set for O(1) lookup instead of O(n) array.some
    const filterSet = new Set(filterArray.map((f: string) => f.toLowerCase()));

    return apiData.filter((row) =>
      filterSet.has(row.staffName?.toLowerCase())
    );
  }, [apiData, staffFilter]);

  // Date Picker popover
  const presets = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last Week", value: "lastWeek" },
    { label: "Last Month", value: "lastMonth" },
  ];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handlePresetSelect = (preset: string) => {
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
      setSelectedPreset("custom");
      setStartDate(customStartDate);
      setEndDate(customEndDate);
      handleClose();
    }
  };

  // Handle field selection for FilterDropdown
  const handleFieldSelect = (field: string | null) => {
    setSelectedField(field);
  };

  // Handle filter changes from FilterDropdown
  const handleFiltersChange = (filters: { [key: string]: string[] }) => {
    setStaffFilter(filters["Staff Name"] || []);
  };

  // Compute filters prop dynamically
  const filters = staffFilter.length > 0 ? { "Staff Name": staffFilter } : {};

  const open = Boolean(anchorEl);
  const id = open ? "date-range-popover" : undefined;
  const getDisplayText = () =>
    selectedPreset === "custom"
      ? `${customStartDate} to ${customEndDate}`
      : presets.find((p) => p.value === selectedPreset)?.label || "Select Date Range";

  // Data sections configuration
  const dataSections = [
    {
      title: "Tasks",
      icon: <AssignmentIcon color="primary" />,
      component: <TaskData
        activeTab={companyTab}
        startDate={formatDateToDDMMYYYY(startDate)}
        endDate={formatDateToDDMMYYYY(endDate)}
        staffFilter={staffFilter}
        data={filteredData}
        loading={loading}
        companyName={companyName}
      />
    },
    {
      title: "Leads",
      icon: <PeopleIcon color="primary" />,
      component: <LeadData
        activeTab={companyTab}
        startDate={formatDateToDDMMYYYY(startDate)}
        endDate={formatDateToDDMMYYYY(endDate)}
        staffFilter={staffFilter}
        data={filteredData}
        loading={loading}
        companyName={companyName}
      />
    },
    {
      title: "Visits",
      icon: <CalendarTodayIcon color="primary" />,
      component: <VisitData
        activeTab={companyTab}
        startDate={formatDateToDDMMYYYY(startDate)}
        endDate={formatDateToDDMMYYYY(endDate)}
        staffFilter={staffFilter}
        data={filteredData}
        loading={loading}
        companyName={companyName}
      />
    },
    {
      title: "Customers",
      icon: <StoreIcon color="primary" />,
      component: <CustomerData
        activeTab={companyTab}
        startDate={formatDateToDDMMYYYY(startDate)}
        endDate={formatDateToDDMMYYYY(endDate)}
        staffFilter={staffFilter}
        data={filteredData}
        loading={loading}
        companyName={companyName}
      />
    }
  ];

  return (
    <Box sx={{
      p: { xs: 2, md: 3 },
      bgcolor: alpha('#f0f4f8', 0.7),
      minHeight: '100vh',
      backgroundImage: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)'
    }}>
      {/* Header */}
      {/* <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight={600}
          color="#1e293b"
          sx={{ mb: 1 }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="#64748b">
          {companyName} Performance Overview
        </Typography>
      </Box> */}

      {/* Tabs */}
      {hasBothCompanies && (
        <TabComponent activeTab={companyTab} setActiveTab={setCompanyTab} />
      )}

      {/* Inactive Parties */}
      <InactivePartiesData
        activeTab={companyTab}
        companyName={companyName}
      />

      {/* Date Picker and Filter in a single row */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box>
          <Button
            aria-describedby={id}
            variant="outlined"
            onClick={handleClick}
            sx={{ minWidth: 200, justifyContent: "flex-start" }}
          >
            {getDisplayText()}
          </Button>
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
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
              <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #eee" }}>
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
                  fullWidth
                  onClick={handleCustomDateChange}
                  disabled={!customStartDate || !customEndDate}
                >
                  Apply Custom Range
                </Button>
              </Box>
            </Box>
          </Popover>
        </Box>

        <Box>
          <FilterDropdown
            filterOptions={["Staff Name"]}
            uniqueValues={staffList
              .filter((s) => s.role?.roleName?.toLowerCase().includes("sales staff"))
              .map((s) => s.firstName + " " + s.lastName)}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            selectedField={selectedField}
            onFieldSelect={handleFieldSelect}
          />
        </Box>
      </Box>

      {/* Data Sections */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Loader />
        </Box>
      ) : (
        <Stack spacing={3}>
          {dataSections.map((section, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}
              >
                {section.icon}
                <Typography variant="h6" component="h2" fontWeight={600} color="#1e293b">
                  {section.title}
                </Typography>
              </Box>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {section.component}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default IndexPage;
"use client";

import React, { useState, useEffect } from "react";
import { Box, Button, Popover, List, ListItem, ListItemText, TextField } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import TabComponent from "@/component/Dialog/TabComponent";
import FilterDropdown from "@/component/fillter";
import TaskData from "@/component/dashboardPages/TaskData";
import LeadData from "@/component/dashboardPages/LeadData";
import VisitData from "@/component/dashboardPages/VisitData";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import { getCompanyWisePermission } from "@/utills/utills";
import LeadManagementPage from "./admin/party-call";
import CustomerData from "@/component/dashboardPages/CustomerData";
import Request from "@/services/axios";
import Loader from "@/component/common_component/loader";

const IndexPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.company);
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
    if (!companies.length) dispatch(getAllCompaniesThunk(true));
    dispatch(getAllStaffThunk());
  }, [companies.length]);

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
    if (startDate && endDate && apiEndpoint) {
      fetchData();
    }
  }, [startDate, endDate, apiEndpoint, companyTab]);

  // Filter data based on staff selection
  const filteredData = React.useMemo(() => {
    const filterArray = Array.isArray(staffFilter)
      ? staffFilter
      : staffFilter && Array.isArray(staffFilter["Staff Name"])
        ? staffFilter["Staff Name"]
        : [];

    if (!filterArray || filterArray.length === 0) return apiData;

    return apiData.filter((row) =>
      filterArray.some((f: string) => f.toLowerCase() === row.staffName.toLowerCase())
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

  return (
    <Box sx={{ p: 2 }}>
      {/* Tabs */}
      {/* {loading && <Loader />} */}
      {hasBothCompanies && <TabComponent activeTab={companyTab} setActiveTab={setCompanyTab} />}

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
        {/* Date Picker (Left) */}
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

        {/* Filter (Right) */}
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

      {/* TaskData Table */}
      {loading ? <Loader /> : <>
        <TaskData
          activeTab={companyTab}
          startDate={startDate}
          endDate={endDate}
          staffFilter={staffFilter}
          data={filteredData}
          loading={loading}
          companyName={companyName}
        />
        <LeadData
          activeTab={companyTab}
          startDate={startDate}
          endDate={endDate}
          staffFilter={staffFilter}
          data={filteredData}
          loading={loading}
          companyName={companyName}
        />
        <VisitData
          activeTab={companyTab}
          startDate={startDate}
          endDate={endDate}
          staffFilter={staffFilter}
          data={filteredData}
          loading={loading}
          companyName={companyName}
        />
        <CustomerData
          activeTab={companyTab}
          startDate={startDate}
          endDate={endDate}
          staffFilter={staffFilter}
          data={filteredData}
          loading={loading}
          companyName={companyName}
        />
      </>}
    </Box>
  );
};

export default IndexPage;
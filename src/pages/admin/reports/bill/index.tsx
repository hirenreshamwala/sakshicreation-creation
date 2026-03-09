"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DateRangePicker from "@/component/daterangepicker";
import moment from "moment";
import { toast } from "react-toastify";
import StaffService from "@/services/staff.service";
import { reportService } from "@/services/reportService";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeButton from "@/component/common_component/themebutton";

interface StaffMember {
    _id: string;
    firstName: string;
    lastName: string;
    role: {
        _id: string;
        roleName: string;
    };
}

const BillPage = () => {
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
    const defaultStartDate = moment().startOf("month").toDate();
    const defaultEndDate = moment().endOf("month").toDate();
    const [startDate, setStartDate] = useState<Date | null>(defaultStartDate);
    const [endDate, setEndDate] = useState<Date | null>(defaultEndDate);
    const [selectedStaffType, setSelectedStaffType] = useState<string>("");
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

    const staffTypes = [
        { value: "binder", label: "Binder" },
        { value: "printer", label: "Printer" },
        { value: "booklet-binder", label: "Booklet Binder" },
    ];

    // Fetch all staff on mount
    useEffect(() => {
        fetchStaff();
    }, []);

    // Filter staff when staff type changes
    useEffect(() => {
        if (selectedStaffType && staffMembers.length > 0) {
            const roleName = selectedStaffType === "booklet-binder" ? "Booklet Binder" : selectedStaffType;
            const filtered = staffMembers.filter(
                (staff) => staff.role?.roleName?.toLowerCase() === roleName?.toLowerCase()
            );
            setFilteredStaff(filtered);
            setSelectedStaff(null);
        } else {
            setFilteredStaff([]);
            setSelectedStaff(null);
        }
    }, [selectedStaffType, staffMembers]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const response = await StaffService.getAllStaff();
            if (response && Array.isArray(response)) {
                setStaffMembers(response);
            }
        } catch (error) {
            console.error("Error fetching staff:", error);
            toast.error("Failed to load staff members");
        } finally {
            setLoading(false);
        }
    };

    const handleStaffTypeChange = (event: any) => {
        setSelectedStaffType(event.value);
        setSelectedStaff(null)
    };

    const handleStaffChange = (event: any) => {
        const staffId = event.value;
        const staff = filteredStaff.find((s) => s._id === staffId);
        setSelectedStaff(staff || null);
    };

    const handleDownloadFullBill = async () => {
        if (!selectedStaff || !selectedStaffType) {
            toast.error("Please select a staff member");
            return;
        }

        setDownloading(true);
        try {
            const blob = await reportService.exportStaffBilling({
                staffId: selectedStaff._id,
                staffType: selectedStaffType as "binder" | "printer" | "booklet-binder",
                isFullBill: true,
            });

            // Download file
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            const staffName = `${selectedStaff.firstName} ${selectedStaff.lastName}`.trim();
            const fileName = `${staffName}_${selectedStaffType}_Full_Bill_${moment().format("DDMMYYYY_HHmm")}.xlsx`;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Full bill downloaded successfully");
        } catch (error: any) {
            console.error("Error downloading full bill:", error);
            toast.error(error.message || "Failed to download full bill");
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadMonthlyBill = async () => {
        if (!selectedStaff || !selectedStaffType) {
            toast.error("Please select a staff member");
            return;
        }

        if (!startDate || !endDate) {
            toast.error("Please select a date range");
            return;
        }

        setDownloading(true);
        try {
            const blob = await reportService.exportStaffBilling({
                staffId: selectedStaff._id,
                staffType: selectedStaffType as "binder" | "printer" | "booklet-binder",
                startDate: moment(startDate).format("YYYY-MM-DD"),
                endDate: moment(endDate).format("YYYY-MM-DD"),
                isFullBill: false,
            });

            // Download file
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            const staffName = `${selectedStaff.firstName} ${selectedStaff.lastName}`.trim();
            const monthYear = moment(startDate).format("MMMM_YYYY");
            const fileName = `${staffName}_${selectedStaffType}_Bill_${monthYear}.xlsx`;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Monthly bill downloaded successfully");
        } catch (error: any) {
            console.error("Error downloading monthly bill:", error);
            toast.error(error.message || "Failed to download monthly bill");
        } finally {
            setDownloading(false);
        }
    };

    const handleClearDateRange = () => {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
    };

    // Get staff options for dropdown
    const staffOptions = filteredStaff.map((staff) => ({
        value: staff._id,
        label: `${staff.firstName} ${staff.lastName}`.trim(),
    }));

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Staff Billing
            </Typography>

            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    mb: 3,
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <ThemeSelect
                        label="Select Role"
                        value={staffTypes.find((item) => item.value === selectedStaffType)}
                        placeholder="Select Role"
                        options={staffTypes}
                        onChange={(e, newValue) => handleStaffTypeChange(newValue)}
                        disabled={loading || downloading}
                    />
                    <ThemeSelect
                        label="Select Staff"
                        value={staffOptions.find((item) => item.value === selectedStaff?._id)}
                        placeholder="Select Staff"
                        options={staffOptions}
                        onChange={(e, newValue) => handleStaffChange(newValue)}
                        disabled={loading || downloading || !selectedStaffType}
                    />
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <ThemeButton
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadFullBill}
                            disabled={!selectedStaff || downloading}
                            size="small"
                        >
                            Full Bill
                        </ThemeButton>
                        <ThemeButton
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadMonthlyBill}
                            disabled={!selectedStaff || downloading}
                            size="small"
                        >
                            Monthly Bill
                        </ThemeButton>
                    </Box>

                    {/* Date Range Picker for Monthly Bill */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                        <Typography variant="body2" sx={{ minWidth: 100 }}>
                            Monthly Period:
                        </Typography>
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={(value: string) => setStartDate(value ? new Date(value) : null)}
                            onEndDateChange={(value: string) => setEndDate(value ? new Date(value) : null)}
                        />
                        <ThemeButton variant="outlined" size="small" onClick={handleClearDateRange}>
                            Reset
                        </ThemeButton>
                    </Box>
                </Box>

                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}

                {downloading && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                            Downloading bill...
                        </Typography>
                    </Box>
                )}

                {!selectedStaff && selectedStaffType && !loading && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        No staff found for the selected type. Please select a different type or add staff.
                    </Alert>
                )}
            </Paper>
        </Box>
    );
};

export default BillPage;
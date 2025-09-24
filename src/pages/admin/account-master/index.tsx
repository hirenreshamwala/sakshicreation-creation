"use client";

import React, { useState, useEffect } from "react";
import { Box, TableCell, Typography, Avatar, IconButton, Tabs, Tab, InputBase, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllAccountMastersThunk,
  deleteAccountMasterThunk,
  approvePartyThunk,
  bulkCreateAccountMastersThunk,
  clearError,
  clearSuccessMessage,
  getAccountMasterByStaffIdThunk,
} from "@/store/slices/accountMasterSlice";
import Dashboard from "@/component/Dashboard";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddNewPartyDialog from "@/component/AddNewPartyDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { authService } from "@/services/auth.service";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";
import DateRangePicker from "@/component/daterangepicker";
import { FiSearch } from "react-icons/fi";
import FilterDropdown from "@/component/fillter";
import AssignLeadDialog from "@/component/AssignLeadDialog";
import AssignTaskDialog from "@/component/assigntaskdailog";
import { toast } from "react-toastify";
import { useMemo } from "react";
import * as XLSX from "xlsx";

interface Company {
  _id: string;
  name: string;
  avatar?: string;
}

interface RowData {
  id: string;
  partyId: string;
  company: Company;
  createdDate: string;
  party: string;
  contactPerson: string;
  partyTag: string;
  mobile: string;
  reason: string;
  market: string;
  unitno: string;
  area: string;
  remarks: string;
  status: string;
  statusType: "success" | "info" | "error" | "default";
  createdBy: string;
  assignedTo: string;
  statusApproval: "Pending" | "Approved";
}

const columns = [
  { id: "checkbox", label: "" },
  { id: "company", label: "Company" },
  { id: "createdDate", label: "Created Date" },
  { id: "party", label: "Party" },
  { id: "contactPerson", label: "Contact Person" },
  { id: "partyTag", label: "Party Tag" },
  { id: "mobile", label: "Mobile No." },
  { id: "reason", label: "Reason to Visit" },
  { id: "unitno", label: "Unit No" },
  { id: "market", label: "Market" },
  { id: "area", label: "Area" },
  { id: "remarks", label: "Remarks" },
  { id: "status", label: "Status" },
  { id: "createdBy", label: "Created By" },
  { id: "assignedTo", label: "Assigned to" },
  { id: "action", label: "Action" },
];

const IndexPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accountMasters, loading, error, successMessage } = useAppSelector((state) => state.accountMasters);
  const { user } = useAppSelector((state) => state.auth);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [opentaskmodel, setOpentaskmodel] = useState(false);
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [isBulkUpload, setIsBulkUpload] = useState(false); // New state for bulk upload mode
  const [tab, setTab] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
  const [openBulkUploadDialog, setOpenBulkUploadDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [openAssignLeadDialog, setOpenAssignLeadDialog] = useState(false);
  const [openBulkAssignTask, setOpenBulkAssignTask] = useState(false); // New state for bulk assign task dialog
  const canViewGlobal = user?.role?.permissions?.account_master?.view_global;
  const canViewOwn = user?.role?.permissions?.account_master?.view_own;
  const cancreate = user?.role?.permissions?.account_master?.create;
  const canedit = user?.role?.permissions?.account_master?.edit;
  const candelete = user?.role?.permissions?.account_master?.delete;

  // Calculate counts for Approved and Pending tabs
  const approvedCount = accountMasters.filter(
    (account) => account.party?.statusApproval === "APPROVED"
  ).length;
  const pendingCount = accountMasters.filter(
    (account) => account.party?.statusApproval === "PENDING"
  ).length;

  // Update tabLabels to include counts
  const tabLabelsWithCount = [
    `APPROVED (${approvedCount})`,
    `PENDING (${pendingCount})`,
  ];

  const excelHeaders = useMemo(() => [
    "Company Name",
    "Party Name",
    "Owner Name",
    "Owner WhatsApp No.",
    "Owner Mobile No.",
    "Owner Email",
    "Contact Person",
    "Contact Person WhatsApp No.",
    "Contact Person Mobile No.",
    "Contact Person Email",
    "Contact For Payment",
    "Contact WhatsApp No.",
    "Contact Mobile No.",
    "Contact For Payment Email",
    "GST No.",
    "Party Tag",
    "Reference",
    "Unit No.",
    "Market Name",
    "Area",
    "Street Address",
    "Land Mark",
    "Pin Code",
    "Reason to Visit",
    "Created By",
  ], []);

  const mapStatusToType = (status: string): RowData["statusType"] => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Progress":
        return "info";
      case "Cancelled":
        return "error";
      default:
        return "default";
    }
  };
  useEffect(() => {
      if (error) {
        toast.error(error);

      }
    }, [error, dispatch]);

  const handleAddNew = () => {
    setEditId(null);
    setIsRequestMode(false);
    setIsBulkUpload(false);
    setOpen(true);
  };

  const handleAddNewRequest = () => {
    setEditId(null);
    setIsRequestMode(true);
    setOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setIsRequestMode(false);
    setOpen(true);
  };
  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(formattedRows.map((row) => row.id));
    } else {
      setSelectedRows([]);
    }
  };
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the party and all related data!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7F56D9",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteAccountMasterThunk(id)).unwrap();
        Swal.fire({
          title: "Deleted!",
          text: "Party deleted successfully",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Failed to delete party",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      }
    }
  };

  const handleApprove = async (partyId: string) => {
    const result = await Swal.fire({
      title: "Approve Party?",
      text: "This will mark the party as approved.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#7F56D9",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, approve it!",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(approvePartyThunk(partyId)).unwrap();
        // Refresh data after approval
        await dispatch(getAllAccountMastersThunk()).unwrap();
        Swal.fire({
          title: "Approved!",
          text: "Party approved successfully",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Failed to approve party",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      }
    }
  };

  const handleBulkUploadClick = () => {
    setEditId(null);
    setIsRequestMode(false);
    setIsBulkUpload(true); // Set to true for bulk upload
    setOpen(true)// Open AddNewPartyDialog instead of openBulkUploadDialog
  };

  const handleBulkUploadClose = () => {
    setOpenBulkUploadDialog(false);
    setFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleBulkUploadSubmit = async () => {
    if (!file) {
      Swal.fire({
        title: "Error!",
        text: "Please select a file to upload",
        icon: "error",
        confirmButtonColor: "#7F56D9",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      await dispatch(bulkCreateAccountMastersThunk(formData)).unwrap();
      Swal.fire({
        title: "Success!",
        text: "Bulk upload completed successfully",
        icon: "success",
        confirmButtonColor: "#7F56D9",
      });
      dispatch(getAllAccountMastersThunk());
      handleBulkUploadClose();
    } catch (err: any) {
      Swal.fire({
        title: "Error!",
        text: err.message || "Bulk upload failed",
        icon: "error",
        confirmButtonColor: "#7F56D9",
      });
    }
  };

  const getUniqueValues = (columnId: string): string[] => {
    const uniqueValues = new Set<string>();

    accountMasters.forEach((account) => {
      let value: string | undefined;

      switch (columnId) {
        case 'company':
          value = account.companyName?.name;
          break;
        case 'createdDate':
          value = new Date(account.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
          break;
        case 'party':
          value = account.party?.partyName;
          break;
        case 'contactPerson':
          value = account.party?.ownerName;
          break;
        case 'partyTag':
          value = account.party?.partyTag;
          break;
        case 'mobile':
          value = account.party?.ownerMobileNo;
          break;
        case 'reason':
          value = account.reasonToVisit;
          break;
        case 'market':
          value = account.party?.address?.marketName?.marketName;
          break;
        case 'area':
          value = account.party?.address?.area?.area;
          break;
        case 'remarks':
          value = account.assignment?.remarks;
          break;
        case 'status':
          value = account.assignment?.status;
          break;
        case 'createdBy':
          value = account.createdBy && typeof account.createdBy === "object"
            ? `${account.createdBy.firstName} ${account.createdBy.lastName}`
            : undefined;
          break;
        case 'assignedTo':
          value = account.assignment?.assignedTo && typeof account.assignment.assignedTo === "object"
            ? `${account.assignment.assignedTo.firstName} ${account.assignment.assignedTo.lastName}`
            : undefined;
          break;
      }

      if (value) {
        uniqueValues.add(value);
      }
    });

    return Array.from(uniqueValues).sort();
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditId(null);
    setOpenBulkUploadDialog(false);
    setIsBulkUpload(false);
  };

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch data based on permissions

    if (canViewGlobal) {
      // User can view all account masters
      dispatch(getAllAccountMastersThunk());
    } else if (canViewOwn && user?.id) {
      // User can only view their own account masters
      dispatch(getAccountMasterByStaffIdThunk(user.id));
    }

    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    };
  }, [dispatch, router, canViewGlobal, canViewOwn, user?.id]);



  const filteredAccountMasters = accountMasters.filter((account) => {
    const statusApproval = account.party?.statusApproval || "PENDING";
    const statusMatch = tab === 0 ? statusApproval === "APPROVED" : statusApproval === "PENDING";

    // Date range filtering
    const accountDate = new Date(account.createdAt);
    const matchesDateRange =
      (!startDate || accountDate >= new Date(startDate).setHours(0, 0, 0, 0)) &&
      (!endDate || accountDate <= new Date(endDate).setHours(23, 59, 59, 999));

    // Search filtering
    const matchesSearch = searchQuery
      ? (account.party?.partyName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (account.companyName?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (account.reasonToVisit?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    // Filter by column filters
    const matchesFilters = Object.keys(filters).every((columnId) => {
      if (filters[columnId].length === 0) return true;

      let value: string | undefined;

      switch (columnId) {
        case 'company':
          value = account.companyName?.name;
          break;
        case 'createdDate':
          value = new Date(account.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
          break;
        case 'party':
          value = account.party?.partyName;
          break;
        case 'contactPerson':
          value = account.party?.ownerName;
          break;
        case 'partyTag':
          value = account.party?.partyTag;
          break;
        case 'mobile':
          value = account.party?.ownerMobileNo;
          break;
        case 'reason':
          value = account.reasonToVisit;
          break;
        case 'market':
          value = account.party?.address?.marketName?.marketName;
          break;
        case 'area':
          value = account.party?.address?.area?.area;
          break;
        case 'remarks':
          value = account.assignment?.remarks;
          break;
        case 'status':
          value = account.assignment?.status;
          break;
        case 'createdBy':
          value = account.createdBy && typeof account.createdBy === "object"
            ? `${account.createdBy.firstName} ${account.createdBy.lastName}`
            : undefined;
          break;
        case 'assignedTo':
          value = account.assignment?.assignedTo && typeof account.assignment.assignedTo === "object"
            ? `${account.assignment.assignedTo.firstName} ${account.assignment.assignedTo.lastName}`
            : undefined;
          break;
      }

      return value && filters[columnId].includes(value);
    });

    // Then filter by ownership if user only has view_own permission
    if (canViewOwn && !canViewGlobal) {
      return statusMatch && matchesDateRange && matchesSearch && matchesFilters && account.createdBy?._id === user?.id;
    }

    return statusMatch && matchesDateRange && matchesSearch && matchesFilters;
  });

  const excelData = useMemo(() => {
    return filteredAccountMasters.map((account) => ({
      "Company Name": account.companyName?.name || "N/A",
      "Party Name": account.party?.partyName || "N/A",
      "Owner Name": account.party?.ownerName || "N/A",
      "Owner WhatsApp No.": account.party?.ownerWhatsAppNo || "N/A",
      "Owner Mobile No.": account.party?.ownerMobileNo || "N/A",
      "Owner Email": account.party?.ownerEmail || "N/A",
      "Contact Person": account.party?.contactPerson || "N/A",
      "Contact Person WhatsApp No.": account.party?.contactPersonWhatsAppNo || "N/A",
      "Contact Person Mobile No.": account.party?.contactPersonMobileNo || "N/A",
      "Contact Person Email": account.party?.contactPersonEmail || "N/A",
      "Contact For Payment": account.party?.contactForPayment || "N/A",
      "Contact WhatsApp No.": account.party?.contactForPaymentWhatsAppNo || "N/A",
      "Contact Mobile No.": account.party?.contactForPaymentMobileNo || "N/A",
      "Contact For Payment Email": account.party?.contactForPaymentEmail || "N/A",
      "GST No.": account.party?.gstNo || "N/A",
      "Party Tag": account.party?.partyTag || "New",
      "Reference": account.party?.reference ? "Yes" : "No",
      "Unit No.": account.party?.address?.unitNo || "N/A",
      "Market Name": account.party?.address?.marketName?.marketName || "N/A",
      "Area": account.party?.address?.area?.area || "N/A",
      "Street Address": account.party?.address?.streetAddress || "N/A",
      "Land Mark": account.party?.address?.landMark || "N/A",
      "Pin Code": account.party?.address?.pinCode || "N/A",
      "Reason to Visit": account.reasonToVisit || "N/A",
      "Created By": account.createdBy && typeof account.createdBy === "object"
        ? `${account.createdBy.firstName} ${account.createdBy.lastName}`
        : "Unknown",
    }));
  }, [filteredAccountMasters]);

  const formattedRows: RowData[] = filteredAccountMasters.map((account) => {
    return {
      id: account._id,
      partyId: account.party?._id || "",
      company: {
        _id: account.companyName?._id || "",
        name: account.companyName?.name || "N/A",
        avatar: account.companyName?.avatar,
      },
      createdDate: new Date(account.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }),
      party: account.party?.partyName || "N/A",
      contactPerson: account.party?.contactPerson || "N/A",
      partyTag: account.party?.partyTag || "New",
      mobile: account.party?.ownerMobileNo || "N/A",
      reason: account.reasonToVisit || "N/A",
      unitno: account.party?.address?.unitNo || "N/A",
      market: account.party?.address?.marketName || account.party?.address?.marketName?.marketName,
      area: account.party?.address?.area || account.party?.address?.area?.area,
      remarks: account.assignment?.remarks || "N/A",
      status: account.assignment?.status || "Not Started",
      statusType: mapStatusToType(account.assignment?.status || "Not Started"),
      createdBy:
        account.createdBy && typeof account.createdBy === "object"
          ? `${account.createdBy.firstName} ${account.createdBy.lastName}`
          : "Unknown",
      assignedTo:
        account.assignment?.assignedTo && typeof account.assignment.assignedTo === "object"
          ? `${account.assignment.assignedTo.firstName} ${account.assignment.assignedTo.lastName}`
          : "Unassigned",
      statusApproval: account.party?.statusApproval || "Pending",
    };
  });
  const partyIds = selectedRows.map((accountId) => {
    const account = accountMasters.find((acc) => acc._id === accountId);
    return account?.party?._id || "";
  }).filter(Boolean);

  const selectedParties = selectedRows.map((accountId) => {
    const account = accountMasters.find((acc) => acc._id === accountId);
    return {
      partyId: account?.party?._id || "",
      companyId: account?.companyName?._id || ""
    };
  }).filter(p => p.partyId && p.companyId);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => setStartDate(date)}
            onEndDateChange={(date) => setEndDate(date)}
          />
          <ThemeButton
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
            }}
          >
            Clear Date Range
          </ThemeButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #D0D5DD",
              borderRadius: 2,
              px: 1.5,
              width: 200,
              height: 35,
            }}
          >
            <IconButton size="small" sx={{ color: "#98A2B3" }}>
              <FiSearch size={18} />
            </IconButton>
            <InputBase
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ ml: 1, fontSize: 14 }}
            />
          </Box>
          <FilterDropdown
            filterOptions={columns
              .filter((col) => col.id !== "action")
              .map((col) => col.label)}
            uniqueValues={selectedFilterField ?
              getUniqueValues(columns.find(col => col.label === selectedFilterField)?.id || '') :
              []}
            onFiltersChange={(newFilters) => {
              const idBasedFilters: { [key: string]: string[] } = {};
              Object.entries(newFilters).forEach(([label, values]) => {
                const columnId = columns.find(col => col.label === label)?.id;
                if (columnId) {
                  idBasedFilters[columnId] = values;
                }
              });
              setFilters(idBasedFilters);
            }}
            filters={Object.keys(filters).reduce((acc, columnId) => {
              const columnLabel = columns.find(col => col.id === columnId)?.label;
              if (columnLabel) {
                acc[columnLabel] = filters[columnId];
              }
              return acc;
            }, {} as { [key: string]: string[] })}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />

          {(canViewGlobal) && (
            <ThemeButton onClick={handleAddNew}>+ Add New Party</ThemeButton>
          )}
          {(canViewOwn) && (
            <ThemeButton onClick={handleAddNewRequest}>+ Add New Party Request</ThemeButton>
          )}
          {/* {(canViewGlobal) && ( */}
          <ThemeButton onClick={handleBulkUploadClick} startIcon={<CloudUploadIcon />}>
            Bulk Upload
          </ThemeButton>
          <ThemeButton
            onClick={() => setOpenAssignLeadDialog(true)}
            disabled={selectedRows.length === 0}
          >
            Create Party Call for Selected
          </ThemeButton>
          <ThemeButton
            onClick={() => setOpenBulkAssignTask(true)}
            disabled={selectedRows.length === 0}
          >
            Assign Task for Selected
          </ThemeButton>
          {/* )} */}
        </Box>
      </Box>

      <Box sx={{ display: "flex" }}>
        <Box
          sx={{
            position: "relative",
            display: "inline-flex",
            borderRadius: "12px",
            border: "2px solid #7F56D9",
            backgroundColor: "#fff",
            p: "2px",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 2,
              left: tab === 0 ? 2 : "50%",
              width: "50%",
              height: "calc(100% - 4px)",
              backgroundColor: "#7F56D9",
              borderRadius: "10px",
              zIndex: 0,
              transition: "left 0.3s ease",
            }}
          />
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            TabIndicatorProps={{ style: { display: "none" } }}
            sx={{
              minHeight: 0,
              zIndex: 1,
              "& .MuiTabs-flexContainer": {
                gap: 0,
              },
              "& .MuiTab-root": {
                textTransform: "none",
                minHeight: 0,
                px: 1.8,
                py: 0.8,
                fontWeight: 700,
                fontSize: 14,
                borderRadius: "10px",
                color: "#7F56D9",
                zIndex: 1,
              },
              "& .MuiTab-root.Mui-selected": {
                color: "#fff",
                backgroundColor: "transparent",
                zIndex: 2,
              },
            }}
          >
            {tabLabelsWithCount.map((label) => (
              <Tab key={label} label={label} disableRipple />
            ))}
          </Tabs>
        </Box>
      </Box>

      {loading ? (
        <Loader />
      ) : formattedRows.length === 0 ? (
        <Typography>No account masters found for {tabLabelsWithCount[tab]} tab.</Typography>
      ) : (
        <BasicTable
          showDatePicker={false}
          tableHeader={columns}
          showFillter={false}
          showSearch={false}
          title="Account-master"
          showExcelDownload={true}
          excelHeaders={excelHeaders}
          excelData={excelData}
          rowData={formattedRows}
          renderRow={(row: RowData, index: number) => (
            <>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar src={row.company.avatar} alt={row.company.name} sx={{ width: 28, height: 28 }} />
                  <Typography fontWeight={100} fontSize={14}>{row.company.name}</Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.createdDate}</TableCell>
              <TableCell
                sx={{ cursor: 'pointer', fontWeight: 500, fontSize: 14 }}
                onClick={() => router.push(`/admin/account-master/view-company/${row.id}`)}
              >
                {row.party}
              </TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.contactPerson}</TableCell>
              <TableCell>
                <ThemeChip
                  label={row.partyTag}
                  color={row.partyTag === "New" ? "primary" : "secondary"}
                  variant="outlined"
                  sx={{
                    background: row.partyTag === "New" ? "#E0E7FF" : "#F3E8FF",
                    color: row.partyTag === "New" ? "#6366F1" : "#A21CAF",
                    fontWeight: 600,
                    fontSize: 13,
                    px: 2,
                    height: 28,
                    border: 'none',
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.mobile}</TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.reason}</TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.unitno}</TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.market?.marketName}</TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.area?.area}</TableCell>
              <TableCell sx={{ fontSize: 14 }}><Typography sx={{ fontSize: 14 }} title={row.remarks} noWrap>{row.remarks && row.remarks.length > 10
                ? `${row.remarks.substring(0, 10)}...`
                : row.remarks}</Typography></TableCell>
              <TableCell sx={{ fontSize: 14 }}>
                <ThemeChip
                  label={row.status}
                  color={row.statusType}
                  variant="outlined"
                  sx={{
                    background:
                      row.statusType === "success"
                        ? "#ECFDF3"
                        : row.statusType === "error"
                          ? "#FEF3F2"
                          : "#F2F4F7",
                    color:
                      row.statusType === "success"
                        ? "#12B76A"
                        : row.statusType === "error"
                          ? "#F04438"
                          : "#667085",
                    fontWeight: 600,
                    fontSize: 13,
                    height: 28,
                    border: 'none',
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.createdBy}</TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.assignedTo}</TableCell>
              <TableCell sx={{ display: "flex", gap: 1 }}>
                {canedit && (
                  <IconButton color="primary" onClick={() => handleEdit(row.id)}>
                    <EditIcon />
                  </IconButton>
                )}
                {candelete && (
                  <IconButton color="error" onClick={() => handleDelete(row.id)}>
                    <DeleteIcon />
                  </IconButton>
                )}
                {row.statusApproval === 'PENDING' && canViewGlobal && (
                  <IconButton onClick={() => handleApprove(row.partyId)}>
                    <CheckCircleIcon color="success" />
                  </IconButton>
                )}
              </TableCell>
            </>
          )}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          selectedRows={selectedRows}
        />
      )}
      <AddNewPartyDialog
        open={open}
        onClose={handleDialogClose}
        accountId={editId ?? undefined}
        refreshData={() => {
          if (canViewGlobal) {
            dispatch(getAllAccountMastersThunk());
          } else if (canViewOwn && user?.id) {
            dispatch(getAccountMasterByStaffIdThunk(user.id));
          }
        }}
        isRequestMode={isRequestMode}
        isBulkUpload={isBulkUpload}
      />
      <AssignLeadDialog
        open={openAssignLeadDialog}
        onClose={() => {
          setOpenAssignLeadDialog(false);
          setSelectedRows([]);
        }}
        partyIds={partyIds}
        onSuccess={() => {
          setOpenAssignLeadDialog(false);
          setSelectedRows([]);
          if (canViewGlobal) {
            dispatch(getAllAccountMastersThunk());
          } else if (canViewOwn && user?.id) {
            dispatch(getAccountMasterByStaffIdThunk(user.id));
          }
        }}
      />
      <AssignTaskDialog
        open={openBulkAssignTask}
        onClose={() => {
          setOpenBulkAssignTask(false);
          setSelectedRows([]);
        }}
        selectedParties={selectedParties}
        onSuccess={() => {
          setOpenBulkAssignTask(false);
          setSelectedRows([]);
          if (canViewGlobal) {
            dispatch(getAllAccountMastersThunk());
          } else if (canViewOwn && user?.id) {
            dispatch(getAccountMasterByStaffIdThunk(user.id));
          }
        }}
      />
    </>
  );
};

export default IndexPage;

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Tab,
  Tabs,
  Typography,
  TableCell,
  IconButton,
  InputBase,
  Tooltip,
  Avatar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { FiSearch } from "react-icons/fi";
import { useRouter } from "next/router"; // Updated to next/navigation
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllLeadsThunk,
  clearError,
  clearSuccessMessage,
  deleteLeadThunk,
  getLeadsByStaffIdThunk,
} from "@/store/slices/leadSlice";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import FilterDropdown from "@/component/fillter";
import DateRangePicker from "@/component/daterangepicker";
import AssignLeadDialog from "@/component/AssignLeadDialog";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";
import { authService } from "@/services/auth.service";
import { toast } from "react-toastify";
import TabComponent from "@/component/Dialog/TabComponent";
import { getCompanyWisePermission } from "@/utills/utills";
import { StaticCompanyOptions } from "@/constants";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";

interface Lead {
  _id: string;
  companyName: {
    _id: string;
    companyName?: string;
    avatar?: string;
  };
  partyName: {
    _id: string;
    partyName: string;
    ownerName?: string;
    ownerMobileNo?: string;
    ownerWhatsAppNo?: string;
    contactPerson?: string;
    personMobileNo?: string;
    personWhatsAppNo?: string;
    contactForPayment?: string;
    contactMobileNo?: string;
    contactWhatsAppNo?: string;
    GSTNo?: string;
    partyTag?: string;
    address?: {
      unitNo: string;
      marketName: string;
      // streetAddress: string;
      landMark: string;
      area: string;
      pincode: string;
    };
    createdAt?: string;
    updatedAt?: string;
    createdBy?: {
      _id: string;
      firstName?: string;
      lastName?: string;
    };
  };
  reason: string;
  customReason?: string;
  assignedTo: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  status: string;
  rescheduleDate?: string;
  isRescheduledCall?: boolean;
  originalLeadId?: {
    _id: string;
    date: string;
    createdAt: string; // Add createdAt to originalLeadId
  };
  callFeedback: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

const columns = [
  { id: "company", label: "Company" },
  { id: "createdAt", label: "Created Date" },
  { id: "party", label: "Party" },
  { id: "reason", label: "Reason to Call" },
  { id: "mobile", label: "Mobile No." },
  { id: "address", label: "Unit No" },
  { id: "market", label: "Market Name" },
  { id: "area", label: "Area" },
  { id: "statusofparty", label: "Status of Party" },
  { id: "status", label: "Status" },
  { id: "createdBy", label: "Created By" },
  { id: "assignedTo", label: "Assigned To" },
  { id: "actions", label: "Actions" },
];

const tabLabels = ["Pending", "History"];

// Define mapLeadsToRows before useMemo
const mapLeadsToRows = (leads: Lead[]): Lead[] =>
  leads.map((lead) => ({
    ...lead,
    createdAt: lead.isRescheduledCall && lead.originalLeadId?.createdAt
      ? lead.originalLeadId.createdAt
      : lead.createdAt,
  }));

const LeadManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    leads = [],
    loading = false,
    error = null,
    successMessage = null,
  } = useAppSelector((state) => state.leads || {});
  const { user } = useAppSelector((state) => state.auth || {});
  const [tab, setTab] = useState(0);
  const [comapanyTab, setCompanyTab] = useState(0);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const router = useRouter();
  const todayRef = useRef<HTMLDivElement>(null);

  const canViewGlobal = user?.role?.permissions?.party_call?.view_global;
  const canViewOwn = user?.role?.permissions?.party_call?.view_own;
  const canDelete = user?.role?.permissions?.party_call?.delete;
  const cancreate = user?.role?.permissions?.party_call?.create;
  const canEdit = user?.role?.permissions?.party_call?.edit;
  const { companies } = useAppSelector((state) => state.company)
  // Company permissions
  const hasSakshi = !!getCompanyWisePermission(5);
  const hasQP = !!getCompanyWisePermission(6);
  const hasBothCompanies = getCompanyWisePermission(0);
  const { staffId: si, startDate: st, endDate: e, status: s, reason: r, c, companyName } = router.query

  // Determine active company ID
  const activeCompanyId = useMemo(() => {
    if (hasBothCompanies) {
      return comapanyTab === 0 ? getCompanyWisePermission(5) : getCompanyWisePermission(6);
    }
    return hasSakshi ? getCompanyWisePermission(5) : getCompanyWisePermission(6);
  }, [hasBothCompanies, comapanyTab, hasSakshi, hasQP]);

  // Filter leads by company
  const companyFilteredLeads = useMemo(() => {
    if (!activeCompanyId) return leads;
    return leads.filter(lead => lead.companyName?._id === activeCompanyId);
  }, [leads, activeCompanyId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true))
  }, [])

  useEffect(() => {
    if (c) setCompanyTab(c === "Quality Packaging" || c === "QP"  ? 1 : 0)
    if (st) setStartDate(new Date(st as string));
    if (e) setEndDate(new Date(e as string));
    if (s) {
      const statuses = (s as string).split(",");
      setTab(
        statuses.some((status) => ["completed", "cancelled"].includes(status))
          ? 1
          : 0
      );
    }
  }, [st, e, s, c]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (canViewGlobal && router.isReady) {
      dispatch(getAllLeadsThunk({
        companyName,
        staffId: si,
        startDate: st,
        endDate: e,
        status: s?.toString().split(",").map((x) => x.toLowerCase()),
        reason: r,
      }));
    } else if (canViewOwn && user?.id) {
      dispatch(getLeadsByStaffIdThunk(user?.id));
    }

    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    };
  }, [dispatch, router, canViewGlobal, canViewOwn, user?.id, router.isReady]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        title: "Error!",
        text: error,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#7F56D9",
      });
      dispatch(clearError());
    }
    if (successMessage) {
      Swal.fire({
        title: "Success!",
        text: successMessage,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#7F56D9",
      });
      dispatch(clearSuccessMessage());
    }
  }, [error, successMessage, dispatch]);

  // Map filter labels to rowData keys
  const filterFieldToKey: { [key: string]: string } = {
    Company: "companyName.companyName",
    "Created Date": "createdAt",
    Party: "partyName.partyName",
    "Reason to Call": "reason",
    "Mobile No.": "partyName.ownerWhatsAppNo",
    "Unit No": "partyName.address.unitNo",
    "Market Name": "partyName.address.marketName.marketName",
    Area: "partyName.address.area.area",
    "Status of Party": "partyName.partyTag",
    Status: "status",
    "Created By": "partyName.createdBy",
    "Assigned To": "assignedTo",
  };

  // Compute unique values for the selected filter field
  const uniqueValues = useMemo(() => {
    if (!selectedFilterField) return [];
    const key = filterFieldToKey[selectedFilterField];
    if (!key) return [];

    const values = mapLeadsToRows(companyFilteredLeads).map((lead) => {
      if (key === "companyName.companyName") {
        return lead.companyName?.companyName || "N/A";
      } else if (key === "partyName.partyName") {
        return lead.partyName?.partyName || "N/A";
      } else if (key === "partyName.ownerMobileNo") {
        return lead.partyName?.ownerMobileNo || "N/A";
      } else if (key === "partyName.address.unitNo") {
        return lead.partyName?.address?.unitNo || "N/A";
      } else if (key === "partyName.address.marketName") {
        return lead.partyName?.address?.marketName || "N/A";
      } else if (key === "partyName.address.area") {
        return lead.partyName?.address?.area || "N/A";
      } else if (key === "partyName.partyTag") {
        return lead.partyName?.partyTag || "N/A";
      } else if (key === "status") {
        return lead.status || "N/A";
      } else if (key === "createdAt") {
        return lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-GB") : "N/A";
      } else if (key === "partyName.createdBy") {
        return lead.partyName?.createdBy
          ? `${lead.partyName.createdBy.firstName} ${lead.partyName.createdBy.lastName}`.trim()
          : "N/A";
      } else if (key === "assignedTo") {
        return lead.assignedTo
          ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`.trim()
          : "N/A";
      }
      return String((lead as any)[key] || "N/A");
    });
    return Array.from(new Set(values)).sort();
  }, [companyFilteredLeads, selectedFilterField]);

  // Filter leads based on search query, date range, and multiple filters
  const filteredLeads = useMemo(() => {
    let filtered = mapLeadsToRows(companyFilteredLeads);

    // Apply status filter
    filtered = filtered.filter((lead) =>
      tab === 0
        ? ["pending", "rescheduled"].includes(lead.status.toLowerCase())
        : ["completed", "cancelled"].includes(lead.status.toLowerCase())
    );

    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter((lead) => {
        const leadDate = new Date(lead.date);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
        return (!start || leadDate >= start) && (!end || leadDate <= end);
      });
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((lead) =>
        [
          lead.partyName?.partyName,
          lead.companyName?.companyName,
          lead.reason,
          lead.partyName?.address?.unitNo,
          lead.partyName?.address?.marketName,
          lead.partyName?.address?.area,
        ].some((value) =>
          value?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply multiple filters
    if (Object.keys(filters).length > 0) {
      filtered = filtered.filter((lead) =>
        Object.entries(filters).every(([field, values]) => {
          const key = filterFieldToKey[field];
          let value: string;
          if (key === "companyName.companyName") {
            value = lead.companyName?.companyName || "N/A";
          } else if (key === "partyName.partyName") {
            value = lead.partyName?.partyName || "N/A";
          } else if (key === "partyName.ownerMobileNo") {
            value = lead.partyName?.ownerMobileNo || "N/A";
          } else if (key === "partyName.address.unitNo") {
            value = lead.partyName?.address?.unitNo || "N/A";
          } else if (key === "partyName.address.marketName") {
            value = lead.partyName?.address?.marketName || "N/A";
          } else if (key === "partyName.address.area") {
            value = lead.partyName?.address?.area || "N/A";
          } else if (key === "partyName.partyTag") {
            value = lead.partyName?.partyTag || "N/A";
          } else if (key === "status") {
            value = lead.status || "N/A";
          } else if (key === "createdAt") {
            value = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-GB") : "N/A";
          } else if (key === "partyName.createdBy") {
            value = lead.partyName?.createdBy
              ? `${lead.partyName.createdBy.firstName} ${lead.partyName.createdBy.lastName}`.trim()
              : "N/A";
          } else if (key === "assignedTo") {
            value = lead.assignedTo
              ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`.trim()
              : "N/A";
          } else {
            value = String((lead as any)[key] || "N/A");
          }
          return values.includes(value);
        })
      );
    }

    return filtered;
  }, [companyFilteredLeads, tab, startDate, endDate, searchQuery, filters]);

  const filteredGroupedLeads = useMemo(() => {
    return filteredLeads.reduce((acc, lead) => {
      const leadDate = new Date(lead.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      if (!acc[leadDate]) {
        acc[leadDate] = [];
      }
      acc[leadDate].push(lead);
      return acc;
    }, {} as Record<string, Lead[]>);
  }, [filteredLeads]);

  const filteredSortedDates = useMemo(() => {
    return Object.keys(filteredGroupedLeads).sort((a, b) => {
      const dateA = new Date(a.split("/").reverse().join("-"));
      const dateB = new Date(b.split("/").reverse().join("-"));
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredGroupedLeads]);

  // Auto-scroll to today's section
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [filteredSortedDates, tab, startDate, endDate, searchQuery, filters]);

  const isToday = (dateString: string): boolean => {
    const today = new Date();
    const [day, month, year] = dateString.split("/");
    const compareDate = new Date(`${year}-${month}-${day}`);
    return (
      compareDate.getDate() === today.getDate() &&
      compareDate.getMonth() === today.getMonth() &&
      compareDate.getFullYear() === today.getFullYear()
    );
  };

  const handleClick = (id: string) => {
    router.push(`/admin/party-call/view-lead/${id}`);
  };

  const handleUpdateClick = (lead: Lead) => {
    setSelectedLead(lead);
    setOpenAssignDialog(true);
  };

  const handleDeleteClick = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7F56D9",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteLeadThunk(id)).unwrap();
        Swal.fire({
          title: "Deleted!",
          text: "The lead has been deleted.",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Failed to delete lead",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      }
    }
  };

  const handleAssignSuccess = () => {
    setOpenAssignDialog(false);
    Swal.fire({
      title: "Success!",
      text: selectedLead?._id
        ? "Lead updated successfully!"
        : "Lead assigned successfully!",
      icon: "success",
      confirmButtonColor: "#7F56D9",
    }).then(() => {
      // Refetch leads to reflect changes immediately
      if (canViewGlobal) {
        dispatch(getAllLeadsThunk({
          companyName,
          staffId: si,
          startDate: st,
          endDate: e,
          status: s?.toString().split(",").map((x) => x.toLowerCase()),
          reason: r,
        }));
      } else if (canViewOwn && user?.id) {
        dispatch(getLeadsByStaffIdThunk(user?.id));
      }
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const renderRow = (row: Lead) => (
    <>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{ width: 32, height: 32 }}
            src={row.companyName?.avatar}
            alt={row.companyName?.companyName || "Company"}
          />
          <Typography fontWeight={500} sx={{ fontSize: 14 }}>
            {row.companyName?.companyName || "N/A"}
            {row.isRescheduledCall && (
              <Tooltip title={`Rescheduled from ${new Date(row.originalLeadId?.date).toLocaleDateString('en-GB')}`}>
                <ThemeChip label="Rescheduled" color="warning" size="small" sx={{ ml: 1, background: "#FFFAEB", color: "#B54708" }} />
              </Tooltip>
            )}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-GB") : "N/A"}
      </TableCell>
      <TableCell
        sx={{ cursor: "pointer", fontSize: 14 }}
        onClick={() => handleClick(row._id || "")}
      >
        {row.partyName?.partyName || "N/A"}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        {row.reason === "Other" ? row.customReason || "Other" : row.reason}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.partyName?.ownerWhatsAppNo || "N/A"}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        {row.partyName?.address
          ? truncateText(
            `${row.partyName.address.unitNo}`,
            30
          )
          : "N/A"}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.partyName?.address?.marketName?.marketName || "N/A"}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.partyName?.address?.area?.area || "N/A"}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        <ThemeChip
          label={row.partyName?.partyTag || "N/A"}
          color={row.partyName?.partyTag === "New" ? "primary" : "default"}
          variant={row.partyName?.partyTag === "New" ? "filled" : "outlined"}
          sx={{
            background:
              row.partyName?.partyTag === "New" ? "#F4EBFF" : "#F4F3FF",
            color: "#7F56D9",
            fontWeight: 600,
            fontSize: 13,
            px: 1.5,
            height: 28,
          }}
        />
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        <ThemeChip
          label={row.status.charAt(0).toUpperCase() + row.status.slice(1) || "N/A"}
          color={
            row.status === "pending" ? "primary" :
              row.status === "rescheduled" ? "warning" :
                row.status === "completed" ? "success" :
                  row.status === "cancelled" ? "error" : "default"
          }
          variant="filled"
          sx={{
            fontWeight: 600,
            fontSize: 13,
            px: 1.5,
            height: 28,
          }}
        />
      </TableCell>

      <TableCell sx={{ fontSize: 14 }}>
        {row.partyName?.createdBy
          ? `${row.partyName.createdBy.firstName} ${row.partyName.createdBy.lastName}`.trim()
          : "N/A"}
      </TableCell>
      <TableCell>
        {row.assignedTo
          ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}`.trim()
          : "N/A"}
      </TableCell>
      <TableCell sx={{ display: "flex", fontSize: 14 }}>
        {canEdit && (
          <IconButton onClick={() => handleUpdateClick(row)} color="primary">
            <EditIcon />
          </IconButton>
        )}
        {canDelete && (
          <IconButton
            onClick={() => handleDeleteClick(row._id || "")}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </TableCell>
    </>
  );

  return (
    <>
      {/* Only show company tabs if user has access to both companies */}
      {hasBothCompanies && (
        <TabComponent activeTab={comapanyTab} setActiveTab={setCompanyTab} />
      )}

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
              .filter((col) => col.id !== "actions")
              .map((col) => col.label)}
            uniqueValues={uniqueValues}
            onFiltersChange={setFilters}
            filters={filters}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />
          {cancreate && (
            <ThemeButton
              onClick={() => {
                setSelectedLead(null);
                setOpenAssignDialog(true);
              }}
            >
              + Assign New Party Call
            </ThemeButton>
          )}
        </Box>
      </Box>

      <TabComponent activeTab={tab} setActiveTab={setTab} tabList={tabLabels} align="left" />
      <Box
        sx={{
          maxHeight: "110vh",
          overflowY: "auto",
          px: 2,
          py: 2,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#555",
          },
        }}
      >
        {loading ? (
          <Loader />
        ) : filteredSortedDates.length === 0 ? (
          <Typography>
            No leads found
            {startDate || endDate ? " for the selected date range" : ""}.
          </Typography>
        ) : (
          filteredSortedDates.map((date) => (
            <Box
              key={date}
              ref={isToday(date) ? todayRef : null}
              mb={4}
              sx={{
                backgroundColor: isToday(date) ? "#a0d8b4ff" : "transparent",
                borderRadius: 2,
                p: 2,
                border: isToday(date) ? "1px solid #D1FADF" : "none",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} >
                {date}
                {isToday(date) && (
                  <ThemeChip
                    label="Today"
                    color="success"
                    size="small"
                    sx={{ ml: 1, background: "#3a43beff" }}
                  />
                )}
              </Typography>
              <BasicTable
                tableHeader={columns}
                rowData={filteredGroupedLeads[date]}
                showDatePicker={false}
                showSearch={false}
                showFillter={false}
                renderRow={renderRow}
              />
            </Box>
          ))
        )}
      </Box>

      {openAssignDialog ? <AssignLeadDialog
        open={openAssignDialog}
        onClose={() => {
          setOpenAssignDialog(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onSuccess={handleAssignSuccess}
        company={companies.find((item) => item.companyName === StaticCompanyOptions[comapanyTab])}
      /> : null}
    </>
  );
};

export default LeadManagementPage;
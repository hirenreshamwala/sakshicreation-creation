"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TableCell,
  IconButton,
  InputBase,
  Tooltip,
  Avatar,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { FiSearch } from "react-icons/fi";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import FilterDropdown from "@/component/fillter";
import DateRangePicker from "@/component/daterangepicker";
import AssignLeadDialog from "@/component/AssignLeadDialog";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";
import { toast } from "react-toastify";
import TabComponent from "@/component/Dialog/TabComponent";
import { getCompanyWisePermission, getFirstFourChars } from "@/utills/utills";
import { StaticCompanyOptions } from "@/constants";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import { leadService } from "@/services/lead.service";
import CustomTable2 from "@/component/common_component/Table/CustomTable/CustomTable2";

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
    createdAt: string;
  };
  callFeedback: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface DatePaginationState {
  [date: string]: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    loading: boolean;
    data: Lead[];
  };
}

const columns = [
  { id: "company", label: "Company" },
  { id: "createdAt", label: "Created Date" },
  { id: "party", label: "Party" },
  { id: "address", label: "Unit No" },
  { id: "market", label: "Market Name" },
  { id: "area", label: "Area" },
  { id: "contactPerson", label: "Contact Person" },
  { id: "mobile", label: "Mobile No." },
  { id: "partyTag", label: "Tag" },
  // { id: "remarks", lable: "Remarks" },
  { id: "reason", label: "Reason to Call" },
  { id: "feedback", label: "feedback" },
  // { id: "statusofparty", label: "Status of Party" },
  { id: "status", label: "Status" },
  { id: "createdBy", label: "Created By" },
  { id: "assignedTo", label: "Assigned To" },
  { id: "actions", label: "Actions" },
];

const tabLabels = ["Pending", "Completed"];

const LeadManagementPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth || {});
  const { companies } = useAppSelector((state) => state.company);

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
  const [filterOptions, setFilterOptions] = useState<string[]>([]);
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
  // Pagination state
  const [availableDates, setAvailableDates] = useState<{ date: string, count: number }[]>([]);
  const [datePagination, setDatePagination] = useState<DatePaginationState>({});
  const [loadingDates, setLoadingDates] = useState(true);

  const ITEMS_PER_PAGE = 10;

  const canViewGlobal = user?.role?.permissions?.party_call?.view_global;
  const canViewOwn = user?.role?.permissions?.party_call?.view_own;
  const canDelete = user?.role?.permissions?.party_call?.delete;
  const cancreate = user?.role?.permissions?.party_call?.create;
  const canEdit = user?.role?.permissions?.party_call?.edit;

  // Get current user's full name for canViewOwn filter
  const currentUserName = useMemo(() => {
    if (!user) return "";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }, [user]);

  // Company permissions
  const hasSakshi = !!getCompanyWisePermission(5);
  const hasQP = !!getCompanyWisePermission(6);
  const hasBothCompanies = getCompanyWisePermission(0);
  const { staffId: si, status: s, reason: r, c, companyName: routerCompanyName, startDate: st, endDate: e } = router.query;

  // Company tab से company name निकालें
  const selectedCompany = useMemo(() => {
    if (comapanyTab === 0) return "Sakshi Creation";
    if (comapanyTab === 1) return "Quality Packaging";
    return null;
  }, [comapanyTab]);

  // Status tab से status array निकालें
  const selectedStatus = useMemo(() => {
    if (tab === 0) return ["pending", "rescheduled"]; // Pending tab
    if (tab === 1) return ["completed", "cancelled"]; // History tab
    return [];
  }, [tab]);

  // Company name से company ID निकालें
  const selectedCompanyId = useMemo(() => {
    if (!companies.length) return null;
    const company = companies.find(item =>
      item.companyName === selectedCompany
    );
    return company?._id || null;
  }, [companies, selectedCompany]);

  // Format date for API
  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  const isToday = (dateString: string): boolean => {
    const today = new Date();
    const [day, month, year] = dateString?.split("/");
    const compareDate = new Date(`${year}-${month}-${day}`);
    return (
      compareDate.getDate() === today.getDate() &&
      compareDate.getMonth() === today.getMonth() &&
      compareDate.getFullYear() === today.getFullYear()
    );
  };

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true));
  }, []);

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true))
  }, [])

  useEffect(() => {
    if (c) setCompanyTab(c === "Quality Packaging" || c === "QP" ? 1 : 0)
    if (st) setStartDate(new Date(st as string));
    if (e) setEndDate(new Date(e as string));
    if (s) {
      const statuses = (s as string)?.split(",");
      setTab(
        statuses.some((status) => ["completed", "cancelled"].includes(status))
          ? 1
          : 0
      );
    }
  }, [s, c]);

  const handleExcelDownload = async () => {
    try {
      console.log("Starting Excel download...");

      // Prepare payload with all current filters
      const payload: any = {
        status: selectedStatus, // Array of statuses from tab
        companyName: selectedCompany, // From company tab
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        staffId: si,
        date: null, // We're using date range instead of single date
        search: searchQuery || null,
        mobile: filters['Mobile No']?.[0] || null,
        unitNo: filters['Unit No']?.[0] || null,
        marketName: filters['market']?.[0] || null,
        area: filters['area']?.[0] || null,
        partyTag: filters['party status']?.[0] || null,
        createdBy: filters['Created By']?.[0] || null,
        assignedToFilter: filters['assign to']?.[0] || null,
        reason: filters['Reason to Call']?.[0] || r || null,
      };

      // Handle multiple filter values
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key].length > 1) {
          // Handle comma-separated values for fields that support it
          const multiValueFields = [
            'Mobile No', 'unitNo', 'market', 'area', 'party status',
            'Reason to Call', 'assign to', 'Created By'
          ];

          if (multiValueFields.includes(key)) {
            const fieldMap: Record<string, string> = {
              'Mobile No': 'mobile',
              'Unit No': 'unitNo',
              'market': 'marketName',
              'area': 'area',
              'party status': 'partyTag',
              'Reason to Call': 'reason',
              'assign to': 'assignedToFilter',
              'Created By': 'createdBy'
            };

            const backendField = fieldMap[key] || key;
            payload[backendField] = filters[key].join(',');
          }
        }
      });

      // Handle partyName separately (can be ID or name)
      if (filters['party'] && filters['party'].length > 0) {
        payload.partyName = filters['party'][0];
      }

      // Apply assignedTo filter for canViewOwn permission
      if (canViewOwn && !canViewGlobal && currentUserName) {
        payload.assignedToFilter = currentUserName;
      }

      // Clean payload - remove null/undefined/empty values
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) =>
          value !== null && value !== undefined && value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        )
      );

      console.log("Download payload:", cleanPayload);

      // Call the export service
      const response = await leadService.exportLeadsToExcel(cleanPayload);

      // Check if response is a blob (Excel file)
      if (response instanceof Blob) {
        // Create a download link
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Leads_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);

        // Trigger download
        link.click();

        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Excel file downloaded successfully');
      } else if (response && response.success === false) {
        // Handle API error response
        toast.error(response.message || 'Failed to download Excel file');
      } else {
        // Handle unexpected response
        console.error('Unexpected response:', response);
        toast.error('Unexpected response from server');
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || 'Failed to download Excel file');
      }
    }
  };

  const fetchLeadsForDate = useCallback(async (date: string, page: number, itemsPerPage: number) => {
    setDatePagination(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        loading: true,
      }
    }));

    try {
      // Prepare query parameters with all current filters
      const queryParams: any = {
        companyName: StaticCompanyOptions[comapanyTab],
        status: selectedStatus,
        staffId: si,
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        reason: r,
        date,
        page: page,
        limit: itemsPerPage,
      };

      // Add search query if available
      if (searchQuery) {
        queryParams.search = searchQuery;
      }

      // Add other filters if available
      if (Object.keys(filters).length > 0) {
        Object.keys(filters).forEach(key => {
          if (filters[key] && filters[key].length > 0) {
            const fieldMap: Record<string, string> = {
              'created date': 'createdAt',
              'party': 'partyName',
              'Mobile No': 'mobile',
              'Reason to Call': 'reason',
              'Unit No': 'unitNo',
              'market': 'marketName',
              'area': 'area',
              'party status': 'partyTag',
              'assign to': 'assignedToFilter',
              'Created By': 'createdBy'
            };

            const backendField = fieldMap[key] || key;

            if (filters[key].length > 1) {
              queryParams[backendField] = filters[key].join(',');
            } else {
              queryParams[backendField] = filters[key][0];
            }
          }
        });
      }

      // Add assignedTo filter for canViewOwn permission
      if (canViewOwn && !canViewGlobal && currentUserName) {
        queryParams.assignedToFilter = currentUserName;
      }

      const response = await leadService.getAllLeads(queryParams);

      if (response.success) {
        setDatePagination(prev => ({
          ...prev,
          [date]: {
            ...prev[date],
            data: response.data || [],
            totalItems: response.count || 0,
            loading: false,
          }
        }));
      }
    } catch (error) {
      console.error(`Error fetching leads for date ${date}:`, error);
      toast.error(`Failed to fetch leads for ${date}`);
      setDatePagination(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          loading: false,
        }
      }));
    }
  }, [searchQuery, filters, si, r, selectedCompanyId, selectedStatus, canViewOwn, canViewGlobal, currentUserName, startDate, endDate]);

  const sortDatesDesc = (dates: { date: string; count: number }[]) => {
    return dates.sort((a, b) => {
      const [da, ma, ya] = a.date.split('/').map(Number);
      const [db, mb, yb] = b.date.split('/').map(Number);

      const dateA = new Date(ya, ma - 1, da);
      const dateB = new Date(yb, mb - 1, db);

      return dateB.getTime() - dateA.getTime(); // Latest first
    });
  };

  const fetchDates = useCallback(async () => {
    setLoadingDates(true);
    try {
      // Apply all current filters to the dates fetch
      const queryParams: any = {
        companyName: selectedCompanyId,
        status: selectedStatus,
        staffId: si,
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        reason: r,
        getDatesOnly: true,
      };

      // Add search query if available
      if (searchQuery) {
        queryParams.search = searchQuery;
      }

      // Add other filters if available
      if (Object.keys(filters).length > 0) {
        Object.keys(filters).forEach(key => {
          if (filters[key] && filters[key].length > 0) {
            const fieldMap: Record<string, string> = {
              'created date': 'createdAt',
              'party': 'partyName',
              'Mobile No': 'mobile',
              'Reason to Call': 'reason',
              'Unit No': 'unitNo',
              'market': 'marketName',
              'area': 'area',
              'party status': 'partyTag',
              'assign to': 'assignedToFilter',
              'Created By': 'createdBy'
            };

            const backendField = fieldMap[key] || key;

            if (filters[key].length > 1) {
              queryParams[backendField] = filters[key].join(',');
            } else {
              queryParams[backendField] = filters[key][0];
            }
          }
        });
      }

      // Add assignedTo filter for canViewOwn permission
      if (canViewOwn && !canViewGlobal && currentUserName) {
        queryParams.assignedToFilter = currentUserName;
      }

      const res = await leadService.getAllLeads(queryParams);
      const response = res.res.data;

      if (response.success) {

        // 🔥 SORT HERE (latest → oldest)
        const sortedDates = sortDatesDesc(response.dates || []);

        setAvailableDates(sortedDates);

        const newPagination: DatePaginationState = {};
        sortedDates.forEach((dateInfo: { date: string, count: number }) => {
          newPagination[dateInfo.date] = {
            currentPage: 1,
            itemsPerPage: ITEMS_PER_PAGE,
            totalItems: dateInfo.count,
            loading: false,
            data: [],
          };
        });
        setDatePagination(newPagination);

        sortedDates.forEach((dateInfo: { date: string }) => {
          fetchLeadsForDate(dateInfo.date, 1, ITEMS_PER_PAGE);
        });
      }

    } catch (error) {
      console.error('Error fetching dates:', error);
      toast.error('Failed to fetch lead dates');
    } finally {
      setLoadingDates(false);
    }
  }, [searchQuery, filters, si, r, selectedCompanyId, selectedStatus, fetchLeadsForDate, canViewOwn, canViewGlobal, currentUserName, startDate, endDate]);

  // Tab changes को handle करें
  useEffect(() => {
    // Check both permissions
    if ((canViewGlobal || canViewOwn) && router.isReady) {
      setDatePagination({});
      fetchDates();
    }
  }, [comapanyTab, tab, canViewGlobal, canViewOwn, router.isReady]);

  // Auto-scroll to today's section
  useEffect(() => {
    if (todayRef.current) todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [availableDates]);

  // Tab change handlers
  const handleCompanyTabChange = (newTab: number) => {
    setCompanyTab(newTab);
    const companyName = newTab === 0 ? "Sakshi Creation" : "Quality Packaging";
    router.push({
      pathname: router.pathname,
      query: { ...router.query, c: companyName }
    });
  };

  const handleStatusTabChange = (newTab: number) => {
    setTab(newTab);
    const status = newTab === 0 ? "pending,rescheduled" : "completed,cancelled";
    router.push({
      pathname: router.pathname,
      query: { ...router.query, status }
    });
  };

  const handleClick = (id: string) => router.push(`/admin/party-call/view-lead/${id}`);

  const handleUpdateClick = (lead: Lead) => {
    setSelectedLead(lead);
    setOpenAssignDialog(true);
  };

  const handleDeleteClick = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7F56D9",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await leadService.deleteLead(id);
        Swal.fire({
          title: "Deleted!",
          text: "The lead has been deleted.",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });

        setDatePagination({});
        fetchDates();
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

  // Handle page change for a specific date
  const handlePageChange = (date: any, page: any) => {
    const pagination = datePagination[date];
    if (pagination) {
      fetchLeadsForDate(date, page, pagination.itemsPerPage);
      setDatePagination(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          currentPage: page,
        }
      }));
    }
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!selectedFilterField) {
        setFilterOptions([]);
        return;
      }

      setLoadingFilterOptions(true);
      try {
        const fieldMap: Record<string, string> = {
          'created date': 'createdAt',
          'party': 'partyName',
          'Mobile No': 'mobile',
          'Reason to Call': 'reason',
          'Unit No': 'unitNo',
          'market': 'marketName',
          'area': 'area',
          'party status': 'partyTag',
          'assign to': 'assignedTo',
          'Created By': 'createdBy'
        };

        const apiField = fieldMap[selectedFilterField] || selectedFilterField;

        const response = await leadService.searchFilterOptions(apiField, "", filters);

        if (response.success) {
          setFilterOptions(response.data || []);
        } else {
          toast.error(response.message || "Failed to load filter options");
          setFilterOptions([]);
        }
      } catch (error: any) {
        console.error("Error fetching filter options:", error);
        toast.error(error.message || "Failed to load filter options");
        setFilterOptions([]);
      } finally {
        setLoadingFilterOptions(false);
      }
    };

    fetchFilterOptions();
  }, [selectedFilterField, filters]);

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
      setDatePagination({});
      fetchDates();
    });
  };

  // Function to handle search button click
  const handleSearchClick = () => {
    setDatePagination({});
    fetchDates();
  };

  // Function to handle clear button click
  const handleClearClick = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setFilters({});
    setDatePagination({});
    fetchDates();
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
          {/* <Typography fontWeight={500} sx={{ fontSize: 14 }}>
            {row.companyName?.companyName || "N/A"}
            {row.isRescheduledCall && (
              <Tooltip title={`Rescheduled from ${new Date(row.originalLeadId?.date).toLocaleDateString('en-GB')}`}>
                <ThemeChip label="Rescheduled" color="warning" size="small" sx={{ ml: 1, background: "#FFFAEB", color: "#B54708" }} />
              </Tooltip>
            )}
          </Typography> */}
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-GB") : "N/A"}
      </TableCell>
      <TableCell
        sx={{ cursor: "pointer", fontSize: 14 }}
        onClick={() => handleClick(row.partyName?._id || "")}
      >
        {row.partyName?.partyName || "N/A"}
      </TableCell>
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
      <TableCell sx={{ fontSize: 14 }}>{row.partyName?.contactPerson || "N/A"}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.partyName?.ownerWhatsAppNo || "N/A"}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.partyName?.partyTag}</TableCell>
      {/* <TableCell sx={{ fontSize: 14 }}>
          <Typography sx={{ fontSize: 14 }} title={row.remarks} noWrap>
            {row.remarks && row.remarks.length > 10
              ? `${row.remarks.substring(0, 10)}...`
              : row.remarks}
          </Typography>
        </TableCell> */}
      <TableCell sx={{ fontSize: 14 }}>
        {row.reason === "Other" ? row.customReason || "Other" : row.reason}
      </TableCell>
      
      
      <TableCell sx={{ fontSize: 14 }}>
        <Tooltip title={row.feedback || row.callFeedback || "No feedback"}>
          <Typography
            sx={{
              maxWidth: 150,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {truncateText(row.feedback || row.callFeedback || "N/A", 20)}
          </Typography>
        </Tooltip>
      </TableCell>
      {/* <TableCell sx={{ fontSize: 14 }}>
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
      </TableCell> */}
      <TableCell sx={{ fontSize: 14 }}>
        <ThemeChip
          label={getFirstFourChars(row.status) || "N/A"}
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
      {/* Only show company tabs if user has access to both companies AND has viewGlobal permission */}
      {hasBothCompanies && canViewGlobal && (
        <TabComponent activeTab={comapanyTab} setActiveTab={handleCompanyTabChange} />
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
            Clear Range
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
          <Button
            variant="contained"
            onClick={handleSearchClick}
            sx={{
              backgroundColor: "#7F56D9",
              color: "white",
              "&:hover": {
                backgroundColor: "#5d35b3",
              },
              height: 35,
            }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={handleClearClick}
            sx={{
              borderColor: "#7F56D9",
              color: "#7F56D9",
              "&:hover": {
                borderColor: "#5d35b3",
                backgroundColor: "#f5f0ff",
              },
              height: 35,
            }}
          >
            Clear
          </Button>
          <FilterDropdown
            filterOptions={canViewOwn && !canViewGlobal ? ['created date', 'party', 'Mobile No', 'Reason to Call', 'Unit No', 'market', 'area', 'party status', 'assign to'] : ['created date', 'party', 'Mobile No', 'Reason to Call', 'Unit No', 'market', 'area', 'party status', 'assign to', 'Created By']}
            uniqueValues={filterOptions}
            loading={loadingFilterOptions}
            onFiltersChange={setFilters}
            filters={filters}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />
          <IconButton
            onClick={handleExcelDownload}
            sx={{
              border: "1px solid #D0D5DD",
              borderRadius: 2,
              p: 1,
              color: "#667085",
              display: "flex",
              alignItems: "center",
            }}
            title="Download as Excel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="16"
              width="16"
              viewBox="0 0 384 512"
            // style={{ marginRight: "8px" }}
            >
              <path
                fill="#667085"
                d="M224 136V0H24C10.7 0 0 10.7 0 24v464c13.3 0 24
                                           10.7 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 
                                           0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 
                                           8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 
                                           405.5 192 373 192 373c-6.4 14.8-10 20-36.6 
                                           68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 
                                           0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 
                                           .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 
                                           6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 
                                           6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 
                                           10.6-6.3H274c9.5-.1 15.2 10.4 10.1 
                                           18.4zM384 121.9v6.1H256V0h6.1c6.4 0 
                                           12.5 2.5 17 7l97.9 98c4.5 4.5 7 
                                           10.6 7 16.9z"
              />
            </svg>
            {/* <Typography fontSize={12}>Download excel</Typography>  */}
          </IconButton>
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

      <TabComponent
        activeTab={tab}
        setActiveTab={handleStatusTabChange}
        tabList={tabLabels}
        align="left"
      />

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
        {loadingDates ? (
          <Loader />
        ) : (
          availableDates.map((dateInfo) => {
            const { date, count } = dateInfo;
            const pagination = datePagination[date] || {
              currentPage: 1,
              itemsPerPage: ITEMS_PER_PAGE,
              totalItems: count,
              loading: true,
              data: [],
            };

            const { currentPage, itemsPerPage, loading, data } = pagination;

            return (
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
                <Typography variant="subtitle1" fontWeight={600}>
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

                {loading ? (
                  <Loader />
                ) : (
                  <>
                    <CustomTable2
                      tableHeader={columns}
                      rowData={data}
                      showDatePicker={false}
                      showSearch={false}
                      showFillter={false}
                      renderRow={renderRow}
                      count={count}
                      showHeaderCheckbox={false}
                      page={currentPage}
                      handlePageChange={handlePageChange}
                      date={date}
                    />
                  </>
                )}
              </Box>
            );
          })
        )}
      </Box>

      {openAssignDialog ? (
        <AssignLeadDialog
          open={openAssignDialog}
          onClose={() => {
            setOpenAssignDialog(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onSuccess={handleAssignSuccess}
          company={companies.find((item) => item.companyName === StaticCompanyOptions[comapanyTab])}
        />
      ) : null}
    </>
  );
};

export default LeadManagementPage;
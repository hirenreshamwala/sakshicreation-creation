"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TableCell,
  Avatar,
  IconButton,
  InputBase,
  Tooltip
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import FilterDropdown from "@/component/fillter";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AssignTaskDialog from "@/component/assigntaskdailog";
import { authService } from "@/services/auth.service";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DateRangePicker from "@/component/daterangepicker";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";
import { FiSearch } from "react-icons/fi";
import { toast } from "react-toastify";
import TabComponent from "@/component/Dialog/TabComponent";
import { formatDateToDDMMYYYY, getCompanyWisePermission, getFirstFourChars } from "@/utills/utills";
import { useRouter } from "next/router";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import { StaticCompanyOptions } from "@/constants";
import AddQPOrderDialog from "@/component/allorderdailog/QpOrderDialog";
import AddSakhiOrderDialog from "@/component/allorderdailog";
import CustomTable2 from "@/component/common_component/Table/CustomTable/CustomTable2";
import { assignTaskService } from "@/services/assignTask.service";
import Link from "next/link";

interface Task {
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
  reasonForVisit: string;
  customReason?: string;
  assignTo: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  status: string;
  rescheduleDate?: string;
  isRescheduledTask?: boolean;
  originalTaskId?: {
    _id: string;
    date: string;
    createdAt: string;
  };
  remarks: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
  };
}

interface DatePaginationState {
  [date: string]: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    loading: boolean;
    data: Task[];
  };
}

interface RowData {
  id: string;
  company: { name: string; avatar?: string };
  date: string;
  party: string;
  reason: string;
  address: string;
  market: string;
  area: string;
  mobile: string;
  remarks: string;
  assignBy: string;
  assignTo: string;
  status: string;
  feedback?: string;
  statusType: "success" | "warning" | "error";
  rescheduleDate?: string;
  isRescheduledTask?: boolean;
  originalTaskDate?: string | null;
  highlightYellow?: boolean;
}

const tabLabels = ["Pending", "Completed"];

const AssignTaskPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    assignTasks = [],
  } = useAppSelector((state) => state.assignTasks || {});

  const { user } = useAppSelector((state) => state.auth);
  const { companies } = useAppSelector((state) => state.company);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [companyTab, setCompanyTab] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [scDialog, setScDialog] = useState(false);
  const [qpDialog, setQpDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusTab, setStatusTab] = useState(0);
  const [rowData, setRowData] = useState<RowData | null>(null);
  const [tempEditId, setTempEditId] = useState<string | null>(null);
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const todayRef = useRef<HTMLDivElement>(null);
  const { staffId: si, startDate: st, endDate: e, status: s, reason: r, c } = router.query;
  const [filterOptions, setFilterOptions] = useState<string[]>([]);
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);

  // New state for applied filters
  const [appliedSearchQuery, setAppliedSearchQuery] = useState<string>("");
  const [appliedStartDate, setAppliedStartDate] = useState<Date | null>(null);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | null>(null);

  // Pagination state
  const [availableDates, setAvailableDates] = useState<{ date: string, count: number }[]>([]);
  const [datePagination, setDatePagination] = useState<DatePaginationState>({});
  const [loadingDates, setLoadingDates] = useState(true);

  const ITEMS_PER_PAGE = 10;

  const canViewGlobal = user?.role?.permissions?.assign_task?.view_global;
  const canViewOwn = user?.role?.permissions?.assign_task?.view_own;
  const cancreate = user?.role?.permissions?.assign_task?.create;
  const canedit = user?.role?.permissions?.assign_task?.edit;
  const candelete = user?.role?.permissions?.assign_task?.delete;

  // Get current user's full name for canViewOwn filter
  const currentUserName = useMemo(() => {
    if (!user) return "";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }, [user]);

  const columns = useMemo(() => {
    const baseColumns = [
      { id: "checkbox", label: "checkbox" },
      { id: "company", label: "Company" },
      { id: "date", label: "Date" },
      { id: "party", label: "Party" },
      { id: "address", label: "Unit No" },
      { id: "market", label: "Market Name" },
      { id: "area", label: "Area" },
      { id: "contactPerson", label: "Contact Person" },
      { id: "mobile", label: "Mobile No." },
      { id: "partyTag", label: "Tag" },
      { id: "reason", label: "Reason to Visit" },
      { id: "remarks", label: "Remarks" },
      { id: "feedback", label: "Feedback" },
      { id: "status", label: "Status" },
      { id: "assignBy", label: "Created By" },
      { id: "assignTo", label: "Assign To" },
    ];

    if (canedit || candelete) {
      baseColumns.push({ id: "action", label: "Action" });
    }

    return baseColumns;
  }, [canedit, candelete]);

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const handleSelectAllTasks = () => {
    const currentTaskIds = datePagination[availableDates[0]?.date]?.data?.map(task => task._id) || [];
    if (selectedTaskIds.length === currentTaskIds.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(currentTaskIds);
    }
  };
  const handleExcelDownload = async () => {
    try {
      // Create payload with all current filters
      const payload = {
        staffId: si,
        startDate: appliedStartDate ? appliedStartDate.toISOString() : null,
        endDate: appliedEndDate ? appliedEndDate.toISOString() : null,
        status: selectedStatus, // This is already an array
        companyName: StaticCompanyOptions[companyTab],
        partyName: filters['Party']?.[0],
        reason: filters['Reason to Visit']?.[0] || r,
        priority: null,
        date: null, // Since we're using date range
        unitNo: filters['Unit No']?.[0],
        marketName: filters['Market Name']?.[0],
        mobile: filters['Mobile No.']?.[0],
        createdBy: filters['Assign By']?.[0],
        assignToFilter: filters['Assign To']?.[0],
        party: filters['Party']?.[0],
        area: filters['Area']?.[0],
        search: appliedSearchQuery,
      };

      // Remove undefined/null values
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) =>
          value !== null && value !== undefined && value !== ''
        )
      );

      // Call the export service
      const blob = await assignTaskService.exportAssignTasksToExcel(cleanPayload);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AssignTasks_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);

      // Trigger download
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Excel file downloaded successfully');
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Failed to download Excel file');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedTaskIds.length} task(s). This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7F56D9",
      cancelButtonColor: "#d33",
      confirmButtonText: `Yes, delete ${selectedTaskIds.length} task(s)!`,
    });

    if (result.isConfirmed) {
      try {
        await assignTaskService.bulkDeleteAssignTasks(selectedTaskIds);
        Swal.fire({
          title: "Deleted!",
          text: `${selectedTaskIds.length} task(s) deleted successfully`,
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
        // Refresh data after deletion
        setDatePagination({});
        fetchDates(null, null);
        setSelectedTaskIds([]);
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Failed to delete tasks",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      }
    }
  };

  // Determine company permissions
  const hasSakshi = !!getCompanyWisePermission(5);
  const hasQP = !!getCompanyWisePermission(6);
  const hasBothCompanies = hasSakshi && hasQP;

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

  // Company tabs configuration
  const companyTabs = useMemo(() => {
    const tabs = [];
    if (hasSakshi) tabs.push({ id: 'sakshi', name: 'Sakshi', companyId: getCompanyWisePermission(5) });
    if (hasQP) tabs.push({ id: 'qp', name: 'QP', companyId: getCompanyWisePermission(6) });
    return tabs;
  }, [hasSakshi, hasQP]);

  // Selected company based on permissions
  const selectedCompanyId = useMemo(() => {
    if (hasBothCompanies) {
      return companyTabs[companyTab]?.companyId;
    } else if (hasSakshi) {
      return getCompanyWisePermission(5);
    } else if (hasQP) {
      return getCompanyWisePermission(6);
    }
    return null;
  }, [hasBothCompanies, companyTab, hasSakshi, hasQP, companyTabs]);

  // Selected status based on tab
  const selectedStatus = useMemo(() => {
    if (statusTab === 0) return ["pending", "rescheduled"];
    if (statusTab === 1) return ["completed", "cancelled"];
    return [];
  }, [statusTab]);

  useEffect(() => {
    if (c) setCompanyTab(c === "Quality Packaging" || c === "QP" ? 1 : 0);
  }, [c]);

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true));
  }, []);

  const toggleQpDialog = () => setQpDialog(!qpDialog);
  const toggleScDialog = () => setScDialog(!scDialog);

  // Set initial date range and status from query parameters
  useEffect(() => {
    if (st) {
      const start = new Date(st as string);
      setStartDate(start);
      setAppliedStartDate(start);
    }
    if (e) {
      const end = new Date(e as string);
      setEndDate(end);
      setAppliedEndDate(end);
    }
    if (s) {
      const statuses = (s as string)?.split(",");
      if (statuses.includes("completed") || statuses.includes("cancelled")) {
        setStatusTab(1);
      } else {
        setStatusTab(0);
      }
    }
  }, [st, e, s]);

  const mapStatusToType = (status: string): RowData["statusType"] => {
    switch (status) {
      case "Completed":
        return "success";
      case "Rescheduled":
        return "warning";
      case "Pending":
      case "Cancelled":
        return "error";
      default:
        return "warning";
    }
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setTempEditId(id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
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
        await assignTaskService.deleteAssignTask(id);
        Swal.fire({
          title: "Deleted!",
          text: "Task deleted successfully",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
        // Refresh data after deletion
        setDatePagination({});
        fetchDates(null, null);
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Failed to delete task",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      }
    }
  };

  const handleClick = (id: string) => {
    router.push(`/admin/assign-task/view-task/${id}`);
  };

  // Fetch tasks for specific date with pagination
  const fetchTasksForDate = useCallback(async (date: string, page: number, itemsPerPage: number) => {
    setDatePagination(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        loading: true,
      }
    }));

    try {
      const queryParams: any = {
        companyName: StaticCompanyOptions[companyTab],
        status: selectedStatus,
        staffId: si,
        reason: r,
        date: date, // Pass specific date
        page: page,
        limit: itemsPerPage,
      };

      // Use applied search query instead of current searchQuery
      if (appliedSearchQuery) {
        queryParams.search = appliedSearchQuery;
      }

      // Add other filters if available
      if (Object.keys(filters).length > 0) {
        Object.keys(filters).forEach(key => {
          if (filters[key] && filters[key].length > 0) {
            const fieldMap: Record<string, string> = {
              'Company': 'companyName',
              'Date': 'date',
              'Party': 'party',
              'Unit No': 'unitNo',
              'Market Name': 'marketName',
              'Area': 'area',
              'Mobile No.': 'mobile',
              'Reason to Visit': 'reason',
              'Assign By': 'assignBy',
              'Assign To': 'assignedTo',
              'Status': 'taskStatus'
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

      // Add applied date range if available
      if (appliedStartDate && appliedEndDate) {
        queryParams.startDate = appliedStartDate.toISOString();
        queryParams.endDate = appliedEndDate.toISOString();
      }

      // Add assignedTo filter for canViewOwn permission
      if (canViewOwn && !canViewGlobal && currentUserName) {
        queryParams.assignToFilter = currentUserName;
      }

      // Call the API
      const response = await assignTaskService.getAllAssignTasks(queryParams);

      if (response) {
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
      console.error(`Error fetching tasks for date ${date}:`, error);
      toast.error(`Failed to fetch tasks for ${date}`);
      setDatePagination(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          loading: false,
        }
      }));
    }
  }, [dispatch, appliedSearchQuery, appliedStartDate, appliedEndDate, filters, si, r, selectedCompanyId, selectedStatus, canViewOwn, canViewGlobal, currentUserName]);

  // Fetch dates with task counts
  const fetchDates = useCallback(async (startDate: Date, endDate: Date) => {
    setLoadingDates(true);
    try {
      const queryParams: any = {
        companyName: selectedCompanyId,
        status: selectedStatus,
        staffId: si,
        reason: r,
        getDatesOnly: true,
      };

      if (appliedSearchQuery) {
        queryParams.search = appliedSearchQuery;
      }

      if (Object.keys(filters).length > 0) {
        Object.keys(filters).forEach(key => {
          if (filters[key] && filters[key].length > 0) {
            const fieldMap: Record<string, string> = {
              'Company': 'companyName',
              'Date': 'date',
              'Party': 'partyName',
              'Unit No': 'unitNo',
              'Market Name': 'marketName',
              'Area': 'area',
              'Mobile No.': 'mobile',
              'Reason to Visit': 'reason',
              'Assign By': 'createdBy',
              'Assign To': 'assignToFilter',
              'Status': 'status'
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

      if (startDate && endDate) {
        queryParams.startDate = startDate.toISOString();
        queryParams.endDate = endDate.toISOString();
      }

      if (canViewOwn && !canViewGlobal && currentUserName) {
        queryParams.assignToFilter = currentUserName;
      }

      const response = await assignTaskService.getAllAssignTasks(queryParams);

      if (response?.data) {
        // Sort dates descending (latest first)
        const sortedDates = [...response.data].sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setAvailableDates(sortedDates || []);

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

        // Fetch tasks for each date (only first page)
        sortedDates.forEach((dateInfo: { date: string }) => {
          fetchTasksForDate(dateInfo.date, 1, ITEMS_PER_PAGE);
        });
      }
    } catch (error) {
      console.error('Error fetching dates:', error);
      toast.error('Failed to fetch task dates');
    } finally {
      setLoadingDates(false);
    }
  }, [dispatch, appliedSearchQuery, appliedStartDate, appliedEndDate, filters, si, r, selectedCompanyId, selectedStatus, fetchTasksForDate, canViewOwn, canViewGlobal, currentUserName]);

  // Tab changes को handle करें
  useEffect(() => {
    if ((canViewGlobal || canViewOwn) && router.isReady && selectedCompanyId) {
      setDatePagination({});
      fetchDates(appliedStartDate, appliedEndDate);
    }
  }, [companyTab, statusTab, fetchDates, canViewGlobal, canViewOwn, router.isReady, selectedCompanyId]);

  // Handle page change for a specific date
  const handlePageChange = (date: string, page: number) => {
    const pagination = datePagination[date];
    if (pagination) {
      fetchTasksForDate(date, page, pagination.itemsPerPage);
      setDatePagination(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          currentPage: page,
        }
      }));
    }
  };

  // Auto-scroll to today's section
  // useEffect(() => {
  //   if (todayRef.current) todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  // }, [availableDates]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push("/login");
      return;
    }
  }, [dispatch, router]);

  const defaultReasons = [
    "Delivery",
    "Get Payment",
    "Get Visit",
    "Order",
    "Complain",
    "Sample Approval",
    "Other",
  ];

  const mapTaskToRowData = (task: Task): RowData => {
    return {
      ...task,
      id: task._id,
      company: {
        name: task.companyName?.companyName || "Unknown",
        avatar: task.companyName?.avatar || ""
      },
      date: new Date(
        task.isRescheduledTask && task.originalTaskId?.createdAt
          ? task.originalTaskId.createdAt
          : task.createdAt
      ).toLocaleDateString("en-GB"),
      // Date:task.date,
      taskDate: task.date,
      reason: task.reasonForVisit || "N/A",
      party: task.partyName?.partyName || "Unknown",
      partyId: task.partyName?._id || "Unknown",
      address: task.partyName?.address?.unitNo || "N/A",
      market: task.partyName?.address?.marketName?.marketName || "N/A",
      contactPerson: task.partyName?.contactPerson || task.partyName?.ownerName || "N/A",
      area: task.partyName?.address?.area?.area || "N/A",
      mobile: task.partyName?.personMobileNo || task.partyName?.ownerMobile || "N/A",
      partyTag: task.partyName?.partyTag?.substring(0, 4) || "N/A",
      remarks: task.remarks || "N/A",
      assignBy: task.partyName.createdBy
        ? `${task.partyName.createdBy.firstName} ${task.partyName.createdBy.lastName}`
        : "Unknown",
      feedback: task.feedback || "N/A",
      AssignTo: task.assignTo,
      assignTo: task.assignTo
        ? `${task.assignTo.firstName} ${task.assignTo.lastName}`
        : "Unassigned",
      status: task.status || "Pending",
      statusType: mapStatusToType(task.status),
      isRescheduledTask: task.isRescheduledTask || false,
      originalTaskDate: task.originalTaskId?.date
        ? new Date(task.originalTaskId.date).toLocaleDateString("en-GB")
        : null,
      rescheduleDate: task.rescheduleDate,
      highlightYellow:
        !defaultReasons.includes(task.reasonForVisit) &&
        task.assignTo?.role?.roleName?.toLowerCase() === "driver",
    };
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const renderRow = (row: RowData) => {
    const getCellSx = (baseSx?: any) => ({
      ... (row.highlightYellow ? { backgroundColor: '#fff3cd' } : {}),
      ...baseSx
    });

    return (
      <>
        <TableCell sx={getCellSx()}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              sx={{ width: 32, height: 32 }}
              src={row.company.avatar}
              alt={row.company.name}
            />
            <Box>
              {/* <Typography fontWeight={500} sx={{ fontSize: 14 }}>
                {row.company.name}
              </Typography> */}
              {/* {row.isRescheduledTask && (
                <Tooltip title={`Rescheduled from ${row.originalTaskDate}`}>
                  <ThemeChip
                    label="Rescheduled"
                    color="warning"
                    size="small"
                    sx={{
                      mt: 0.5,
                      background: "#FFFAEB",
                      color: "#B54708",
                      fontSize: 11,
                      height: 20,
                    }}
                  />
                </Tooltip>
              )} */}
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={getCellSx({ fontSize: 14, color: "blue" })}>{row.date}</TableCell>
        <Link href={`/admin/assign-task/view-task/${row.partyId}?taskId=${row?._id}`}><TableCell
          sx={getCellSx({ cursor: "pointer", fontSize: 14 })}
        >
          {row.party}
        </TableCell></Link>

        <TableCell sx={getCellSx({ fontSize: 14 })}>
          <Typography
            sx={{
              maxWidth: 150,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {truncateText(row.address, 30)}
          </Typography>
        </TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.market}</TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.area}</TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.contactPerson}</TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.mobile}</TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.partyTag}</TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.reason}</TableCell>

        <TableCell sx={getCellSx()}>
          <Typography sx={{ fontSize: 14 }} title={row.remarks} noWrap>
            {row.remarks && row.remarks.length > 10
              ? `${row.remarks.substring(0, 10)}...`
              : row.remarks}
          </Typography>
        </TableCell>
        <TableCell sx={getCellSx()}>
          <Typography sx={{ fontSize: 14 }} title={row.feedback} noWrap>{row.feedback && row.feedback.length > 10
            ? `${row?.feedback.substring(0, 10)}...`
            : row?.feedback}</Typography>
        </TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{getFirstFourChars(row.status)}</TableCell>
        {/* <TableCell sx={getCellSx({ fontSize: 14 })}>
          <ThemeChip
            label={getFirstFourChars(row.status)}
            icon={
              row.statusType === "success" ? (
                <AiOutlineCheck style={{ fontSize: 18 }} />
              ) : row.statusType === "error" ? (
                <AiOutlineClose style={{ fontSize: 18 }} />
              ) : (
                <></>
              )
            }
            color={row.statusType}
            variant="filled"
            sx={{
              background:
                row.statusType === "success"
                  ? "#ECFDF3"
                  : row.statusType === "error"
                    ? "#FEF3F2"
                    : "#F2F4F7",
              color:
                row.statusType === "success"
                  ? "#027A48"
                  : row.statusType === "error"
                    ? "#D92D20"
                    : "#344054",
              fontWeight: 600,
              fontSize: 14,
              px: 1.5,
              height: 28,
            }}
          />
        </TableCell> */}
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.assignBy}</TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.assignTo}</TableCell>
        <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {canedit && (
              <IconButton
                color="primary"
                onClick={() => {
                  setRowData(row);
                  handleEdit(row.id);
                }}
              >
                <EditIcon />
              </IconButton>
            )}
            {candelete && (
              <IconButton color="error" onClick={() => handleDelete(row.id)}>
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </TableCell>

      </>
    );
  };

  // Filter options fetch
  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!selectedFilterField) {
        setFilterOptions([]);
        return;
      }

      setLoadingFilterOptions(true);
      try {
        const fieldMap: Record<string, string> = {
          'Company': 'companyName',
          'Date': 'date',
          'Party': 'partyName',
          'Unit No': 'unitNo',
          'Market Name': 'marketName',
          'Area': 'area',
          'Mobile No.': 'mobile',
          'Reason to Visit': 'reason',
          'Assign By': 'createdBy',
          'Assign To': 'assignTo',
          'Status': 'status'
        };

        const apiField = fieldMap[selectedFilterField] || selectedFilterField;

        // Call API to get filter options
        const response = await assignTaskService.searchFilterOptions(apiField, "", {
          companyName: selectedCompanyId,
          status: selectedStatus,
          getFilterOptions: true,
          filterField: apiField,
        });

        if (response?.data) {
          setFilterOptions(response.data || []);
        } else {
          toast.error("Failed to load filter options");
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
  }, [dispatch, selectedFilterField, filters, selectedCompanyId, selectedStatus]);

  // Handle search button click
  const handleSearch = (start, end) => {
    setAppliedSearchQuery(searchQuery);
    setAppliedStartDate(start);
    setAppliedEndDate(end);
    setDatePagination({});
    fetchDates(start, end);
  };

  // Handle clear button click
  const handleClear = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setAppliedSearchQuery("");
    setAppliedStartDate(null);
    setAppliedEndDate(null);
    setDatePagination({});
    fetchDates(null, null);
  };


  return (
    <>
      {/* Company Tabs - Only show if user has both companies */}
      {hasBothCompanies && (
        <Box sx={{ mb: 2 }}>
          <TabComponent
            activeTab={companyTab}
            setActiveTab={(newTab) => {
              setCompanyTab(newTab);
              const companyName = newTab === 0 ? "Sakshi Creation" : "Quality Packaging";
              router.push({
                pathname: router.pathname,
                query: { ...router.query, c: companyName }
              });
            }}
            tabs={companyTabs.map((c) => c.name)}
          />
        </Box>
      )}

      {/* Show current company name when user has only one permission */}
      {!hasBothCompanies && selectedCompanyId && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          <Typography variant="h6">
            Showing tasks for: {hasSakshi ? 'Sakshi' : 'QP'}
          </Typography>
        </Box>
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
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
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

          {/* Search and Clear buttons */}
          <ThemeButton onClick={() => handleSearch(startDate, endDate)}>
            Search
          </ThemeButton>
          <ThemeButton onClick={handleClear} color="secondary">
            Clear
          </ThemeButton>

          <FilterDropdown
            filterOptions={canViewOwn && !canViewGlobal ?
              ['Date', 'Party', 'Unit No', 'Market Name', 'Area', 'Mobile No.', 'Reason to Visit', 'Assign By'] :
              ['Date', 'Party', 'Unit No', 'Market Name', 'Area', 'Mobile No.', 'Reason to Visit', 'Assign By', 'Assign To']}
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
                setEditId(null);
                setTempEditId(null);
                setOpen(true);
              }}
            >
              + Assign New Task
            </ThemeButton>
          )}
          {candelete && selectedTaskIds.length > 0 && (
            <ThemeButton
              onClick={handleBulkDelete}
              color="error"
            >
              Delete Selected ({selectedTaskIds.length})
            </ThemeButton>
          )}
        </Box>
      </Box>

      {/* Status Tabs */}
      <TabComponent
        activeTab={statusTab}
        setActiveTab={(newTab) => {
          setStatusTab(newTab);
          const status = newTab === 0 ? "pending,rescheduled" : "completed,cancelled";
          router.push({
            pathname: router.pathname,
            query: { ...router.query, status }
          });
        }}
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
        ) : availableDates.length === 0 ? (
          <Typography>
            No tasks found for {hasBothCompanies ? companyTabs[companyTab]?.name : (hasSakshi ? 'Sakshi' : 'QP')}
            {appliedStartDate || appliedEndDate ? " for the selected date range" : ""}.
            {appliedSearchQuery ? ` matching "${appliedSearchQuery}"` : ""}.
          </Typography>
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
                  Task - <span style={{ color: "red" }}>{formatDateToDDMMYYYY(date)}</span>
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
                  <CustomTable2
                    tableHeader={columns}
                    rowData={data.map(mapTaskToRowData)}
                    renderRow={renderRow}
                    count={datePagination[date].totalItems}
                    page={currentPage}
                    handlePageChange={(dates, page) => handlePageChange(dates, page)}
                    date={date}
                    showHeaderCheckbox={false}
                    onSelectAll={(event: React.ChangeEvent<HTMLInputElement>) => handleSelectAllTasks(event)}
                    onSelectRow={(id: string) => handleSelectTask(id)}
                    selectedRows={selectedTaskIds}
                  />
                )}
              </Box>
            );
          })
        )}
      </Box>
      <AssignTaskDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditId(null);
        }}
        // accountMasters={accountMasters}
        toggleScDialog={toggleScDialog}
        toggleQpDialog={toggleQpDialog}
        taskId={editId}
        refreshData={() => {
          setDatePagination({});
          fetchDates(null, null);
        }}
        rowData={rowData}
        companyTab={companyTab}
        company={companies?.find((item) => item.companyName === StaticCompanyOptions[companyTab])}
      />

      {
        qpDialog && (
          <AddQPOrderDialog
            company={companies.find((item) => item.companyName === StaticCompanyOptions[1])?._id}
            open={qpDialog}
            onClose={() => {
              toggleQpDialog();
              setTempEditId(null);
            }}
            refreshData={() => {
              setDatePagination({});
              fetchDates(null, null);
            }}
            party={assignTasks.find((item) => item._id === tempEditId)?.partyName?._id}
          />
        )
      }

      {
        scDialog && (
          <AddSakhiOrderDialog
            company={companies.find((item) => item.companyName === StaticCompanyOptions[0])?._id}
            open={scDialog}
            onClose={() => {
              toggleScDialog();
              setTempEditId(null);
            }}
            party={assignTasks.find((item) => item._id === tempEditId)?.partyName?._id}
          />
        )
      }
    </>
  );
};

export default AssignTaskPage;
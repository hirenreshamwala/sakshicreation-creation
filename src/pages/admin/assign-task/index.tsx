"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  TableCell,
  Avatar,
  IconButton,
  InputBase,
  Tooltip,
  TableRow,
  Checkbox,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllAssignTasksThunk,
  getAssignTaskByStaffIdThunk,
  deleteAssignTaskThunk,
  bulkDeleteAssignTasksThunk,
  clearError,
  clearSuccessMessage,
  selectTask,
  deselectTask,
  selectAllTasks,
  clearSelectedTasks,
  toggleTaskSelection,
} from "@/store/slices/assignTaskSlice";
import FilterDropdown from "@/component/fillter";
import BasicTable from "@/component/common_component/Table/themetable";
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
import { getCompanyWisePermission } from "@/utills/utills";
import { useRouter } from "next/router";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import { StaticCompanyOptions } from "@/constants";
import AddQPOrderDialog from "@/component/allorderdailog/QpOrderDialog";
import AddSakhiOrderDialog from "@/component/allorderdailog";

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



const tabLabels = ["Pending", "History"];

const AssignTaskPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    assignTasks = [],
    loading = false,
    error = null,
    successMessage = null,
    selectedTasks = [],
  } = useAppSelector((state) => state.assignTasks || {});

  const { user } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [companyTab, setCompanyTab] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [scDialog, setScDialog] = useState(false)
  const [qpDialog, setQpDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusTab, setStatusTab] = useState(0);
  const [tempEditId, setTempEditId] = useState(null)
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const todayRef = useRef<HTMLDivElement>(null);
  const { staffId: si, startDate: st, endDate: e, status: s, reason: r, c, companyName } = router.query
  const { companies } = useAppSelector((state) => state.company)
  const canViewGlobal = user?.role?.permissions?.assign_task?.view_global;
  const canViewOwn = user?.role?.permissions?.assign_task?.view_own;
  const cancreate = user?.role?.permissions?.assign_task?.create;
  const canedit = user?.role?.permissions?.assign_task?.edit;
  const candelete = user?.role?.permissions?.assign_task?.delete;

  const selectedTasksCount = selectedTasks.length;

  const columns = useMemo(() => {
    const baseColumns = [
      ...(candelete ? [{ id: "checkbox", label: "" }] : []),
      { id: "company", label: "Company" },
      { id: "date", label: "Created Date" },
      { id: "party", label: "Party" },
      { id: "address", label: "Unit No" },
      { id: "market", label: "Market Name" },
      { id: "area", label: "Area" },
      { id: "mobile", label: "Mobile No." },
      { id: "reason", label: "Reason to Visit" },
      { id: "assignBy", label: "Assign By" },
      { id: "assignTo", label: "Assign To" },
      { id: "remarks", label: "Remarks" },
      { id: "feedback", label: "Feedback" },
      { id: "status", label: "Status" },
    ];

    if (canedit || candelete) {
      baseColumns.push({ id: "action", label: "Action" });
    }

    return baseColumns;
  }, [canedit, candelete]);


  const handleSelectTask = (taskId: string) => {
    dispatch(toggleTaskSelection(taskId));
  };

  const handleSelectAllTasks = () => {
    const currentTaskIds = filteredTasks.map(task => task._id);
    if (selectedTasks.length === currentTaskIds.length) {
      // If all are selected, deselect all
      dispatch(clearSelectedTasks());
    } else {
      // Select all current tasks
      dispatch(selectAllTasks(currentTaskIds));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedTasks.length} task(s). This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7F56D9",
      cancelButtonColor: "#d33",
      confirmButtonText: `Yes, delete ${selectedTasks.length} task(s)!`,
    });

    if (result.isConfirmed) {
      try {
        await dispatch(bulkDeleteAssignTasksThunk(selectedTasks)).unwrap();
        Swal.fire({
          title: "Deleted!",
          text: `${selectedTasks.length} task(s) deleted successfully`,
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
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
  }, [user, hasSakshi, hasQP]);

  // Selected company based on permissions
  const selectedCompanyId = hasBothCompanies
    ? companyTabs[companyTab]?.companyId
    : hasSakshi
      ? getCompanyWisePermission(5)
      : getCompanyWisePermission(6);

  useEffect(() => {
    if (c)
      setCompanyTab(c === "Quality Packaging" || c === "QP" ? 1 : 0)
  }, [c])

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true))
  }, [])

  const toggleQpDialog = () => setQpDialog(!qpDialog)
  const toggleScDialog = () => setScDialog(!scDialog)

  // Set initial date range and status from query parameters
  useEffect(() => {
    if (st) setStartDate(new Date(st as string));
    if (e) setEndDate(new Date(e as string));
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
    setTempEditId(id)
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
        await dispatch(deleteAssignTaskThunk(id)).unwrap();
        Swal.fire({
          title: "Deleted!",
          text: "Task deleted successfully",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
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

  const handleClick = (id: string) => {
    router.push(`/admin/assign-task/view-task/${id}`);
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, dispatch]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push("/login");
      return;
    }


    if (canViewGlobal && router.isReady) {
      dispatch(getAllAssignTasksThunk({
        companyName,
        staffId: si,
        startDate: st,
        endDate: e,
        status: s?.split(",").map(s => s.toLowerCase()),
        reason: r
      }));
    } else if (canViewOwn && user?.id) {
      dispatch(getAssignTaskByStaffIdThunk(user?.id));
    }

    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    };
  }, [dispatch, router.isReady, canViewGlobal, canViewOwn, user?.id, selectedCompanyId,]);

  const defaultReasons = [
    "Delivery",
    "Get Payment",
    "Get Visit",
    "Order",
    "Complain",
    "Sample Approval",
    "Other",
  ];

  const mapTasksToRows = (tasks: any[]): RowData[] =>
    tasks.map((task) => ({
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
      reason: task.reasonForVisit || "N/A",
      party: task.partyName?.partyName || "Unknown",
      address: task.partyName?.address?.unitNo || "N/A",
      market: task.partyName?.address?.marketName?.marketName || "N/A",
      area: task.partyName?.address?.area?.area || "N/A",
      mobile: task.partyName?.ownerWhatsAppNo || "N/A",
      remarks: task.remarks || "N/A",
      feedback: task.feedback || "N/A",
      assignBy: task.createdBy
        ? `${task.createdBy.firstName} ${task.createdBy.lastName}`
        : "Unknown",
      assignTo: task.assignTo
        ? `${task.assignTo.firstName} ${task.assignTo.lastName}`
        : "Unassigned",
      status: task.status || "Pending",
      statusType: mapStatusToType(task.status),
      isRescheduledTask: task.isRescheduledTask || false,
      originalTaskDate: task.originalTaskId?.date
        ? new Date(task.originalTaskId.date).toLocaleDateString("en-GB")
        : null,
      rescheduleDate: task.rescheduleDate
        ? new Date(task.rescheduleDate).toLocaleDateString("en-GB")
        : undefined,

      /** 🟡 Custom Highlight Condition */
      highlightYellow:
        !defaultReasons.includes(task.reasonForVisit) &&
        task.assignTo?.role?.roleName?.toLowerCase() === "driver",
    }));

  // Map filter labels to rowData keys
  const filterFieldToKey: { [key: string]: keyof RowData } = {
    Company: "company",
    Date: "date",
    Party: "party",
    "Unit No": "address",
    "Market Name": "market",
    Area: "area",
    "Mobile No.": "mobile",
    "Assign By": "assignBy",
    "Assign To": "assignTo",
    "Reason to Visit": "reason",
    Status: "status",
  };

  // Compute unique values for the selected filter field
  const uniqueValues = useMemo(() => {
    if (!selectedFilterField) return [];
    const key = filterFieldToKey[selectedFilterField];
    if (!key) return [];

    const values = mapTasksToRows(assignTasks).map((row) => {
      if (key === "company") {
        return (row[key] as any)?.name || "N/A";
      }
      return String(row[key] || "N/A");
    });
    return Array.from(new Set(values)).sort();
  }, [assignTasks, selectedFilterField]);

  // Filter tasks by company first
  const tasksFilteredByCompany = useMemo(() => {
    return assignTasks.filter(task =>
      task.companyName?._id === selectedCompanyId
    );
  }, [assignTasks, selectedCompanyId]);

  const filteredTasks = useMemo(() => {
    let filtered = tasksFilteredByCompany;

    // Apply status filter
    filtered = filtered.filter((task) => {
      const taskDate = new Date(task.date);
      const isTaskToday = isToday(
        taskDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      );

      if (statusTab === 0) {
        // Pending tab: Include Pending, Rescheduled, and Completed tasks from today
        return (
          ["Pending", "Rescheduled"].includes(task.status) ||
          (task.status === "Completed" && isTaskToday)
        );
      } else {
        // History tab: Include Completed tasks not from today and Cancelled tasks
        return task.status === "Cancelled" || (task.status === "Completed" && !isTaskToday);
      }
    });

    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter((task) => {
        const taskDate = new Date(task.date);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
        return (!start || taskDate >= start) && (!end || taskDate <= end);
      });
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((task) =>
        [
          task.partyName?.partyName,
          task.companyName?.companyName,
          task.reasonForVisit,
        ].some((value) =>
          value?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply multiple filters
    if (Object.keys(filters).length > 0) {
      filtered = filtered.filter((task) => {
        const row = mapTasksToRows([task])[0];
        return Object.entries(filters).every(([field, values]) => {
          const key = filterFieldToKey[field];
          if (!key) return true;
          const value = key === "company" ? (row[key] as any)?.name : row[key];
          return values.includes(String(value));
        });
      });
    }

    return filtered;
  }, [tasksFilteredByCompany, statusTab, startDate, endDate, searchQuery, filters]);

  const filteredGroupedTasks = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      const taskDate = new Date(task.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      if (!acc[taskDate]) {
        acc[taskDate] = [];
      }
      acc[taskDate].push(task);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredTasks]);

  const filteredSortedDates = useMemo(() => {
    return Object.keys(filteredGroupedTasks).sort((a, b) => {
      const dateA = new Date(a?.split("/").reverse().join("-"));
      const dateB = new Date(b?.split("/").reverse().join("-"));
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredGroupedTasks]);

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [filteredSortedDates, statusTab, startDate, endDate, searchQuery, filters]);

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const renderRow = (row: RowData) => {

    const isSelected = selectedTasks.includes(row.id);

    const getCellSx = (baseSx?: any) => ({
      ... (row.highlightYellow ? { backgroundColor: '#fff3cd' } : {}),
      ...baseSx
    });

    return (
      <>
        {/* {candelete && (
          <TableCell sx={getCellSx()}>
            <Checkbox
              checked={isSelected}
              onChange={() => handleSelectTask(row.id)}
              color="primary"
            />
          </TableCell>
        )} */}
        <TableCell sx={getCellSx()}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              sx={{ width: 32, height: 32 }}
              src={row.company.avatar}
              alt={row.company.name}
            />
            <Box>
              <Typography fontWeight={500} sx={{ fontSize: 14 }}>
                {row.company.name}
              </Typography>
              {row.isRescheduledTask && (
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
              )}
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={getCellSx({ fontSize: 14, color: "blue" })}>{row.date}</TableCell>
        <TableCell
          onClick={() => handleClick(row.id)}
          sx={getCellSx({ cursor: "pointer", fontSize: 14 })}
        >
          {row.party}
        </TableCell>

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
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.mobile}</TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.reason}</TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.assignBy}</TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>{row.assignTo}</TableCell>
        <TableCell sx={getCellSx()}>
          <Typography sx={{ fontSize: 14 }} title={row.remarks} noWrap>{row.remarks && row.remarks.length > 10
            ? `${row.remarks.substring(0, 10)}...`
            : row.remarks}</Typography>
        </TableCell>
        <TableCell sx={getCellSx()}>
          <Typography sx={{ fontSize: 14 }} title={row.feedback} noWrap>{row.feedback && row.feedback.length > 10
            ? `${row?.feedback.substring(0, 10)}...`
            : row?.feedback}</Typography>
        </TableCell>
        <TableCell sx={getCellSx({ fontSize: 14 })}>
          <ThemeChip
            label={row.status}
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
        </TableCell>
        <TableCell sx={getCellSx({ display: "flex" })}>
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
        </TableCell>
      </>
    );
  };




  return (
    <>
      {/* Company Tabs - Only show if user has both companies */}
      {hasBothCompanies && (
        <Box sx={{ mb: 2 }}>
          <TabComponent
            activeTab={companyTab}
            setActiveTab={setCompanyTab}
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
            uniqueValues={uniqueValues}
            onFiltersChange={setFilters}
            filters={filters}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />
          {cancreate && (
            <ThemeButton
              onClick={() => {
                setEditId(null);
                setTempEditId(null)
                setOpen(true);
              }}
            >
              + Assign New Task
            </ThemeButton>
          )}
          {candelete && (
            <ThemeButton
              onClick={handleBulkDelete}
              disabled={selectedTasksCount === 0}
              sx={{
                opacity: selectedTasksCount === 0 ? 0.6 : 1,
                cursor: selectedTasksCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Delete Selected ({selectedTasksCount})
            </ThemeButton>
          )}
        </Box>
      </Box>

      {/* Status Tabs */}
      <TabComponent activeTab={statusTab} setActiveTab={setStatusTab} tabList={tabLabels} align="left" />

      <Box
        sx={{
          maxHeight: "70vh",
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
            No tasks found for {hasBothCompanies ? companyTabs[companyTab]?.name : (hasSakshi ? 'Sakshi' : 'QP')}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Task - <span style={{ color: "red" }}>{date}</span>
                  {isToday(date) && (
                    <ThemeChip
                      label="Today"
                      color="success"
                      size="small"
                      sx={{ ml: 1, background: "#3a43beff" }}
                    />
                  )}
                </Typography>

              </Box>
              <BasicTable
                tableHeader={columns}
                rowData={mapTasksToRows(filteredGroupedTasks[date])}
                showDatePicker={false}
                showSearch={false}
                showFillter={false}
                renderRow={renderRow}
                onSelectAll={handleSelectAllTasks}
                onSelectRow={handleSelectTask}
                selectedRows={selectedTasks}
                showHeaderCheckbox={false}
              />
            </Box>
          ))
        )}
      </Box>
      <AssignTaskDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditId(null);
        }}
        toggleScDialog={toggleScDialog}
        toggleQpDialog={toggleQpDialog}
        taskId={editId}
        refreshData={() => {
          dispatch(getAllAssignTasksThunk({
            companyName,
            staffId: si,
            startDate: st,
            endDate: e,
            status: s?.split(",").map(s => s.toLowerCase()),
            reason: r
          }));
        }}
        companyTab={companyTab}
        company={companies?.find((item) => item.companyName === StaticCompanyOptions[companyTab])}
      />


      {qpDialog ? <AddQPOrderDialog
        company={companies.find((item) => item.companyName === StaticCompanyOptions[1])?._id}
        open={qpDialog}
        onClose={() => {
          toggleQpDialog()
          setTempEditId(null)
          // refreshData();
        }}
        refreshData={() => { }}
        party={assignTasks.find((item) => item._id === tempEditId)?.partyName?._id}
      /> : null}

      {scDialog ? <AddSakhiOrderDialog
        company={companies.find((item) => item.companyName === StaticCompanyOptions[0])?._id}
        open={scDialog}
        onClose={() => {
          toggleScDialog()
          setTempEditId(null)
        }}
        party={assignTasks.find((item) => item._id === tempEditId)?.partyName?._id}
      /> : null}
    </>
  );
};

export default AssignTaskPage;
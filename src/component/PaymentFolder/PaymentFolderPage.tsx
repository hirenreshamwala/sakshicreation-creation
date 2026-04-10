"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Box,
  TableCell,
  IconButton,
  Typography,
  Button,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, Payment as PaymentIcon, Visibility as VisibilityIcon, Download as DownloadIcon, Assignment as AssignmentIcon, Person } from '@mui/icons-material';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import CustomTable2 from "@/component/common_component/Table/CustomTable2";
import PaymentFolderDialog from './PaymentFolderDialog';
import PaymentAddDialog from './PaymentAddDialog';
import PaymentHistoryDialog from "./PaymentHistoryDialog";
import AssignTaskToFolderDialog from "./AssignTaskToFolderDialog";
import TabComponent from "@/component/Dialog/TabComponent";
import ThemeButton from "../common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import { getAllPaymentFoldersThunk, deletePaymentFolderThunk, deleteMultiplePaymentFoldersThunk } from "@/store/slices/paymentFolderSlice";
import { getCompanyWisePermission } from "@/utills/utills";
import { reportService } from "@/services/reportService";
import { paymentFolderService } from "@/services/paymentFolder.service";
import moment from 'moment';
import Loader from "../common_component/loader";

const PaymentFolderPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { paymentFolders, loading, totalCount } = useAppSelector((state) => state.paymentFolders || {});
  const { user } = useAppSelector((state) => state.auth);
  const { companies } = useAppSelector((state) => state.company);
  const [open, setOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [companyTab, setCompanyTab] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [areaTab, setAreaTab] = useState(0);
  const [rowData, setRowData] = useState<any>(null)
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [modalType, setModalType] = useState<'Add' | 'Edit'>('Add');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedPaymentData, setSelectedPaymentData] = useState<any>(null);
  
  // Separate export states for each button
  const [exportingRegular, setExportingRegular] = useState(false);
  const [exportingDifference, setExportingDifference] = useState(false);
  
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [assignTaskFolder, setAssignTaskFolder] = useState<any>(null);

  const canViewGlobal = user?.role?.permissions?.payment_folders?.view_global;
  const canViewOwn = user?.role?.permissions?.payment_folders?.view_own;
  const cancreate = user?.role?.permissions?.payment_folders?.create;
  const canedit = user?.role?.permissions?.payment_folders?.edit;
  const candelete = user?.role?.permissions?.payment_folders?.delete;

  // Filter states - similar to ComplainPage
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filter options states
  const [filterOptionsData, setFilterOptionsData] = useState<{ [key: string]: string[] }>({});
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);

  const hasSakshi = !!getCompanyWisePermission(5);
  const hasQP = !!getCompanyWisePermission(6);
  const hasBothCompanies = hasSakshi && hasQP;

  const companyTabs = useMemo(() => {
    const tabs = [];
    if (hasSakshi) tabs.push({ id: 'sakshi', name: 'Sakshi Creation', companyId: getCompanyWisePermission(5) });
    if (hasQP) tabs.push({ id: 'qp', name: 'Quality Packaging', companyId: getCompanyWisePermission(6) });
    return tabs;
  }, [hasSakshi, hasQP]);

  const selectedCompanyName = useMemo(() => {
    if (hasBothCompanies) {
      return companyTabs[companyTab]?.name || '';
    }
    return hasSakshi ? 'Sakshi Creation' : 'Quality Packaging';
  }, [hasBothCompanies, companyTabs, companyTab, hasSakshi]);

  const areaTabs = useMemo(() => ['All', "K-1", "K-2", "K-3", "K-4"], []);

  const defaultOrderFilter = {
    page: 1,
    pageSize: 10,
    search: "",
    includeCounts: true,
    isPagination: true,
    startDate: null,
    endDate: null,
  }

  const [currentFilterState, setCurrentFilterState] = useState<any>(() => {
    const initialState = {
      ...defaultOrderFilter,
      filters: {
        company: selectedCompanyName ? [selectedCompanyName] : [],
        area: [],
      },
    };
    return initialState;
  });

  const [appliedFilterState, setAppliedFilterState] = useState<any>({});

  useEffect(() => {
    if (selectedCompanyName) {
      setCurrentFilterState((prev: any) => ({
        ...prev,
        filters: {
          ...prev.filters,
          company: [selectedCompanyName]
        },
        page: 1
      }));
    }
  }, [selectedCompanyName]);

  useEffect(() => {
    const selectedArea = areaTab === 0 ? [] : [areaTabs[areaTab]];
    setCurrentFilterState((prev: any) => ({
      ...prev,
      filters: {
        ...prev.filters,
        area: selectedArea
      },
      page: 1
    }));
  }, [areaTab]);

  useEffect(() => {
    setAreaTab(0);
  }, [selectedCompanyName]);

  const getFirstContact = useCallback((party: any) => {
    return party?.contactForPayment || party?.contactMobileNo || party?.contactWhatsAppNo || party?.ownerMobileNo || party?.ownerWhatsAppNo || party?.mobileNumber || 'N/A';
  }, []);

  const loadPaymentFolders = useCallback(async () => {
    if (!selectedCompanyName) {
      console.error("Cannot load payment folders: Company Name is undefined");
      return;
    }
    setIsLoadingData(true);

    try {
      const params = {
        ...currentFilterState,
        filters: {
          ...currentFilterState.filters,
          ...(currentFilterState.filters.company ? {} : { company: [selectedCompanyName] }),
        },
        isPagination: true,
        includeCounts: true
      };
      await dispatch(getAllPaymentFoldersThunk(params));
      setIsInitialLoad(true);
    } catch (err: any) {
      console.error("❌ Error loading payment folders:", err);
      toast.error(err.message || "Failed to load payment folders");
    } finally {
      setIsLoadingData(false);
    }
  }, [dispatch, currentFilterState, selectedCompanyName]);

  const loadFilterOptions = async (field: string) => {
    if (!selectedCompanyName) {
      console.error("Cannot load filter options: Company Name is undefined");
      return;
    }
    setLoadingFilterOptions(true);
    try {
      const filterPayload = {
        ...currentFilterState.filters,
        startDate: currentFilterState.startDate,
        endDate: currentFilterState.endDate,
        company: [selectedCompanyName],
      };
      const response = await paymentFolderService.searchFilterOptions(field, "", filterPayload);
      if (response.success && response.data) {
        setFilterOptionsData(prev => ({
          ...prev,
          [field]: response.data || []
        }));
      }
    } catch (error: any) {
      console.error(`Error loading payment folder filter options for ${field}:`, error);
      toast.error(`Failed to load filter options for ${field}`);
    } finally {
      setLoadingFilterOptions(false);
    }
  };

  const handleFilterFieldSelect = useCallback(async (field: string | null) => {
    setSelectedFilterField(field);
    if (field && !filterOptionsData[field]) {
      await loadFilterOptions(field);
    }
  }, [filterOptionsData, loadFilterOptions, companyTab]);

  useEffect(() => {
    if (companyTab) {
      setFilterOptionsData({});
    }
  }, [companyTab]);

  const handleFiltersChange = useCallback((newFilters: { [key: string]: string[] }) => {
    setCurrentFilterState((prev: any) => ({
      ...prev,
      filters: newFilters,
      page: 1,
    }));
  }, []);

  useEffect(() => {
    if (!selectedCompanyName) return;
    const isSame = JSON.stringify(appliedFilterState) === JSON.stringify(currentFilterState);
    if (!isSame) {
      const timer = setTimeout(() => {
        loadPaymentFolders();
        setAppliedFilterState(currentFilterState);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentFilterState, appliedFilterState, loadPaymentFolders, selectedCompanyName]);

  useEffect(() => {
    if (user && !isInitialLoad && selectedCompanyName) {
      loadPaymentFolders();
    }
  }, [selectedCompanyName]);

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk());
  }, [dispatch, companies.length]);

  const handleMultipleDelete = async () => {
    try {
      await dispatch(deleteMultiplePaymentFoldersThunk(selectedRows)).unwrap();

      Swal.fire({
        title: "Deleted!",
        text: `${selectedRows.length} payment folder(s) deleted successfully`,
        icon: "success",
        confirmButtonColor: "#7F56D9",
      });

      setSelectedRows([]);
      setDeleteDialogOpen(false);
      loadPaymentFolders();
    } catch (err: any) {
      Swal.fire({
        title: "Error!",
        text: err.message || "Failed to delete payment folders",
        icon: "error",
        confirmButtonColor: "#7F56D9",
      });
    }
  };

  const handleEdit = (row: any) => {
    const data = paymentFolders.find((item: any) => item._id === row.id)
    setRowData(data)
    setModalType('Edit')
    setOpen(true);
  };

  const handleAddPayment = (row: any) => {
    const folderData = paymentFolders.find((item: any) => item._id === row.id);
    setSelectedFolder(folderData);
    setPaymentDialogOpen(true);
  };

  const handleViewPaymentHistory = (row: any) => {
    const folderData = paymentFolders.find((item: any) => item._id === row.id);
    setSelectedPaymentData(folderData);
    setShowPaymentHistory(true);
  };

  const handleAssignTask = (row: any) => {
    const folderData = paymentFolders.find((item: any) => item._id === row.id);
    setAssignTaskFolder(folderData);
    setAssignTaskOpen(true);
  };

  const handleClosePaymentHistory = () => {
    setShowPaymentHistory(false);
    setSelectedPaymentData(null);
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
        await dispatch(deletePaymentFolderThunk(id)).unwrap();
        Swal.fire({
          title: "Deleted!",
          text: "Payment folder deleted successfully",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
        loadPaymentFolders();
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Failed to delete payment folder",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      }
    }
  };

  const formattedRows = useMemo(() => {
    if (!paymentFolders || !Array.isArray(paymentFolders)) return [];
    return paymentFolders.map((folder: any, index: number) => ({
      _id: folder?._id || `temp-${index}`,
      id: folder?._id || `temp-${index}`,
      company: folder.company,
      partyObj: folder.party,
      party: folder.party?.partyName || 'N/A',
      mobileNumber: getFirstContact(folder.party),
      area: folder.area || 'N/A',
      paymentTerms: folder.paymentTerms || 'N/A',
      month: folder.month || 'N/A',
      paymentAmount: folder.paymentAmount || 0,
      receivedAmount: folder.receivedAmount || 0,
      differenceAmount: folder.differenceAmount || 0,
      pendingAmount: folder.pendingAmount || 0,
      assignTo: folder.assignedTo ? `${folder.assignedTo.firstName} ${folder.assignedTo.lastName}` : 'Unassigned',
      assignedDate: folder.assignedDate || '',
      taskStatus: folder.assignTask?.status || 'N/A',
      isRescheduledTask: folder.assignTask?.isRescheduledTask || false,
      status: folder.assignTask?.status || 'N/A',
      taskDate: folder.assignTask?.date || null,
      rescheduleDate: folder.assignTask?.rescheduleDate || null,
      remarks: folder.remarks || '',
      payments: folder.payments || [],
      createdAt: folder.createdAt || new Date().toISOString(),
    }));
  }, [paymentFolders, getFirstContact]);

  const handleExportToExcel = async (type: string) => {
    // Set the appropriate loader based on export type
    if (type === 'difference') {
      setExportingDifference(true);
    } else {
      setExportingRegular(true);
    }
    
    try {
      // Prepare filters from current state
      const filters: any = {};

      // Add all active filters from currentFilterState
      if (currentFilterState.filters) {
        Object.entries(currentFilterState.filters).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            filters[key] = value;
          }
        });
      }

      // Always include company filter
      if (!filters.company) {
        filters.company = [selectedCompanyName];
      }

      // Add area filter from tab if selected
      if (areaTab > 0) {
        filters.area = [areaTabs[areaTab]];
      }

      const payload: any = {
        filters: filters,
        search: currentFilterState.search || "",
        startDate: currentFilterState.startDate || undefined,
        endDate: currentFilterState.endDate || undefined,
        companyNames: [selectedCompanyName],
        pageSize: totalCount || 10000,
        isPagination: false,
        includeCounts: false,
        sortBy: currentFilterState.sortBy || 'createdAt',
        sortOrder: currentFilterState.sortOrder || 'desc',
        isDifference: type === 'difference',
      };

      const blob =type === "difference" ? await reportService.exportPaymentFolderDifffernceToExcel(payload) : await reportService.exportPaymentFolderToExcel(payload);

      // Create descriptive filename
      const parts = [
        'PaymentFolders',
        selectedCompanyName.replace(/ /g, '_'),
      ];

      // Add export type to filename
      if (type === 'difference') {
        parts.push('With_Difference');
      }

      // Add date range
      if (payload.startDate)
        parts.push(
          moment(payload.startDate).format('DDMMYYYY'),
          'to',
          moment(payload.endDate).format('DDMMYYYY')
        );
      else parts.push('All_Time');


      // Add active filters to filename
      if (filters.area && filters.area.length > 0) parts.push(`Area_${filters.area.join('-')}`);
      if (filters.party && filters.party.length > 0) parts.push(`Party_${filters.party.length}`);
      if (filters.assignTo && filters.assignTo.length > 0) parts.push(`AssignTo_${filters.assignTo.length}`);
      if (filters.month && filters.month.length > 0) parts.push(`Month_${filters.month.join('-')}`);
      if (filters.paymentTerms && filters.paymentTerms.length > 0) parts.push(`Terms_${filters.paymentTerms.length}`);

      const fileName = `${parts.join('_')}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${totalCount || formattedRows.length} records successfully`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export Excel');
    } finally {
      // Reset the appropriate loader based on export type
      if (type === 'difference') {
        setExportingDifference(false);
      } else {
        setExportingRegular(false);
      }
    }
  };

  const renderRow = useCallback((row: any, index: number) => (
    <>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{ width: 32, height: 32 }}
            src={row.company?.avatar}
            alt={row.company?.companyName}
          />
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.party}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row?.partyObj?.address?.unitNo}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row?.partyObj?.address?.marketName?.marketName}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        {getFirstContact(row.partyObj)}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.area}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.month}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.paymentTerms}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>₹{row.paymentAmount}</TableCell>
      <TableCell sx={{ fontSize: 14, color: "success.main" }}>₹{row.receivedAmount}</TableCell>
      <TableCell sx={{ fontSize: 14, color: "error.main" }}>₹{row.differenceAmount}</TableCell>
      <TableCell sx={{ fontSize: 14, color: row.pendingAmount > 0 ? "error.main" : "success.main" }}>
        ₹{row.pendingAmount}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        <Typography variant="body2">{row.assignTo}</Typography>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        <Box>
          {row.taskStatus !== 'N/A' && (
            <Chip
              label={row.taskStatus === 'Pending' && row.isRescheduledTask ? 'Rescheduled' : row.taskStatus}
              size="small"
              color={row.taskStatus === 'Completed' ? 'success' : (row.taskStatus === 'Rescheduled' || row.isRescheduledTask) ? 'warning' : 'default'}
              sx={{ height: 20, fontSize: '10px', mt: 0.5 }}
            />
          )}
          {row.isRescheduledTask && row.status !== "Completed" && (
            <Typography variant="caption" display="block" color="warning.main">
              New Date: {row.taskDate ? moment(row.taskDate).format('DD-MM-YYYY') : 'N/A'}
            </Typography>
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.assignedDate ? moment(row.assignedDate).format('DD-MM-YYYY') : 'N/A'}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        <Tooltip title={row.payments?.length > 0 ? row.payments[0].note : row.remarks}>
          <Typography noWrap>
            {row.payments?.length > 0 ? row.payments[0].note?.substring(0, 20) : row.remarks?.substring(0, 20)}...
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {row.payments?.length > 0 && (
            <IconButton
              color="info"
              onClick={() => handleViewPaymentHistory(row)}
              title="View Payment History"
            >
              <VisibilityIcon />
            </IconButton>
          )}

          {row.pendingAmount > 0 && (
            <IconButton
              color="success"
              onClick={() => handleAddPayment(row)}
              title="Add Payment"
            >
              <PaymentIcon />
            </IconButton>
          )}

          <IconButton
            color="primary"
            onClick={() => handleAssignTask(row)}
            title="Assign Task"
          >
            <Person />
          </IconButton>

          {canedit && row.pendingAmount > 0 && (
            <IconButton color="primary" onClick={() => handleEdit(row)} title="Edit">
              <EditIcon />
            </IconButton>
          )}
          {candelete && (
            <IconButton color="error" onClick={() => handleDelete(row.id)} title="Delete">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      </TableCell>
    </>
  ), [canedit, candelete, handleViewPaymentHistory, handleAddPayment, handleEdit, handleDelete, paymentFolders, getFirstContact]);

  const columns = useMemo(() => [
    { id: 'company', label: 'Company' },
    { id: 'party', label: 'Party', value: 'party' },
     { id: 'unitNo', label: 'unitno', value: 'unitNo' },
      { id: 'marketname', label: 'marketname', value: 'marketname' },
    { id: 'mobileNumber', label: 'Mobile Number' },
    { id: 'area', label: 'Area', value: 'area' },
    { id: 'month', label: 'Month', value: 'month' },
    { id: 'paymentTerms', label: 'Payment Terms' /* , value: 'paymentTerms' */ },
    { id: 'paymentAmount', label: 'Payment Amount', value: 'paymentAmount' },
    { id: 'receivedAmount', label: 'Received Amount', value: 'receivedAmount' },
    { id: 'differenceAmount', label: 'Difference Amount', value: 'differenceAmount' },
    { id: 'pendingAmount', label: 'Pending Amount', value: 'pendingAmount' },
    { id: 'assignTo', label: 'Assigned To', value: 'assignTo' },
    { id: 'taskStatus', label: 'Task Status', value: 'taskStatus' },
    { id: 'assignedDate', label: 'Assigned Date', value: 'assignedDate' },
    { id: 'remarks', label: 'Remarks', value: 'remarks' },
    { id: 'action', label: 'Action' },
  ], []);

  const getRowColor = useCallback((row: any) => {
    if (row.pendingAmount === 0 && row.status === 'Completed') return "#e6fffa"; // Completed & Settled
    if (row.pendingAmount > 0 && row.status === 'Pending') return "#fff5f5"; // Active & Pending
    return "";
  }, []);

  const handleSelectRow = (id: string) =>
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) setSelectedRows(formattedRows.map((row: any) => row._id));
    else setSelectedRows([]);
  };

  if ((loading || isLoadingData) && !isInitialLoad && (!paymentFolders || paymentFolders.length === 0)) {
    return <Loader />;
  }

  if (!selectedCompanyName) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px'
      }}>
        <Typography color="error">
          Company information is not available. Please try again.
        </Typography>
      </div>
    );
  }

  return (
    <>
      {selectedRows.length > 0 && candelete && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Selected ({selectedRows.length})
          </Button>
        </Box>
      )}

      {hasBothCompanies && (
        <Box sx={{ mb: 2 }}>
          <TabComponent
            activeTab={companyTab}
            setActiveTab={setCompanyTab}
            tabList={companyTabs.map(t => t.name)}
          />
        </Box>
      )}
      {!hasBothCompanies && selectedCompanyName && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          <Typography variant="h6">
            Showing payment folders for: {selectedCompanyName}
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <TabComponent
          activeTab={areaTab}
          setActiveTab={setAreaTab}
          tabList={areaTabs}
          align="left"
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          {cancreate && (
            <Box sx={{ mb: 2 }}>
              <ThemeButton
                onClick={() => {
                  setModalType('Add')
                  setRowData(null)
                  setOpen(true);
                }}
              >
                + Add New Payment Folder
              </ThemeButton>
            </Box>
          )}
        </Box>

        <div>
          {/* Regular Export Button */}
          <IconButton
            onClick={() => handleExportToExcel("no")}
            disabled={loading || exportingRegular || exportingDifference}
            sx={{
              border: "1px solid #D0D5DD",
              borderRadius: 2,
              p: 1.5,
              color: "#667085",
              bgcolor: exportingRegular ? '#f0f0f0' : 'transparent',
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderColor: '#b0b0b0',
              },
              '&.Mui-disabled': {
                borderColor: '#e0e0e0',
                color: '#aaa',
              },
            }}
          >
            {exportingRegular ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <DownloadIcon />
            )}
          </IconButton>

          {/* Difference Export Button */}
          <IconButton
            onClick={() => handleExportToExcel("difference")}
            disabled={loading || exportingRegular || exportingDifference}
            sx={{
              border: "1px solid #D0D5DD",
              borderRadius: 2,
              p: 1.5,
              ml: 1,
              color: "#667085",
              bgcolor: exportingDifference ? '#f0f0f0' : 'transparent',
              '&:hover': {
                bgcolor: '#f5f5f5',
                borderColor: '#b0b0b0',
              },
              '&.Mui-disabled': {
                borderColor: '#e0e0e0',
                color: '#aaa',
              },
            }}
          >
            {exportingDifference ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Typography variant="body2">Download difference</Typography>
            )}
          </IconButton>
        </div>
      </Box>

      <CustomTable2
        showDatePicker={true}
        tableHeader={columns}
        showFillter={true}
        showSearch={true}
        title={`Payment Folders - ${selectedCompanyName}`}
        showExcelDownload={false}
        defaultFilter={defaultOrderFilter}
        rowData={formattedRows}
        setCurrentFilterState={setCurrentFilterState}
        currentFilterState={currentFilterState}
        renderRow={renderRow}
        totalRows={totalCount || formattedRows.length}
        onFilterFieldSelect={handleFilterFieldSelect}
        selectedFilterField={selectedFilterField}
        filterOptionsData={filterOptionsData}
        loadingFilterOptions={loadingFilterOptions}
        onFiltersChange={handleFiltersChange}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        selectedRows={selectedRows}
        getRowColor={getRowColor}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedRows.length} selected payment folder(s)?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMultipleDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete {selectedRows.length} Items
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Folder Dialog for Add/Edit */}
      {open && (
        <PaymentFolderDialog
          open={open}
          onClose={() => {
            setOpen(false);
            loadPaymentFolders();
          }}
          rowData={rowData as any}
          modalType={modalType}
        />
      )}
      {/* Payment Add Dialog for adding payments */}
      {paymentDialogOpen && (
        <PaymentAddDialog
          open={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false);
            loadPaymentFolders();
          }}
          folderData={selectedFolder}
        />
      )}
      {/* Payment History Dialog */}
      {showPaymentHistory && (
        <PaymentHistoryDialog
          open={showPaymentHistory}
          onClose={handleClosePaymentHistory}
          paymentData={selectedPaymentData}
        />
      )}
      {/* Assign Task Dialog */}
      {assignTaskOpen && (
        <AssignTaskToFolderDialog
          open={assignTaskOpen}
          onClose={() => {
            setAssignTaskOpen(false);
            setAssignTaskFolder(null);
            loadPaymentFolders(); // Refresh data after assignment
          }}
          folderData={assignTaskFolder}
        />
      )}
    </>
  );
};

export default PaymentFolderPage;
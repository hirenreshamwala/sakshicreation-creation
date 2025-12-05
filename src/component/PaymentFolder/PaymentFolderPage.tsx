"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TableCell,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllPaymentFoldersThunk,
  deletePaymentFolderThunk,
  deleteMultiplePaymentFoldersThunk,
} from "@/store/slices/paymentFolderSlice";
import CustomTable2 from "@/component/common_component/Table/CustomTable2";
import PaymentFolderDialog from "./PaymentFolderDialog";
import PaymentAddDialog from "./PaymentAddDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PaymentIcon from "@mui/icons-material/Payment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";
import { getCompanyWisePermission } from "@/utills/utills";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import TabComponent from "@/component/Dialog/TabComponent";
import ThemeButton from "../common_component/themebutton";
import moment from "moment";
import PaymentHistoryDialog from "./PaymentHistoryDialog";
import { paymentFolderService } from "@/services/paymentFolder.service";
import { toast } from 'react-toastify'; // Add if using toast

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
  const [modalType, setModalType] = useState('Add')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedPaymentData, setSelectedPaymentData] = useState<any>(null);
  
  const canViewGlobal = user?.role?.permissions?.payment_folders?.view_global;
  const canViewOwn = user?.role?.permissions?.payment_folders?.view_own;
  const cancreate = user?.role?.permissions?.payment_folders?.create;
  const canedit = user?.role?.permissions?.payment_folders?.edit;
  const candelete = user?.role?.permissions?.payment_folders?.delete;

  // Filter states - similar to ComplainPage
  const [currentFilterState, setCurrentFilterState] = useState<any>({
    page: 1,
    pageSize: 10,
    search: "",
    filters: {},
    includeCounts: true,
    isPagination: true,
    startDate: null,
    endDate: null,
  });
  const [appliedFilterState, setAppliedFilterState] = useState<any>({});
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

  const selectedCompanyId = hasBothCompanies
    ? companyTabs[companyTab]?.companyId
    : hasSakshi
      ? getCompanyWisePermission(5)
      : getCompanyWisePermission(6);

  const selectedCompanyName = useMemo(() => {
    if (hasBothCompanies) {
      return companyTabs[companyTab]?.name || '';
    }
    return hasSakshi ? 'Sakshi Creation' : 'Quality Packaging';
  }, [hasBothCompanies, companyTabs, companyTab, hasSakshi]);

  const areaTabs = useMemo(() => ['All', "K-1", "K-2", "K-3", "K-4"], []);

  // Add company filter to currentFilterState (using name)
  useEffect(() => {
    if (selectedCompanyName) {
      setCurrentFilterState(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          company: [selectedCompanyName]
        },
        page: 1
      }));
    }
  }, [selectedCompanyName]);

  // Area tab filter (server-side)
  useEffect(() => {
    const selectedArea = areaTab === 0 ? [] : [areaTabs[areaTab]];
    setCurrentFilterState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        area: selectedArea
      },
      page: 1
    }));
  }, [areaTab, areaTabs]);

  useEffect(() => {
    setAreaTab(0);
  }, [selectedCompanyId]);

  // Helper to get first mobile/contact
  const getFirstContact = useCallback((party: any) => {
    return party?.contactForPayment || party?.contactMobileNo || party?.contactWhatsAppNo || party?.ownerMobileNo || party?.ownerWhatsAppNo || party?.mobileNumber || 'N/A';
  }, []);

  // Load payment folders with filters (similar to loadComplains)
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
          // Ensure company filter
          ...(currentFilterState.filters.company ? {} : { company: [selectedCompanyName] }),
        },
        isPagination: true,
        includeCounts: true
      };
      console.log("📡 Loading payment folders with params:", params);
      await dispatch(getAllPaymentFoldersThunk(params));
      setIsInitialLoad(true);
    } catch (err: any) {
      console.error("❌ Error loading payment folders:", err);
      toast.error(err.message || "Failed to load payment folders");
    } finally {
      setIsLoadingData(false);
    }
  }, [dispatch, currentFilterState, selectedCompanyName]);

  // Load filter options (similar to loadFilterOptions in ComplainPage)
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
      console.log(`🔍 Loading payment folder filter options for ${field}:`, filterPayload);
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

  // Handle filter field selection
  const handleFilterFieldSelect = useCallback(async (field: string | null) => {
    console.log("PaymentFolder handleFilterFieldSelect called with:", field);
    setSelectedFilterField(field);
    if (field && !filterOptionsData[field]) {
      try {
        await loadFilterOptions(field);
      } catch (error) {
        console.error("Error loading payment folder filter options:", error);
        toast.error(`Failed to load options for ${field}`);
      }
    }
    return Promise.resolve();
  }, [filterOptionsData, currentFilterState, loadFilterOptions]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: { [key: string]: string[] }) => {
    console.log("PaymentFolder Filters changed to:", newFilters);
    setCurrentFilterState((prev: any) => ({
      ...prev,
      filters: newFilters,
      page: 1,
    }));
  }, []);

  // Effect to load payment folders when filters change
  useEffect(() => {
    if (!selectedCompanyName) return;
    const isSame = JSON.stringify(appliedFilterState) === JSON.stringify(currentFilterState);
    if (!isSame) {
      console.log("🔄 PaymentFolder Filter state changed, loading payment folders...");
      const timer = setTimeout(() => {
        loadPaymentFolders();
        setAppliedFilterState(currentFilterState);
      }, 300); // Add small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [currentFilterState, appliedFilterState, loadPaymentFolders, selectedCompanyName]);

  // Effect for initial load
  useEffect(() => {
    if (user && !isInitialLoad && selectedCompanyName) {
      console.log("🚀 Initial load started for payment folders");
      loadPaymentFolders();
    }
  }, [user, isInitialLoad, loadPaymentFolders, selectedCompanyName]);

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true as any));
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
      loadPaymentFolders(); // Reload after delete
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
        loadPaymentFolders(); // Reload after delete
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
    return paymentFolders.map((folder, index) => ({
      _id: folder?._id || `temp-${index}`,
      id: folder?._id || `temp-${index}`,
      company: folder.company,
      partyObj: folder.party, // Keep full object
      party: folder.party?.partyName || 'N/A',
      mobileNumber: getFirstContact(folder.party),
      area: folder.area || 'N/A',
      month: folder.month || 'N/A',
      paymentAmount: folder.paymentAmount || 0,
      receivedAmount: folder.receivedAmount || 0,
      pendingAmount: folder.pendingAmount || 0,
      assignTo: folder.assignedTo ? `${folder.assignedTo.firstName} ${folder.assignedTo.lastName}` : 'Unassigned',
      assignedDate: folder.assignedDate || '',
      remarks: folder.remarks || '',
      payments: folder.payments || [],
      createdAt: folder.createdAt || new Date().toISOString(),
    }));
  }, [paymentFolders, getFirstContact]);

  // Render row function
  const renderRow = useCallback((row: any, index: number) => (
    <>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{ width: 32, height: 32 }}
            src={row.company?.avatar}
            alt={row.company?.companyName}
          />
          <Typography fontWeight={500} sx={{ fontSize: 14 }}>
            {row.company?.companyName}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.party}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        {getFirstContact(row.partyObj)}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.area}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.month}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>₹{row.paymentAmount}</TableCell>
      <TableCell sx={{ fontSize: 14, color: "success.main" }}>₹{row.receivedAmount}</TableCell>
      <TableCell sx={{ fontSize: 14, color: row.pendingAmount > 0 ? "error.main" : "success.main" }}>
        ₹{row.pendingAmount}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.assignTo}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{moment(row.assignedDate).format('DD-MM-YYYY')}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        <Typography title={row.remarks} noWrap>
          {row.remarks?.substring(0, 20) || 'N/A'}...
        </Typography>
      </TableCell>
      <TableCell sx={{ display: "flex", gap: 1 }}>
        {/* View Payment History Button - Always show if there are payments */}
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
      </TableCell>
    </>
  ), [canedit, candelete, handleViewPaymentHistory, handleAddPayment, handleEdit, handleDelete, paymentFolders, getFirstContact]);

  // Columns for CustomTable2
  const columns = useMemo(() => [
  { id: 'checkbox', label: '' },
  { id: 'company', label: 'Company', value: 'company' }, // value matches backend field
  { id: 'party', label: 'Party', value: 'party' },
  { id: 'mobileNumber', label: 'Mobile Number', value: null }, // Skip filter for derived field
  { id: 'area', label: 'Area', value: 'area' },
  { id: 'month', label: 'Month', value: 'month' },
  { id: 'paymentAmount', label: 'Payment Amount' /*value: 'paymentAmount'*/ },
  { id: 'receivedAmount', label: 'Received Amount'/* value: 'receivedAmount'*/ },
  { id: 'pendingAmount', label: 'Pending Amount'/* value: 'pendingAmount'*/ },
  { id: 'assignTo', label: 'Assigned To', value: 'assignTo' },
  { id: 'assignedDate', label: 'Assigned Date', value: 'assignedDate' },
  { id: 'remarks', label: 'Remarks', value: 'remarks' },
  { id: 'action', label: 'Action', value: null }, // Skip action
], [canedit, candelete]);

  // Excel headers and data
  const excelHeaders = useMemo(() => [
    "Company", "Party", "Mobile Number", "Area", "Month", "Payment Amount",
    "Received Amount", "Pending Amount", "Assigned To", "Assigned Date", "Remarks"
  ], []);
  const excelData = useMemo(() => {
    return formattedRows.map((row) => ({
      "Company": row.company?.companyName || 'N/A',
      "Party": row.party,
      "Mobile Number": row.mobileNumber,
      "Area": row.area,
      "Month": row.month,
      "Payment Amount": row.paymentAmount,
      "Received Amount": row.receivedAmount,
      "Pending Amount": row.pendingAmount,
      "Assigned To": row.assignTo,
      "Assigned Date": moment(row.assignedDate).format('DD-MM-YYYY'),
      "Remarks": row.remarks,
    }));
  }, [formattedRows]);

  const getRowColor = useCallback((row: any) => {
    if (row.pendingAmount === 0) return "#e6fffa";
    return "";
  }, []);

  const handleSelectRow = (id: string) =>
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) setSelectedRows(formattedRows.map((row: any) => row._id));
    else setSelectedRows([]);
  };

  // Show loading while initial data is being loaded
  if ((loading || isLoadingData) && !isInitialLoad && paymentFolders.length === 0) {
    return <div>Loading Payment Folders...</div>;
  }

  // Show error if company is not available
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
      <CustomTable2
        showDatePicker={true}
          tableHeader={columns}
          showFillter={true}
          showSearch={true}
          title={`Payment Folders - ${selectedCompanyName}`}
          showExcelDownload={false}
          excelHeaders={excelHeaders}
          excelData={excelData}
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
            loadPaymentFolders(); // Reload after add/edit
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
            loadPaymentFolders(); // Reload after add payment
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
    </>
  );
};

export default PaymentFolderPage;
"use client";

import { useState, useEffect, useMemo, memo } from "react";
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
import BasicTable from "@/component/common_component/Table/themetable";
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

interface RowData {
  id: string;
  company: { name: string; avatar?: string };
  party: string;
  area: string;
  month: string;
  paymentAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  paymentType: string;
  assignTo: string;
  assignedDate: string;
  remarks: string;
}

const PaymentFolderPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { paymentFolders } = useAppSelector((state) => state.paymentFolders || {});
  const { user } = useAppSelector((state) => state.auth);
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
  const { companies } = useAppSelector((state) => state.company);
  const canViewGlobal = user?.role?.permissions?.payment_folders?.view_global;
  const canViewOwn = user?.role?.permissions?.payment_folders?.view_own;
  const cancreate = user?.role?.permissions?.payment_folders?.create;
  const canedit = user?.role?.permissions?.payment_folders?.edit;
  const candelete = user?.role?.permissions?.payment_folders?.delete;

  const columns = useMemo(() => {
    const baseColumns = [
      { id: "checkbox", label: "" },
      { id: "company", label: "Company" },
      { id: "party", label: "Party" },
      { id: "mobileNumber", label: "Mobile Number" },
      { id: "area", label: "Area" },
      { id: "month", label: "Month" },
      { id: "paymentAmount", label: "Payment Amount" },
      { id: "receivedAmount", label: "Received Amount" },
      { id: "pendingAmount", label: "Pending Amount" },
      // { id: "paymentType", label: "Payment Type" },
      { id: "assignTo", label: "Assigned To" },
      { id: "assignedDate", label: "Assigned Date" },
      { id: "remarks", label: "Remarks" },
    ];

    if (canedit || candelete) {
      baseColumns.push({ id: "action", label: "Action" });
    }

    return baseColumns;
  }, [canedit, candelete]);

  const hasSakshi = !!getCompanyWisePermission(5);
  const hasQP = !!getCompanyWisePermission(6);
  const hasBothCompanies = hasSakshi && hasQP;

  const companyTabs = useMemo(() => {
    const tabs = [];
    if (hasSakshi) tabs.push({ id: 'sakshi', name: 'Sakshi Creation', companyId: getCompanyWisePermission(5) });
    if (hasQP) tabs.push({ id: 'qp', name: 'Quality Packaging', companyId: getCompanyWisePermission(6) });
    return tabs;
  }, [user, hasSakshi, hasQP]);

  const selectedCompanyId = hasBothCompanies
    ? companyTabs[companyTab]?.companyId
    : hasSakshi
      ? getCompanyWisePermission(5)
      : getCompanyWisePermission(6);

  const companyFilteredFolders = useMemo(() => {
    if (!selectedCompanyId) return paymentFolders;
    return paymentFolders.filter((folder: any) => folder.company?._id === selectedCompanyId || folder.company === selectedCompanyId);
  }, [paymentFolders, selectedCompanyId]);

  const areaTabs = useMemo(() => {
    return ['All', "K-1", "K-2", "K-3", "K-4"];
  }, [companyFilteredFolders]);

  useEffect(() => {
    setAreaTab(0);
  }, [selectedCompanyId]);

  const finalFilteredFolders = useMemo(() => {
    if (areaTab === 0) return companyFilteredFolders;
    const selectedArea = areaTabs[areaTab];
    return companyFilteredFolders.filter((folder: any) => folder.area === selectedArea);
  }, [companyFilteredFolders, areaTab, areaTabs]);

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true as any));
  }, []);

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

  useEffect(() => {
    if (!paymentFolders.length) dispatch(getAllPaymentFoldersThunk());
  }, []);

  const mapFoldersToRows = () =>
    finalFilteredFolders?.map((folder: any) => ({
      ...folder,
      id: folder._id,
      party: folder.party?.partyName || "Unknown",
      mobileNumber: folder.party?.mobileNumber || "N/A",
      assignTo: folder.assignedTo
        ? `${folder.assignedTo.firstName} ${folder.assignedTo.lastName}`
        : "Unassigned",
      assignedDate: folder.assignedDate,
    }))
      .sort((a: any, b: any) => a.party.localeCompare(b.party));

  const getRowColor = (row: any) => {
    if (row.pendingAmount === 0) return "#e6fffa";
    return "";
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const renderRow = (row: any) => (
    <>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{ width: 32, height: 32 }}
            src={row.company.avatar}
            alt={row.company.companyName}
          />
          <Typography fontWeight={500} sx={{ fontSize: 14 }}>
            {row.company.companyName}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.party}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row?.party?.contactForPayment || row?.party?.contactMobileNo || row?.party?.contactWhatsAppNo || row?.party?.ownerMobileNo || row?.party?.ownerWhatsAppNo}</TableCell>
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
          {truncateText(row.remarks, 20)}
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
  );

  const handleSelectRow = (id: string) =>
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) setSelectedRows(finalFilteredFolders.map((row: any) => row._id));
    else setSelectedRows([]);
  };

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

      {!hasBothCompanies && selectedCompanyId && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          <Typography variant="h6">
            Showing payment folders for: {hasSakshi ? 'Sakshi' : 'QP'}
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <TabComponent
          activeTab={areaTab}
          setActiveTab={setAreaTab}
          tabList={areaTabs as string[]}
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
        {finalFilteredFolders.length === 0 ? (
          <Typography>
            No payment folders found for {hasBothCompanies ? companyTabs[companyTab]?.name : (hasSakshi ? 'Sakshi' : 'QP')}.
          </Typography>
        ) : (
          <BasicTable
            tableHeader={columns}
            rowData={mapFoldersToRows()}
            showDatePicker={true}
            showSearch={true}
            showFillter={true}
            showExcelDownload={true}
            renderRow={renderRow}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            selectedRows={selectedRows}
            title="Payment Folder"
            getRowColor={getRowColor}
          />
        )}
      </Box>

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
      {open ? <PaymentFolderDialog
        open={open}
        onClose={() => setOpen(false)}
        rowData={rowData as any}
        modalType={modalType}
      /> : null}

      {/* Payment Add Dialog for adding payments */}
      {paymentDialogOpen ? <PaymentAddDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        folderData={selectedFolder}
      /> : null}

      {/* Payment History Dialog */}
      {showPaymentHistory ? <PaymentHistoryDialog
        open={showPaymentHistory}
        onClose={handleClosePaymentHistory}
        paymentData={selectedPaymentData}
      /> : null}
    </>
  );
};

export default PaymentFolderPage;
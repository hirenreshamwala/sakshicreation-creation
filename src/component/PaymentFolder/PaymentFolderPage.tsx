"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  TableCell,
  Avatar,
  IconButton,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllPaymentFoldersThunk,
  deletePaymentFolderThunk,
} from "@/store/slices/paymentFolderSlice";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeChip from "@/component/common_component/themechip";
import PaymentFolderDialog from "./PaymentFolderDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Swal from "sweetalert2";
import { getCompanyWisePermission } from "@/utills/utills";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import { StaticCompanyOptions } from "@/constants";
import TabComponent from "@/component/Dialog/TabComponent";
import ThemeButton from "../common_component/themebutton";

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
  const [companyTab, setCompanyTab] = useState(0);
  const [rowData, setRowData] = useState<any>(null)
  const [modalType, setModalType] = useState('Add')
  const { companies } = useAppSelector((state) => state.company);
  const canViewGlobal = user?.role?.permissions?.payment_folders?.view_global;
  const canViewOwn = user?.role?.permissions?.payment_folders?.view_own;
  const cancreate = user?.role?.permissions?.payment_folders?.create;
  const canedit = user?.role?.permissions?.payment_folders?.edit;
  const candelete = user?.role?.permissions?.payment_folders?.delete;

  const columns = useMemo(() => {
    const baseColumns = [
      { id: "company", label: "Company" },
      { id: "party", label: "Party" },
      { id: "area", label: "Area" },
      { id: "month", label: "Month" },
      { id: "paymentAmount", label: "Payment Amount" },
      { id: "receivedAmount", label: "Received Amount" },
      { id: "pendingAmount", label: "Pending Amount" },
      { id: "paymentType", label: "Payment Type" },
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
    if (hasSakshi) tabs.push({ id: 'sakshi', name: 'Sakshi', companyId: getCompanyWisePermission(5) });
    if (hasQP) tabs.push({ id: 'qp', name: 'QP', companyId: getCompanyWisePermission(6) });
    return tabs;
  }, [user, hasSakshi, hasQP]);

  const selectedCompanyId = hasBothCompanies
    ? companyTabs[companyTab]?.companyId
    : hasSakshi
      ? getCompanyWisePermission(5)
      : getCompanyWisePermission(6);

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true));
  }, []);

  const handleEdit = (row: string) => {
    const data = paymentFolders.find((item) => item._id === row.id)
    setRowData(data)
    setModalType('Edit')
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

  console.log(paymentFolders, 'paymentFolders')

  const mapFoldersToRows = () =>
    paymentFolders?.map((folder) => ({
      ...folder,
      id: folder._id,
      company: {
        name: folder.company?.companyName || "Unknown",
        avatar: folder.company?.avatar || ""
      },
      party: folder.party?.partyName || "Unknown",
      area: folder.area.area || "N/A",
      areaId: folder.area._id,
      month: folder.month || "N/A",
      paymentAmount: folder.paymentAmount || 0,
      receivedAmount: folder.receivedAmount || 0,
      pendingAmount: folder.pendingAmount || 0,
      paymentType: folder.paymentType || "N/A",
      assignTo: folder.assignedTo
        ? `${folder.assignedTo.firstName} ${folder.assignedTo.lastName}`
        : "Unassigned",
      assignedDate: folder.assignedDate
        ? new Date(folder.assignedDate).toLocaleDateString("en-GB")
        : "N/A",
      remarks: folder.remarks || "N/A",
    }));

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "N/A";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const renderRow = (row: RowData) => (
    <>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{ width: 32, height: 32 }}
            src={row.company.avatar}
            alt={row.company.name}
          />
          <Typography fontWeight={500} sx={{ fontSize: 14 }}>
            {row.company.name}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.party}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.area}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.month}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>₹{row.paymentAmount}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>₹{row.receivedAmount}</TableCell>
      <TableCell sx={{ fontSize: 14, color: row.pendingAmount > 0 ? "error.main" : "success.main" }}>
        ₹{row.pendingAmount}
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        <ThemeChip label={row.paymentType} color="primary" size="small" />
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.assignTo}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>{row.assignedDate}</TableCell>
      <TableCell sx={{ fontSize: 14 }}>
        <Typography title={row.remarks} noWrap>
          {truncateText(row.remarks, 20)}
        </Typography>
      </TableCell>
      <TableCell sx={{ display: "flex" }}>
        {canedit && (
          <IconButton color="primary" onClick={() => handleEdit(row)}>
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

  return (
    <>
      {/* Company Tabs - Only show if user has both companies */}
      {hasBothCompanies && (
        <Box sx={{ mb: 2 }}>
          <TabComponent
            activeTab={companyTab}
            setActiveTab={setCompanyTab}
          />
        </Box>
      )}

      {/* Show current company name when user has only one permission */}
      {!hasBothCompanies && selectedCompanyId && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          <Typography variant="h6">
            Showing payment folders for: {hasSakshi ? 'Sakshi' : 'QP'}
          </Typography>
        </Box>
      )}
      {cancreate && (
        <ThemeButton
          onClick={() => {
            setModalType('Add')
            setOpen(true);
          }}
        >
          + Add New Payment Folder
        </ThemeButton>
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
        {paymentFolders.length === 0 ? (
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
            renderRow={renderRow}
          />
        )}
      </Box>

      <PaymentFolderDialog
        open={open}
        onClose={() => setOpen(false)}
        // folderId={editId}
        rowData={rowData}
        modalType={modalType}
      // refreshData={() => dispatch(getAllPaymentFoldersThunk())}
      // company={companies?.find((item) => item.companyName === StaticCompanyOptions[companyTab])}
      />
    </>
  );
};

export default PaymentFolderPage;
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  TableCell,
  Avatar,
  IconButton,
  InputBase,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllPaymentFoldersThunk,
  deletePaymentFolderThunk,
} from "@/store/slices/paymentFolderSlice";
import FilterDropdown from "@/component/fillter";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import PaymentFolderDialog from "./PaymentFolderDialog";
import { authService } from "@/services/auth.service";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DateRangePicker from "@/component/daterangepicker";
import Swal from "sweetalert2";
import { FiSearch } from "react-icons/fi";
import { getCompanyWisePermission } from "@/utills/utills";
import { useRouter } from "next/router";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import { StaticCompanyOptions } from "@/constants";
import TabComponent from "@/component/Dialog/TabComponent";

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
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    paymentFolders = [],
  } = useAppSelector((state) => state.paymentFolders || {});
  const { user } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [companyTab, setCompanyTab] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
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

  const handleEdit = (id: string) => {
    setEditId(id);
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
    const token = authService.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    dispatch(getAllPaymentFoldersThunk());

    return () => {
      // No clear needed
    };
  }, [dispatch, router.isReady]);

  // Filter by company
  const foldersFilteredByCompany = useMemo(() => {
    return paymentFolders.filter(folder =>
      folder.company?._id === selectedCompanyId
    );
  }, [paymentFolders, selectedCompanyId]);

  // Simple filters (no status/date tabs)
  const filteredFolders = useMemo(() => {
    let filtered = foldersFilteredByCompany;

    // Apply date range if needed (optional)
    if (startDate || endDate) {
      filtered = filtered.filter((folder) => {
        const folderDate = new Date(folder.assignedDate);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
        return (!start || folderDate >= start) && (!end || folderDate <= end);
      });
    }

    // Apply search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((folder) =>
        [
          folder.party?.partyName,
          folder.company?.companyName,
          folder.area,
          folder.month,
        ].some((value) =>
          value?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply multiple filters
    if (Object.keys(filters).length > 0) {
      // Implement similar to assignTask if needed
    }

    return filtered;
  }, [foldersFilteredByCompany, startDate, endDate, searchQuery, filters]);

  const mapFoldersToRows = (folders: any[]): RowData[] =>
    folders.map((folder) => ({
      id: folder._id,
      company: {
        name: folder.company?.companyName || "Unknown",
        avatar: folder.company?.avatar || ""
      },
      party: folder.party?.partyName || "Unknown",
      area: folder.area || "N/A",
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
            Showing payment folders for: {hasSakshi ? 'Sakshi' : 'QP'}
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
            uniqueValues={[]} // Implement if needed
            onFiltersChange={setFilters}
            filters={filters}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />
          {cancreate && (
            <ThemeButton
              onClick={() => {
                setEditId(null);
                setOpen(true);
              }}
            >
              + Add New Payment Folder
            </ThemeButton>
          )}
        </Box>
      </Box>

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
        {filteredFolders.length === 0 ? (
          <Typography>
            No payment folders found for {hasBothCompanies ? companyTabs[companyTab]?.name : (hasSakshi ? 'Sakshi' : 'QP')}.
          </Typography>
        ) : (
          <BasicTable
            tableHeader={columns}
            rowData={mapFoldersToRows(filteredFolders)}
            showDatePicker={false}
            showSearch={false}
            showFillter={false}
            renderRow={renderRow}
          />
        )}
      </Box>

      <PaymentFolderDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditId(null);
        }}
        folderId={editId}
        refreshData={() => dispatch(getAllPaymentFoldersThunk())}
        companyTab={companyTab}
        company={companies?.find((item) => item.companyName === StaticCompanyOptions[companyTab])}
      />
    </>
  );
};

export default PaymentFolderPage;
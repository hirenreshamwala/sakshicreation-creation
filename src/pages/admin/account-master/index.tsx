"use client";

import React, { useState, useEffect } from "react";
import { Box, TableCell, Typography, Avatar, IconButton, Tabs, Tab } from "@mui/material";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllAccountMastersThunk,
  deleteAccountMasterThunk,
  approvePartyThunk,
  clearError,
  clearSuccessMessage,
  getAccountMasterByStaffIdThunk,
} from "@/store/slices/accountMasterSlice";
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
import AssignLeadDialog from "@/component/AssignLeadDialog";
import AssignTaskDialog from "@/component/assigntaskdailog";
import { toast } from "react-toastify";
import { useMemo } from "react";
import TabComponent from "@/component/Dialog/TabComponent";
import { getCompanyWisePermission } from "@/utills/utills";

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
  const { accountMasters, loading, error } = useAppSelector((state) => state.accountMasters);
  const { user } = useAppSelector((state) => state.auth);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [isBulkUpload, setIsBulkUpload] = useState(false);
  const [companyTab, setCompanyTab] = useState(0);
  const [statusTab, setStatusTab] = useState(0);
  const [openBulkUploadDialog, setOpenBulkUploadDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [openAssignLeadDialog, setOpenAssignLeadDialog] = useState(false);
  const [openBulkAssignTask, setOpenBulkAssignTask] = useState(false);
  const canViewGlobal = user?.role?.permissions?.account_master?.view_global;
  const canViewOwn = user?.role?.permissions?.account_master?.view_own;
  const cancreate = user?.role?.permissions?.account_master?.create;
  const canedit = user?.role?.permissions?.account_master?.edit;
  const candelete = user?.role?.permissions?.account_master?.delete;

  // Determine company permissions
  const hasSakshi = !!getCompanyWisePermission(5);
  const hasQP = !!getCompanyWisePermission(6);
  const hasBothCompanies = hasSakshi && hasQP;
  const { staffId: si, startDate: st, endDate: e, status: s, partyTag: p } = router.query

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

  // Calculate counts for Approved and Pending tabs
  const approvedCount = accountMasters.filter((account) =>
    account.party?.statusApproval === "APPROVED" &&
    account.companyName?._id === selectedCompanyId
  ).length;

  const pendingCount = accountMasters.filter((account) =>
    account.party?.statusApproval === "PENDING" &&
    account.companyName?._id === selectedCompanyId
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
    if (error) toast.error(error);
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
  const handleSelectRow = (id: string) =>
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) setSelectedRows(formattedRows.map((row) => row.id));
    else setSelectedRows([]);
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
        await dispatch(getAllAccountMastersThunk(({
          staffId: si,
          startDate: st,
          endDate: e,
          partyTag: p?.toString().split(",").map((x) => x.toLowerCase()),
        }))).unwrap();
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
    setIsBulkUpload(true)
    setOpen(true)
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

    if (canViewGlobal) dispatch(getAllAccountMastersThunk({staffId: si,
          startDate: st,
          endDate: e,
          partyTag: p?.toString().split(",").map((x) => x.toLowerCase()),}));
    else if (canViewOwn && user?.id) dispatch(getAccountMasterByStaffIdThunk(user.id));

    return () => {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
    };
  }, [dispatch, router, canViewGlobal, canViewOwn, user?.id]);

  const filteredAccountMasters = accountMasters.filter((account) => {
    const statusApproval = account.party?.statusApproval || "PENDING";
    const statusMatch = statusTab === 0 ? statusApproval === "APPROVED" : statusApproval === "PENDING";

    const companyMatch = account.companyName?._id === selectedCompanyId;

    if (canViewOwn && !canViewGlobal) {
      return statusMatch && companyMatch && account.createdBy?._id === user?.id;
    }

    return statusMatch && companyMatch;
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
      statusApproval: account.party?.statusApproval === "APPROVED" ? "Approved" : "Pending",
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
            Showing data for: {hasSakshi ? 'Sakshi' : 'QP'}
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
        <Box />
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {(canViewGlobal) && (
            <ThemeButton onClick={handleAddNew}>+ Add New Party</ThemeButton>
          )}
          {(canViewOwn) && (
            <ThemeButton onClick={handleAddNewRequest}>+ Add New Party Request</ThemeButton>
          )}
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
        </Box>
      </Box>

      <TabComponent activeTab={statusTab} setActiveTab={setStatusTab} tabList={tabLabelsWithCount} align="left" />



      {loading ? (
        <Loader />
      ) : formattedRows.length === 0 ? (
        <Typography sx={{ mt: 2 }}>
          No account masters found for {hasBothCompanies ? companyTabs[companyTab]?.name : (hasSakshi ? 'Sakshi' : 'QP')} - {tabLabelsWithCount[statusTab]}.
        </Typography>
      ) : (
        <BasicTable
          showDatePicker={true}
          tableHeader={columns}
          showFillter={true}
          showSearch={true}
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
              <TableCell sx={{ fontSize: 14 }}>
                <Typography sx={{ fontSize: 14 }} title={row.remarks} noWrap>
                  {row.remarks && row.remarks.length > 10
                    ? `${row.remarks.substring(0, 10)}...`
                    : row.remarks}
                </Typography>
              </TableCell>
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
                {row.statusApproval === 'Pending' && canViewGlobal && (
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
            dispatch(getAllAccountMastersThunk({staffId: si,
          startDate: st,
          endDate: e,
          partyTag: p?.toString().split(",").map((x) => x.toLowerCase()),}));
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
            dispatch(getAllAccountMastersThunk({staffId: si,
          startDate: st,
          endDate: e,
          partyTag: p?.toString().split(",").map((x) => x.toLowerCase()),}));
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
            dispatch(getAllAccountMastersThunk({staffId: si,
          startDate: st,
          endDate: e,
          partyTag: p?.toString().split(",").map((x) => x.toLowerCase()),}));
          } else if (canViewOwn && user?.id) {
            dispatch(getAccountMasterByStaffIdThunk(user.id));
          }
        }}
      />
    </>
  );
};

export default IndexPage;

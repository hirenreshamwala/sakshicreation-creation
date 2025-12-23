"use client";

import { useState, useEffect, memo } from "react";
import { Box, TableCell, Typography, Avatar, IconButton } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddNewPartyDialog from "@/component/AddNewPartyDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Swal from "sweetalert2";
import Loader from "@/component/common_component/loader";
import AssignLeadDialog from "@/component/AssignLeadDialog";
import AssignTaskDialog from "@/component/assigntaskdailog";
import { toast } from "react-toastify";
import { useMemo } from "react";
import TabComponent from "@/component/Dialog/TabComponent";
import { getCompanyWisePermission } from "@/utills/utills";
import moment from "moment";
import CustomTable from "@/component/common_component/Table/CustomTable";
import { accountMasterService } from "@/services/accountMaster.service";
import _ from "lodash";
import { StaticCompanyOptions } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";

interface Company {
  _id: string;
  name: string;
  avatar?: string;
}

interface AccountMaster {
  _id: string;
  companyName?: Company;
  createdAt: string;
  party?: {
    _id: string;
    partyName: string;
    ownerName: string;
    ownerMobileNo: string;
    contactPerson: string;
    partyTag: string;
    statusApproval: string;
    address?: {
      unitNo: string;
      marketName: any;
      area: any;
    };
  };
  reasonToVisit: string;
  assignment?: {
    remarks: string;
    status: string;
    assignedTo?: any;
  };
  createdBy?: any;
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

const AccountMasterPage: React.FC = memo(() => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.company)
  // State management
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusTab, setStatusTab] = useState(0);
  const [companyTab, setCompanyTab] = useState(0);
  const [initialLoad, setInitialLoad] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBulkUpload, setIsBulkUpload] = useState(false);
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [responseState, setResponseState] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [openBulkAssignTask, setOpenBulkAssignTask] = useState(false);
  const [openBulkUploadDialog, setOpenBulkUploadDialog] = useState(false);
  const [openAssignLeadDialog, setOpenAssignLeadDialog] = useState(false);
  const [accountMasters, setAccountMasters] = useState<AccountMaster[]>([]);
  const defaultAccountMasterFilter = {
    page: 1,
    pageSize: 10,
    searchQuery: "",
    filters: {},
    includeCounts: true,
    isPagination: true,
    dateRange: { start: null, end: null },
    statusTab: 0,
    companyTab: 0,
    startDate: null,
    endDate: null,
    search: "",
    companyTab: companyTab
  }
  const [currentFilterState, setCurrentFilterState] = useState<any>(defaultAccountMasterFilter);
  const [appliedFilterState, setAppliedFilterState] = useState<any>(defaultAccountMasterFilter);

  // Permissions - you might need to adjust this based on your user structure
  const canViewGlobal = user?.role?.permissions?.account_master?.view_global;
  const canViewOwn = user?.role?.permissions?.account_master?.view_own;
  const cancreate = user?.role?.permissions?.account_master?.create;
  const canedit = user?.role?.permissions?.account_master?.edit;
  const candelete = user?.role?.permissions?.account_master?.delete;

  // Determine company permissions
  const hasSakshi = !!getCompanyWisePermission(5);
  const hasQP = !!getCompanyWisePermission(6);
  const hasBothCompanies = hasSakshi && hasQP;

  const { staffId: si, startDate: st, endDate: e, status: s, partyTag: p, c, companyName } = router.query;
  const columns = [
    { id: "checkbox", label: "" },
    { id: "company", label: "company" },
    { id: "createdDate", label: "Created Date", value: "createdAt" },
    { id: "party", label: "party", value: "party" },
    { id: "contactPerson", label: "Contact Person", value: "contactPerson" },
    { id: "partyTag", label: "Party Tag", value: "partyTag" },
    { id: "mobile", label: "Mobile No.", value: "mobile" },
    { id: "reason", label: "Reason to Visit", value: "reason" },
    { id: "unitno", label: "Unit No", value: "unitNo" },
    { id: "market", label: "Market", value: "market" },
    { id: "area", label: "Area", value: "area" },
    { id: "remarks", label: "Remarks" },
    { id: "status", label: "Status" },
    canViewOwn ? { id: "createdBy", label: "Created By" } : { id: "createdBy", label: "Created By", value: "createdBy" },
    { id: "assignedTo", label: "Assigned to", value: "assignedTo" },
    { id: "action", label: "Action" },
  ];
  // Company tabs configuration
  const companyTabs = useMemo(() => {
    const tabs = [];
    if (hasSakshi) tabs.push({ id: "sakshi", name: "Sakshi", value: StaticCompanyOptions[0], companyId: getCompanyWisePermission(5) });
    if (hasQP) tabs.push({ id: "qp", name: "QP", value: StaticCompanyOptions[1], companyId: getCompanyWisePermission(6) });
    return tabs;
  }, [user, hasSakshi, hasQP]);

  // Selected company based on permissions
  const selectedCompanyId = hasBothCompanies
    ? companyTabs[companyTab]?.companyId
    : hasSakshi
      ? getCompanyWisePermission(5)
      : getCompanyWisePermission(6);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      // Replace this with your actual user data fetching logic
      // This could be from localStorage, context, or an API call
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };

    loadUserData();
  }, []);

  // Load companies
  useEffect(() => {
    dispatch(getAllCompaniesThunk())
  }, []);

  // Load account masters
  const loadAccountMasters = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...currentFilterState, filters: {
          ...currentFilterState.filters,
          company: [StaticCompanyOptions[companyTab]],
          status: statusTab === 0 ? ["APPROVED"] : ["PENDING"]
        }
      }
      if (canViewGlobal && router.isReady) {
        const params: any = {};
        if (companyName) params.companyName = companyName;
        if (si) params.staffId = si;
        if (st) params.startDate = st;
        if (e) params.endDate = e;
        if (p) params.partyTag = p.toString().split(",").map((x: string) => x.toLowerCase());


        const data = await accountMasterService.getAccountMasters({ ...params, ...payload, isPagination: true, includeCounts: true });
        setAccountMasters(data.data);
        setResponseState(data.pagination)
        setAppliedFilterState(currentFilterState)
      } else if (canViewOwn && user?.id) {
        const data = await accountMasterService.getAccountMasterByStaffId(user.id, { ...payload, filters: { ...payload.filters, createdBy: [`${user.firstName} ${user.lastName}`] }, isPagination: true, includeCounts: true });
        setAccountMasters(data.data);
        setResponseState({ ...data.pagination, counts: data.counts })
        setAppliedFilterState(currentFilterState)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load account masters");
      toast.error(err.message || "Failed to load account masters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isSame = _.isEqual(appliedFilterState, currentFilterState);

    if (!isSame) loadAccountMasters();
  }, [currentFilterState]);

  useEffect(() => {
    if (user && router.isReady && initialLoad === false) {
      setCurrentFilterState((prev: any) => ({ ...prev, pageSize: 10 }))
      loadAccountMasters();
    }
  }, [user, router.isReady, canViewGlobal, canViewOwn]);

  useEffect(() => {
    if (c) {
      setCompanyTab(c === "Quality Packaging" || c === "QP" ? 1 : 0);
      setCurrentFilterState((prev: any) => ({ ...prev, filters: { ...prev.filters, company: [c] } }));
    }
  }, [c]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Update tabLabels to include counts
  const tabLabelsWithCount = [
    `APPROVED (${responseState?.counts?.approved})`,
    `PENDING (${responseState?.counts?.pending})`,
  ];

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
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));

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
        await accountMasterService.deleteAccountMaster(id);
        await loadAccountMasters(); // Refresh data
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
        await accountMasterService.approveParty(partyId);
        await loadAccountMasters(); // Refresh data
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
    setIsBulkUpload(true);
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditId(null);
    setOpenBulkUploadDialog(false);
    setIsBulkUpload(false);
  };

  const filteredAccountMasters = accountMasters

  const formattedRows: RowData[] = filteredAccountMasters.map((account) => ({
    id: account._id,
    partyId: account.party?._id || "",
    company: {
      _id: account.companyName?._id || "",
      name: account.companyName?.name || account.companyName?.companyName || "N/A",
      avatar: account.companyName?.avatar,
    },
    createdDate: moment(account.createdAt).format("DD-MM-YYYY"),
    party: account.party?.partyName || "N/A",
    contactPerson: account.party?.contactPerson || "N/A",
    partyTag: account.party?.partyTag || "New",
    mobile: account.party?.ownerMobileNo || "N/A",
    reason: account.reasonToVisit || "N/A",
    unitno: account.party?.address?.unitNo || "N/A",
    market: account.party?.address?.marketName?.marketName || account.party?.address?.marketName || "N/A",
    area: account.party?.address?.area?.area || account.party?.address?.area || "N/A",
    remarks: account.latestTask?.remarks || "N/A",
    status: account.latestTask?.status || "Not Started",
    statusType: mapStatusToType(account.latestTask?.status || "Not Started"),
    createdBy:
      account.createdBy && typeof account.createdBy === "object"
        ? `${account.createdBy.firstName} ${account.createdBy.lastName}`
        : "Unknown",
    assignedTo:
      account.latestTask?.assignTo && typeof account.latestTask.assignTo === "object"
        ? `${account.latestTask.assignTo.firstName} ${account.latestTask.assignTo.lastName}`
        : "Unassigned",
    statusApproval: account.party?.statusApproval === "APPROVED" ? "Approved" : "Pending",
  }));

  const partyIds = selectedRows
    .map((accountId) => {
      const account = accountMasters.find((acc) => acc._id === accountId);
      return account?.party?._id || "";
    })
    .filter(Boolean);

  const selectedParties = selectedRows
    .map((accountId) => {
      const account = accountMasters.find((acc) => acc._id === accountId);
      return {
        partyId: account?.party?._id || "",
        companyId: account?.companyName?._id || "",
      };
    })
    .filter((p) => p.partyId && p.companyId);


  const handleDownloadExcel = async () => {
    try {
      setDownloadLoading(true);

      const payload = {
        ...currentFilterState, filters: {
          ...currentFilterState.filters,
          company: [StaticCompanyOptions[companyTab]],
          status: statusTab === 0 ? ["APPROVED"] : ["PENDING"]
        }
      }


      // Use the same filters that are currently applied
      const blob = await accountMasterService.exportAccountMastersToExcel(payload);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AccountMasters_${moment().format('DD-MM-YYYY')}.xlsx`);
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
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleCompanyTabChange = (tab: number) => {
    setCompanyTab(tab);
    setCurrentFilterState({ ...defaultAccountMasterFilter, companyTab: tab });
  };

  const handleStatusTabChange = (tab: number) => {
    setStatusTab(tab);
    setCurrentFilterState({ ...defaultAccountMasterFilter, statusTab: tab });
  };

  return (
    <>
      {hasBothCompanies && (
        <Box sx={{ mb: 2 }}>
          <TabComponent activeTab={companyTab} setActiveTab={handleCompanyTabChange} />
        </Box>
      )}

      {!hasBothCompanies && selectedCompanyId && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: "primary.light", color: "primary.contrastText", borderRadius: 1 }}>
          <Typography variant="h6">Showing data for: {hasSakshi ? "Sakshi" : "QP"}</Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          mb: 2,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ flex: "0 1 auto", minWidth: 200 }}>
          <TabComponent activeTab={statusTab} setActiveTab={handleStatusTabChange} tabList={tabLabelsWithCount} align="left" />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          {canViewGlobal && <ThemeButton onClick={handleAddNew}>+ Add New Party</ThemeButton>}
          {canViewOwn && <ThemeButton onClick={handleAddNewRequest}>+ Add New Party Request</ThemeButton>}
          <ThemeButton onClick={handleBulkUploadClick} startIcon={<CloudUploadIcon />}>
            Bulk Upload
          </ThemeButton>
          <ThemeButton onClick={() => setOpenAssignLeadDialog(true)} disabled={selectedRows.length === 0}>
            Create Party Call for Selected
          </ThemeButton>
          <ThemeButton onClick={() => setOpenBulkAssignTask(true)} disabled={selectedRows.length === 0}>
            Assign Task for Selected
          </ThemeButton>
        </Box>
      </Box>

      {loading ? (
        <Loader />
      ) : (
        <CustomTable
          companyTab={companyTab}
          showDatePicker={true}
          tableHeader={columns}
          showFillter={true}
          showSearch={true}
          title="Account-master"
          showExcelDownload={true}
          rowData={formattedRows}
          setCurrentFilterState={setCurrentFilterState}
          currentFilterState={currentFilterState}
          defaultFilter={defaultAccountMasterFilter}
          renderRow={(row: RowData, index: number) => (
            <>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar src={row.company.avatar} alt={row.company.name} sx={{ width: 28, height: 28 }} />
                  {/* <Typography fontWeight={100} fontSize={14}>{row.company.name}</Typography> */}
                </Box>
              </TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.createdDate}</TableCell>
              <TableCell
                sx={{ cursor: "pointer", fontWeight: 500, fontSize: 14 }}
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
              <TableCell sx={{ fontSize: 14 }}>{row.market}</TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.area}</TableCell>
              <TableCell sx={{ fontSize: 14 }}>
                <Typography sx={{ fontSize: 14 }} title={row.remarks} noWrap>
                  {row.remarks && row.remarks.length > 10 ? `${row.remarks.substring(0, 10)}...` : row.remarks}
                </Typography>
              </TableCell>
              <TableCell sx={{ fontSize: 14 }}>
                <ThemeChip
                  label={row.status}
                  color={row.statusType}
                  variant="outlined"
                  sx={{
                    background: row.statusType === "success" ? "#ECFDF3" : row.statusType === "error" ? "#FEF3F2" : "#F2F4F7",
                    color: row.statusType === "success" ? "#12B76A" : row.statusType === "error" ? "#F04438" : "#667085",
                    fontWeight: 600,
                    fontSize: 13,
                    height: 28,
                    border: "none",
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.createdBy}</TableCell>
              <TableCell sx={{ fontSize: 14 }}>{row.assignedTo.toLowerCase() === "undefined undefined" ? row.createdBy : row.assignedTo}</TableCell>
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
                {row.statusApproval === "Pending" && canViewGlobal && (
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
          totalRows={responseState?.counts?.approved}
          pageName="account-master"
          setDownloadLoading={setDownloadLoading}
          downloadLoading={downloadLoading}
          handleDownloadExcel={handleDownloadExcel}
        />
      )}

      {open && (
        <AddNewPartyDialog
          open={open}
          onClose={handleDialogClose}
          accountId={editId ?? undefined}
          refreshData={loadAccountMasters}
          isRequestMode={isRequestMode}
          isBulkUpload={isBulkUpload}
          company={companies?.find((item) => item?.companyName === StaticCompanyOptions[companyTab])}
        />
      )}

      {console.log(companies?.find((item) => item?.name === (hasBothCompanies ? companyTabs[companyTab]?.value : hasSakshi ? "Sakshi" : "QP")), 'ksdjksjdoikdjikj', (hasBothCompanies ? companyTabs[companyTab]?.value : hasSakshi ? "Sakshi" : "QP"))}
      {openAssignLeadDialog ?
        <AssignLeadDialog
          open={openAssignLeadDialog}
          onClose={() => {
            setOpenAssignLeadDialog(false);
            setSelectedRows([]);
          }}
          partyIds={partyIds}
          accountMasters={accountMasters}
          onSuccess={() => {
            setOpenAssignLeadDialog(false);
            setSelectedRows([]);
            loadAccountMasters();
          }}
        />
        : null}

      {openBulkAssignTask ?
        <AssignTaskDialog
          open={openBulkAssignTask}
          onClose={() => {
            setOpenBulkAssignTask(false);
            setSelectedRows([]);
          }}
          accountMasters={accountMasters}
          selectedParties={selectedParties}
          onSuccess={() => {
            setOpenBulkAssignTask(false);
            setSelectedRows([]);
            loadAccountMasters();
          }}
        />
        : null}
    </>
  );
});

export default AccountMasterPage;
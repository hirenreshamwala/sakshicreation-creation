import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { Avatar, Box, TableCell, Typography, Button } from "@mui/material"
import { useRouter } from "next/router"
import ThemeButton from "@/component/common_component/themebutton"
import { useAppDispatch, useAppSelector } from "@/store"
import { getCompanyWisePermission, getDisplayStatus, getUserData } from "@/utills/utills"
import QpOrdersPage from "@/component/allorderdailog/QpOrder"
import TabComponent from "@/component/Dialog/TabComponent"
import { StaticCompanyOptions } from "@/constants"
import Loader from "@/component/common_component/loader"
import { toast } from "react-toastify"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import AddSakhiOrderDialog from "@/component/allorderdailog"
import { generateInvoicePDF } from "@/utills/generateInvoicePDF"
import ComplainDialogue from "../all-complains/ComplainDialogue";
import CustomTable2 from "@/component/common_component/Table/CustomTable2";
import { orderService } from "@/services/order.service";
import { getAllOrdersThunk, getOrdersByStaffIdThunk } from "@/store/slices/orderSlice";
import _ from "lodash";
import moment from "moment";
import { FaChevronRight } from "react-icons/fa6"

const columns = [
  { id: "orderNumber", label: "Order No.", value: "orderNumber" },
  { id: "company", label: "Company", value: "company" },
  { id: "date", label: "Date", value: "createdAt" },
  { id: "party", label: "Party", value: "party" },
  { id: "item", label: "Item Name", value: "item" },
  { id: "size", label: "Size", value: "size" },
  { id: "remarks", label: "Remarks", value: "remarks" },
  { id: "orderedBy", label: "Ordered By", value: "orderedBy" },
  { id: "orderStatus", label: "Order Status", value: "orderStatus" },
  { id: "actions", label: "Actions" },
  // { id: "complain", label: "Complain" },
]

type OrderRow = {
  _id: string;
  id: string;
  orderNumber: string;
  companyName: {
    companyName: string;
    _id?: string;
    avatar?: string;
  };
  party: {
    partyName: string
    ownerMobileNo?: string
    address?: {
      unitNo?: string;
      marketName?: { marketName: string; _id: string } | string;
      landMark?: string;
      area?: { area: string; _id: string } | string;
      pincode?: string;
      streetAddress?: string;
    };
    GSTNo?: string;
  };
  productItem: {
    itemName: string
  }
  size?: string | { size: string }; 
  createdAt: string
  remarks: string
  createdBy: {
    firstName: string
    lastName: string
  }
  status: string
  // Sub-status fields
  designerStatus?: string
  printerStatus?: string
  binderStatus?: string
  bookletBinderStatus?: string
  // Staff assignment fields
  designer?: { _id: string }
  printer?: { _id: string }
  binder?: { _id: string }
  bookletBinder?: { _id: string }
  quotation?: Array<{ unitPrice: number; gst: number }>
  qty?: number
  daysAfterConfirmation?: number
  lastStatusChangeDate?: string
}

const AllOrdersPage = () => {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { orderList: orders, loading } = useAppSelector((state) => state.orders);
  const { companies } = useAppSelector((state) => state.company)
  const { totalCount } = useAppSelector((state) => state.orders);
  const userData = getUserData()

  // Filter state
  const { companyName, c, staffId, startDate: st, endDate: ed, party } = router.query
  const [activeTab, setActiveTab] = useState(c === "Quality Packaging" ? 1 : 0)
  const [complainOpen, setComplainOpen] = useState(false)
  const [selectedOrderForComplain, setSelectedOrderForComplain] = useState<OrderRow | null>(null)
  
  // Remove isInitialLoad state and use loading state from Redux instead
  const [isLoadingData, setIsLoadingData] = useState(false)
  
  // Prevent multiple API calls
  const isLoadingRef = React.useRef(false)
  const hasLoadedInitialDataRef = React.useRef(false)

  const defaultOrderFilter = {
    page: 1,
    pageSize: 10,
    searchQuery: "",
    filters: {},
    includeCounts: true,
    isPagination: true,
    dateRange: { start: null, end: null },
    startDate: null,
    endDate: null,
    search: ""
  };
  const [currentFilterState, setCurrentFilterState] = useState<any>(defaultOrderFilter);
  // State for filter options
  const [filterOptionsData, setFilterOptionsData] = useState<{ [key: string]: string[] }>({});
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
  const canViewGlobal = userData?.role?.permissions?.all_orders?.view_global
  const canViewOwn = userData?.role?.permissions?.all_orders?.view_own
  // Determine user permissions
  const hasSakshiPermission = getCompanyWisePermission(1)
  const hasQpPermission = getCompanyWisePermission(2)
  const hasBothPermissions = getCompanyWisePermission(0)
  const debounceRef = useRef(0);
  
  // Updated: Use thunk for loading orders
  const loadOrders = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log("⚠️ API call already in progress, skipping...")
      return
    }
    
    setIsLoadingData(true)
    isLoadingRef.current = true
    
    // Simple debounce: Ignore if called within 300ms of last call (for rapid page clicks)
    const now = Date.now()
    if (debounceRef.current && (now - debounceRef.current) < 300) {
      setIsLoadingData(false)
      isLoadingRef.current = false
      return
    }
    debounceRef.current = now  // Update debounce timestamp
    
    try {
    const params = {
      ...currentFilterState, 
      isPagination: true, 
      includeCounts: true 
    };

      if (canViewGlobal) {
        await dispatch(getAllOrdersThunk(params));
      } else if (canViewOwn && userData?.id) {
        await dispatch(getOrdersByStaffIdThunk({ id: userData.id, filters: params }))
      }
      
      // Mark that initial data has been loaded
      hasLoadedInitialDataRef.current = true
    } catch (err: any) {
      console.error("❌ Error loading orders:", err)
      toast.error(err.message || "Failed to load orders")
    } finally {
      setIsLoadingData(false)
      isLoadingRef.current = false
    }
  }, [dispatch, currentFilterState, canViewGlobal, canViewOwn, userData?.id]);

  // Function to load filter options - FIXED: Add staffId if viewing own
  const loadFilterOptions = async (field: string) => {
    setLoadingFilterOptions(true);
    try {
      const extraFilters = canViewOwn && !canViewGlobal ? { staffId: userData.id } : {};
      const filterPayload = { 
        ...currentFilterState.filters, 
        ...extraFilters,
        startDate: currentFilterState.startDate,
        endDate: currentFilterState.endDate,
      };
      const response = await orderService.searchFilterOptions(field, "", filterPayload);
    
      if (response.success && response.data) {
        setFilterOptionsData(prev => ({
          ...prev,
          [field]: response.data || []
        }));
      }
    } catch (error: any) {
      console.error(`Error loading filter options for ${field}:`, error);
      toast.error(`Failed to load filter options for ${field}`);
    } finally {
      setLoadingFilterOptions(false);
    }
  };

  // Handle filter field selection
  const handleFilterFieldSelect = useCallback(async (field: string | null) => {
    console.log("handleFilterFieldSelect called with:", field);
    setSelectedFilterField(field);

    if (field && !filterOptionsData[field]) {
      try {
        await loadFilterOptions(field);
      } catch (error) {
        console.error("Error loading filter options:", error);
        toast.error(`Failed to load options for ${field}`);
      }
    }
    return Promise.resolve();
  }, [filterOptionsData, currentFilterState, canViewOwn, canViewGlobal, userData?.id]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: { [key: string]: string[] }) => {
    console.log("Filters changed to:", newFilters);
    setCurrentFilterState((prev: any) => ({
      ...prev,
      filters: newFilters,
      page: 1,
    }));
  }, []);

  // Effect to load orders when filters change - FIXED: Use applied state to prevent loops
  // FIXED: Simplify the filter change effect - Remove appliedFilterState and timeout
  useEffect(() => {
    console.log("🔄 Filter state changed, loading orders...")
    loadOrders()  // Directly call - deps will handle triggering
  }, [loadOrders]);
  useEffect(() => {
    if (userData && router.isReady && !hasLoadedInitialDataRef.current) {
      console.log("🚀 Initial load started")
      loadOrders() // No need to set page:1 here - table will handle initial page
    }
  }, [userData, router.isReady, loadOrders]);  // Depend on loadOrders

  // Reset initial load flag when user changes
  useEffect(() => {
    if (userData) {
      hasLoadedInitialDataRef.current = false
    }
  }, [userData])

  // Initial companies load
  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true));
  }, [dispatch, companies.length]);

  // Tab sync
  useEffect(() => {
    if (c) setActiveTab(c === "Quality Packaging" || c === "QP" ? 1 : 0);
  }, [c]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const handleComplainClick = (rowData: OrderRow) => {
    setSelectedOrderForComplain(rowData);
    setComplainOpen(true);
  };

  const getRouteByStatus = (row: OrderRow): string => {
    const { status, designer, printer, binder, bookletBinder } = row;
    switch (status) {
      case "Received":
        return `/admin/all-orders/view?id=${row._id}`;
      case "Designer":
        return `/admin/all-orders/view/designer?id=${row._id}`;
      case "Printer":
        return `/admin/all-orders/view/printers?id=${row._id}`;
      case "Binder":
        return `/admin/all-orders/view/binder?id=${row._id}`;
      case "Booklet & Folder Binder":
        return `/admin/all-orders/view/booklet-folder?id=${row._id}`;
      case "Delivery":
        return `/admin/all-orders/view/dilevery?id=${row._id}`;
      case "Hold":
        if (bookletBinder) {
          return `/admin/all-orders/view/booklet-folder?id=${row._id}`;
        } else if (binder) {
          return `/admin/all-orders/view/binder?id=${row._id}`;
        } else if (printer) {
          return `/admin/all-orders/view/printers?id=${row._id}`;
        } else if (designer) {
          return `/admin/all-orders/view/designer?id=${row._id}`;
        } else {
          return `/admin/all-orders/view?id=${row._id}`;
        }
      default:
        return `/admin/all-orders/view?id=${row._id}`;
    }
  };

  const handleRowClick = (row: OrderRow) => {
    const route = getRouteByStatus(row)
    router.push(route)
  }

  const handleDownloadInvoice = (row: OrderRow) => {
    console.log("🚀 ~ handleDownloadInvoice ~ row:", row)
    try {
      if (!row?.party?.address) {
        toast.error("Address data is missing");
        return;
      }

      const latestQuotation = row?.quotation?.[row?.quotation?.length - 1];
      const quantity = Number(row?.qty) || 0;
      const unitPrice = Number(latestQuotation?.unitPrice) || 0;
      const subtotal = quantity * unitPrice;
      const gstValue = Number(latestQuotation?.gst) || 0;
      const applyGST = gstValue > 0;
      const gstPercentage = gstValue;
      const gstAmount = applyGST ? subtotal * (gstPercentage / 100) : 0;
      const totalAmount = subtotal + gstAmount;

      const formData = {
        quotation: true,
        orderNumber: row?.orderNumber || "N/A",
        companyName: row?.companyName?.companyName || "N/A",
        remarks: row?.remarks || "",
        ownerMobileNo: row?.party?.ownerMobileNo || "",
        partyName: row?.party?.partyName || "N/A",
        addressName:
          `${row?.party?.address?.unitNo}, ${row?.party?.address?.marketName?.marketName}, ${row?.party?.address?.area?.area}, ${row?.party?.address?.pincode?.pincode}`,
        GSTNo: row?.party?.GSTNo || "N/A",
        servicePerformance: row?.productItem?.itemName || "N/A",
        quantity: quantity,
        unitPrice: unitPrice,
        total: subtotal,
        finalAmount: totalAmount,
        applyGST: applyGST,
        gstPercentage: gstPercentage,
        daysAfterConfirmation: row?.daysAfterConfirmation || 0,
      }

      generateInvoicePDF(formData)
      toast.success("Quotation downloaded successfully")
    } catch (error) {
      console.error("Error downloading Quotation:", error)
      toast.error("Failed to download Quotation")
    }
  }

  const handleProformaDownload = (row: OrderRow) => {
    try {
      if (!row?.party?.address) {
        toast.error("Address data is missing");
        return;
      }

      const formData = {
        orderNumber: row?.orderNumber || "N/A",
        companyName: row?.companyName?.companyName || "N/A",
        remarks: row?.remarks || "",
        ownerMobileNo: row?.party?.ownerMobileNo || "",
        partyName: row?.party?.partyName || "N/A",
        addressName: `${row?.party?.address?.unitNo || ""}, ${typeof row?.party?.address?.marketName === 'object'
            ? row?.party?.address?.marketName?.marketName
            : row?.party?.address?.marketName || ""
          }, ${typeof row?.party?.address?.area === 'object'
            ? row?.party?.address?.area?.area
            : row?.party?.address?.area || ""
          } - ${row?.party?.address?.pincode?.pincode || ""}`,
        GSTNo: row?.party?.GSTNo || "N/A",
        servicePerformance: row?.productItem?.itemName || "N/A",
        quantity: row?.qty || 0,
        unitPrice: row?.unitPrice || 0,
        total: row?.total || 0,
        finalAmount: row?.finalAmount || 0,
        applyGST: row?.applyGST || false,
        gstPercentage: row?.gstPercentage || 18,
        daysAfterConfirmation: row?.daysAfterConfirmation || 0,
        paymentDate: row?.paymentDate || "",
        quotation: true,
        description: row?.description || "",
      }

      generateInvoicePDF(formData)
      toast.success("Proforma downloaded successfully")
    } catch (error) {
      console.error("Error downloading Proforma:", error)
      toast.error("Failed to download Proforma")
    }
  }

  const StatusBadge = ({ row }: { row: OrderRow }) => {
    const { text, isHold } = getDisplayStatus(row);
    if (isHold) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
            {text}
          </Typography>
          <Box
            sx={{
              backgroundColor: "#DC2626",
              color: "#FFFFFF",
              fontSize: "10px",
              fontWeight: 600,
              borderRadius: "4px",
              px: 1,
              py: 0.25,
              textTransform: "uppercase",
            }}
          >
            HOLD
          </Box>
        </Box>
      );
    }

    return (
      <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
        {text}
      </Typography>
    );
  };

  const getAvatarUrl = (row: OrderRow) => {
    if (row.companyName && (row.companyName as any).avatar) {
      return (row.companyName as any).avatar;
    }
  };

  // Format rows for table
  const formattedRows = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
  
    return orders.map((order: any) => ({
      _id: order._id,
      id: order._id,
      orderNumber: order.orderNumber || "N/A",
      companyName: order.companyName || { companyName: "N/A" },
      party: order.party || { partyName: "N/A" },
      productItem: order.productItem || { itemName: "N/A" },
      size: order.size || { size: "N/A" },
      createdAt: order.createdAt || new Date().toISOString(),
      remarks: order.remarks || "N/A",
      createdBy: order.createdBy || { firstName: "Unknown", lastName: "" },
      status: order.status || "Received",
      designerStatus: order.designerStatus,
      printerStatus: order.printerStatus,
      binderStatus: order.binderStatus,
      bookletBinderStatus: order.bookletBinderStatus,
      designer: order.designer,
      printer: order.printer,
      binder: order.binder,
      bookletBinder: order.bookletBinder,
      quotation: order.quotation || [],
      qty: order.qty,
      daysAfterConfirmation: order.daysAfterConfirmation,
      lastStatusChangeDate: order.lastStatusChangeDate,
    
      // Add these fields for proper filtering
      company: order.companyName?.companyName || "N/A",
      partyName: order.party?.partyName || "N/A",
      item: order.productItem?.itemName || "N/A",
      orderedBy: order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : "Unknown",
      orderStatus: order.status || "Received",
      createdDate: moment(order.createdAt).format("DD-MM-YYYY"),
    }));
  }, [orders]);

  // Excel data
  const excelHeaders = useMemo(() => [
    "Order Number",
    "Company",
    "Party",
    "Date",
    "Item Name",
    "Size",
    "Remarks",
    "Ordered By",
    "Status",
  ], []);

  const excelData = useMemo(() => {
    return formattedRows.map((order) => ({
      "Order Number": order.orderNumber || "N/A",
      "Company": order.companyName?.companyName || "N/A",
      "Party": order.party?.partyName || "N/A",
      "Date": moment(order.createdAt).format("DD-MM-YYYY"),
      "Item Name": order.productItem?.itemName || "N/A",
      "Size": order.size?.size || "N/A",
      "Remarks": order.remarks || "N/A",
      "Ordered By": order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : "Unknown",
      "Status": order.status || "Received",
    }));
  }, [formattedRows]);

  // Render row function
  const renderRow = (row: OrderRow, index: number) => {
    return (
            <>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.orderNumber || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    src={getAvatarUrl(row)}
                    sx={{ width: 32, height: 32 }}
                    alt={row.companyName?.companyName || "Company"}
                  />
                  <Typography
                    fontWeight={600}
                    fontSize="14px"
                    color="#111827"
                    sx={{ cursor: canViewGlobal ? "pointer" : "default" }}
                    onClick={canViewGlobal ? () => handleRowClick(row) : undefined}
                  >
                    {row.companyName?.companyName || "N/A"}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {formatDate(row.createdAt)}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.party?.partyName || "N/A"}
                </Typography>
              </TableCell>


              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.productItem?.itemName || "N/A"}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                      {typeof row?.size === "object" ? row.size?.size : row?.size || "N/A"}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography sx={{ fontSize: 14, color: "text.secondary" }} title={row.remarks} noWrap>
                  {row.remarks && row.remarks.length > 10
                    ? `${row.remarks.substring(0, 13)}...`
                    : row.remarks}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.createdBy?.firstName || "N/A"} {row.createdBy?.lastName || "N/A"}
                </Typography>
              </TableCell>

              <TableCell>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ cursor: canViewGlobal ? "pointer" : "default" }}
                  onClick={canViewGlobal ? () => handleRowClick(row) : undefined}
                >
                  <StatusBadge row={row} />
                  <FaChevronRight
                    style={{
                      fontSize: 14,
                      color: "#9CA3AF",
                      marginLeft: 8,
                    }}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  {/* <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleDownloadInvoice(row)}
                    disabled={!row.quotation || row.quotation.length === 0}
                    sx={{ fontSize: "12px", textTransform: "none" }}
                  >
                    Quotation
                  </Button> */}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleProformaDownload(row)}
                    sx={{ fontSize: "12px", textTransform: "none" }}
                  >
                    Proforma
                  </Button>
                </Box>
              </TableCell>
              {/* <TableCell>
                <ThemeButton
                  onClick={() => handleComplainClick(row)}
                >
                  Complain
                </ThemeButton>
              </TableCell> */}
            </>
    );
  };

  // Render content based on permissions
  const renderContent = () => {
    if (hasBothPermissions) {
      return (
        <>
          <TabComponent activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === 0 ? renderSakshiContent() : renderQpContent()}
        </>
      );
    }
    if (hasSakshiPermission) {
      return renderSakshiContent();
    }
    if (hasQpPermission) {
      return renderQpContent();
    }
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Typography variant="h6" color="error">
          You don't have permission to view this page.
        </Typography>
      </Box>
    );
  };

  const renderSakshiContent = () => (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ThemeButton onClick={() => setOpen(true)}>+ Add New Order</ThemeButton>
        </Box>
      </Box>
      {(loading || isLoadingData) && orders.length === 0 ? (
        <Loader />
      ) : (
        <CustomTable2
          showDatePicker={true}
          tableHeader={columns}
          showFillter={true}
          showSearch={true}
          title="All Orders"
          showExcelDownload={true}
          excelHeaders={excelHeaders}
          excelData={excelData}
          rowData={formattedRows}
          setCurrentFilterState={setCurrentFilterState}
          currentFilterState={currentFilterState}
          currentPage={currentFilterState.page} // NEW: Pass explicit current page
          onPageChange={(newPage: number) => { // NEW: Callback for page changes
            console.log("Page change to:", newPage)
            setCurrentFilterState(prev => ({ ...prev, page: newPage }))
          }}
          renderRow={renderRow}
          totalRows={totalCount || formattedRows.length} // FIXED: Use Redux totalCount
          onFilterFieldSelect={handleFilterFieldSelect}
          selectedFilterField={selectedFilterField}
          filterOptionsData={filterOptionsData}
          loadingFilterOptions={loadingFilterOptions}
          onFiltersChange={handleFiltersChange}
        />
      )}
      {open && (
        <AddSakhiOrderDialog
          company={companies.find((item) => item.companyName === StaticCompanyOptions[0])?._id}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
      {complainOpen && selectedOrderForComplain && (
        <ComplainDialogue
          company={{
            _id: selectedOrderForComplain.companyName._id,
            companyName: selectedOrderForComplain.companyName.companyName
          }}
          open={complainOpen}
          onClose={() => {
            setComplainOpen(false);
            setSelectedOrderForComplain(null);
          }}
          selectedOrderData={selectedOrderForComplain} // Pass the selected order data
        // refreshData={refreshData}
        />
      )}
    </>
  );

  const renderQpContent = () => <QpOrdersPage />;

  // Show loader only on first load when there are no orders
  if ((loading || isLoadingData) && orders.length === 0) {
    return <Loader />
  }

  return <>{renderContent()}</>;
}

export default AllOrdersPage;
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { Avatar, Box, TableCell, Typography, Button, CircularProgress, IconButton, Badge, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material"
import { useRouter } from "next/router"
import ThemeButton from "@/component/common_component/themebutton"
import { useAppDispatch, useAppSelector } from "@/store"
import { formatDateToDDMMYYYY, getCompanyWisePermission, getDisplayStatus, getUserData } from "@/utills/utills"
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
import FollowUpDialog from "@/component/allorderdailog/FollowUpDialog";
import { orderService } from "@/services/order.service";
import { getAllPaginationOrdersThunk, getOrdersByStaffIdThunk } from "@/store/slices/orderSlice";
import _ from "lodash";
import moment from "moment";
import { FaChevronRight } from "react-icons/fa6"
import { reportService } from "@/services/reportService";
import CancelOrderDialog from "@/component/allorderdailog/CancelOrderDialog"

const columns = [
  { id: "orderNumber", label: "Order No.", value: "orderNumber" },
  { id: "company", label: "Company", value: "company" },
  { id: "date", label: "Date" },
  { id: "party", label: "Party", value: "party" },
  { id: "item", label: "Item Name", value: "item" },
  { id: "size", label: "Size", value: "size" },
  { id: "remarks", label: "Remarks", value: "remarks" },
  { id: "orderedBy", label: "Ordered By", value: "orderedBy" },
  { id: "orderStatus", label: "Order Status", value: "orderStatus" },
  { id: "followUp", label: "Follow Up", value: "followUp" },
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
  designerNotificationUnread?: boolean
  printerNotificationUnread?: boolean
  binderNotificationUnread?: boolean
  bookletBinderNotificationUnread?: boolean
  // Follow up field
  followUp?: {
    staff?: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    status?: string;
    assignedAt?: string;
    remarks?: string;
  }
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

  // Follow Up Dialog state
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false)
  const [selectedOrderForFollowUp, setSelectedOrderForFollowUp] = useState<OrderRow | null>(null)

  // Cancel Order Dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<OrderRow | null>(null)
  const [cancelRemarks, setCancelRemarks] = useState("")

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
  const [exportingPendingApproval, setExportingPendingApproval] = useState(false);
  // State for filter options
  const [filterOptionsData, setFilterOptionsData] = useState<{ [key: string]: string[] }>({});
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
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
        await dispatch(getAllPaginationOrdersThunk(params));
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
    hasLoadedInitialDataRef.current = false
  }, [userData?.id]);

  // Initial companies load
  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk());
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

  const handleFollowUpClick = (rowData: OrderRow) => {
    setSelectedOrderForFollowUp(rowData);
    setFollowUpDialogOpen(true);
  };

  const handleFollowUpSuccess = () => {
    loadOrders();
  };

  // Cancel Order handlers
  const handleCancelClick = (rowData: OrderRow) => {
    setSelectedOrderForCancel(rowData);
    setCancelRemarks("");
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedOrderForCancel) return;

    try {
      await orderService.cancelOrder(selectedOrderForCancel._id, cancelRemarks);
      toast.success("Order cancelled successfully");
      setCancelDialogOpen(false);
      setSelectedOrderForCancel(null);
      setCancelRemarks("");
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order");
    }
  };

  const handleExportPendingClientApproval = async () => {
    setExportingPendingApproval(true);
    try {
      const payload = {
        startDate: currentFilterState.startDate || undefined,
        endDate: currentFilterState.endDate || undefined,
      };

      const result = await reportService.exportPendingClientApprovalOrders(payload);

      // Check if result is empty response
      if (typeof result === 'object' && result.empty) {
        toast.info(result.message || 'No pending approval orders found for export.');
        return;
      }

      // If we get here, result is a Blob
      const blob = result as Blob;

      const dateStr = payload.startDate && payload.endDate
        ? `${moment(payload.startDate).format('DDMMYYYY')}_to_${moment(payload.endDate).format('DDMMYYYY')}`
        : 'All_Time';

      const fileName = `Pending_Client_Approval_Orders_${dateStr}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Pending client approval orders exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export pending approval orders');
    } finally {
      setExportingPendingApproval(false);
    }
  };


  const handleExcelDownload = async () => {
    // डाउनलोड प्रक्रिया शुरू करने से पहले कुछ चेक
    if (downloadLoading) {
      console.log("Download already in progress...");
      return;
    }

    // Optional: अगर कोई ऑर्डर नहीं है तो यूजर को इन्फॉर्म करें
    if (!orders || orders.length === 0) {
      toast.info("No orders available to export.");
      return;
    }

    setDownloadLoading(true);
    try {
      console.log("Exporting with filters:", currentFilterState);

      // ✅ Account Master की तरह ही पेलोड तैयार करें, लेकिन इसमें Order के सभी फ़िल्टर्स शामिल हैं
      const payload = {
        ...currentFilterState,
        isPagination: false, // एक्सेल के लिए सभी रिकॉर्ड चाहिए
        includeCounts: false,
        // सुनिश्चित करें कि filters ऑब्जेक्ट मौजूद है
        filters: {
          ...currentFilterState.filters,
          // आप चाहें तो activeTab के आधार पर कंपनी फ़िल्टर भी लगा सकते हैं (अगर आपके पास कंपनी टैब है)
          // company: activeTab === 0 ? ["Sakshi Packaging"] : ["Quality Packaging"]
        },
        // सुनिश्चित करें कि डेट रेंज प्रॉपर्टी नाम सही हैं (startDate, endDate)
        startDate: currentFilterState.startDate,
        endDate: currentFilterState.endDate,
        search: currentFilterState.search || currentFilterState.searchQuery || "",
      };

      // ✅ Service का उपयोग करके API कॉल करें
      const blob = await orderService.exportOrdersToExcel(payload);

      // ✅ फ़ाइल डाउनलोड के लिए लिंक बनाएँ
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // डाउनलोड फ़ाइल का नाम तय करें (current date के साथ)
      const fileName = `Orders_Export_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`;
      link.setAttribute('download', fileName);

      // पेज में लिंक ऐड करें और क्लिक ट्रिगर करें
      document.body.appendChild(link);
      link.click();

      // ✅ क्लीनअप
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // मेमोरी फ्री करें

      toast.success('Excel file downloaded successfully!');

    } catch (error) {
      console.error('Order export failed:', error);
      // सर्विस में throw किए गए error को यहाँ हैंडल करें
      toast.error(error.message || 'Failed to download Excel file');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Download Pending Approval Orders Excel
  const [downloadingPendingApproval, setDownloadingPendingApproval] = useState(false);

  const handleDownloadPendingApprovalExcel = async () => {
    if (downloadingPendingApproval) {
      console.log("Download already in progress...");
      return;
    }

    setDownloadingPendingApproval(true);
    try {
      const payload = {
        startDate: currentFilterState.startDate || undefined,
        endDate: currentFilterState.endDate || undefined,
      };

      const blob = await orderService.exportPendingApprovalOrdersToExcel(payload);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const fileName = `Pending_Approval_Orders_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`;
      link.setAttribute('download', fileName);

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Pending approval orders Excel downloaded successfully!');

    } catch (error: any) {
      console.error('Pending approval export failed:', error);
      toast.error(error.message || 'Failed to download pending approval Excel file');
    } finally {
      setDownloadingPendingApproval(false);
    }
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

      designerNotificationUnread: order.designerNotificationUnread,
      printerNotificationUnread: order.printerNotificationUnread,
      binderNotificationUnread: order.binderNotificationUnread,
      bookletBinderNotificationUnread: order.bookletBinderNotificationUnread,
      followUp: order.followUp,

      // Add these fields for proper filtering
      company: order.companyName?.companyName || "N/A",
      partyName: order.party?.partyName || "N/A",
      item: order.productItem?.itemName || "N/A",
      orderedBy: order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : "Unknown",
      orderStatus: order.status || "Received",
      createdDate: moment(order.createdAt).format("DD-MM-YYYY"),
    }));
  }, [orders]);


  // Render row function
  const renderRow = (row: OrderRow, index: number) => {
    let counter = 0
    if (row.designerNotificationUnread === true) {
      counter++
    }
    if (row.printerNotificationUnread === true) {
      counter++
    }
    if (row.binderNotificationUnread === true) {
      counter++
    }
    if (row.bookletBinderNotificationUnread === true) {
      counter++
    }
    return (
      <>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize="14px" color="#6B7280">
              {row.orderNumber || "N/A"}
            </Typography>

          </Box>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={getAvatarUrl(row)}
              sx={{ width: 32, height: 32 }}
              alt={row.companyName?.companyName || "Company"}
            />
            {/* <Typography
                    fontWeight={600}
                    fontSize="14px"
                    color="#111827"
                    sx={{ cursor: canViewGlobal ? "pointer" : "default" }}
                    onClick={canViewGlobal ? () => handleRowClick(row) : undefined}
                  >
                    {row.companyName?.companyName || "N/A"}
                  </Typography> */}
          </Box>
        </TableCell>
        <TableCell>
          <Typography fontSize="14px" color="#6B7280">
            {formatDateToDDMMYYYY(row.createdAt)}
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
            {counter > 0 && (
              <Badge color="primary" sx={{ mt: 1.6 }} badgeContent={counter}>
                {counter}
              </Badge>
            )}
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
          <Box display="flex" alignItems="center" gap={1}>
            {row.followUp?.staff ? (
              <>
                <Avatar
                  src={row.followUp.staff.avatar}
                  alt={`${row.followUp.staff.firstName} ${row.followUp.staff.lastName}`}
                  sx={{ width: 24, height: 24 }}
                />

                <Typography fontSize="12px" color="#6B7280">
                  {row.followUp.staff.firstName} {row.followUp.staff.lastName}
                </Typography>

                {/* Status + Date Wrapper */}
                <Box display="flex" flexDirection="column" gap={0.5}>
                  {/* Status Badge */}
                  <Box
                    sx={{
                      backgroundColor:
                        row.followUp.status === "Completed"
                          ? "#10B981"
                          : row.followUp.status === "In Progress"
                            ? "#3B82F6"
                            : row.followUp.status === "Cancelled"
                              ? "#EF4444"
                              : row.followUp.status === "Rescheduled"
                                ? "#8B5CF6"
                                : "#F59E0B",
                      color: "#FFFFFF",
                      fontSize: "10px",
                      fontWeight: 600,
                      borderRadius: "4px",
                      px: 0.75,
                      py: 0.25,
                      textTransform: "uppercase",
                      width: "fit-content",
                    }}
                  >
                    {row.followUp?.taskId?.status || ""}
                  </Box>

                  {/* Rescheduled Date (Now Below Badge) */}
                  {row.followUp?.taskId?.status === "Rescheduled" &&
                    row.followUp?.taskId?.rescheduleDate && (
                      <Typography
                        fontSize="10px"
                        color="#8B5CF6"
                        sx={{
                          backgroundColor: "#EDE9FE",
                          borderRadius: "4px",
                          px: 0.75,
                          py: 0.25,
                          fontWeight: 500,
                          width: "fit-content",
                        }}
                      >
                        {moment(row.followUp.taskId.rescheduleDate).format(
                          "DD-MM-YYYY"
                        )}
                      </Typography>
                    )}
                </Box>
              </>
            ) : (
              <Typography fontSize="12px" color="#9CA3AF">
                Not Assigned
              </Typography>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleFollowUpClick(row)}
              sx={{ fontSize: "11px", textTransform: "none" }}
            >
              {row.followUp?.staff ? "Reassign" : "Follow Up"}
            </Button>
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
            {row.status !== "Cancelled" && (
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={() => handleCancelClick(row)}
                sx={{ fontSize: "12px", textTransform: "none" }}
              >
                Cancel
              </Button>
            )}
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

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
          <IconButton
            onClick={handleExcelDownload}
            disabled={downloadLoading || loading || isLoadingData} // लोडिंग हो तो डिसेबल
            sx={{
              border: "1px solid #D0D5DD",
              borderRadius: 2,
              p: 1,
              color: downloadLoading ? "#9CA3AF" : "#667085", // लोडिंग हो तो रंग बदलें
              display: "flex",
              alignItems: "center",
              cursor: downloadLoading ? 'not-allowed' : 'pointer',
            }}
            title={downloadLoading ? "Downloading..." : "Download as Excel"}
          >
            {/* आप लोडिंग के दौरान एक स्पिनर भी दिखा सकते हैं */}
            {downloadLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="16"
                width="16"
                viewBox="0 0 384 512"
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
            )}
            <Typography fontSize={12} sx={{ ml: 1 }}>Download orders</Typography>
          </IconButton>

          {/* Pending Approval Excel Download Button */}
          <IconButton
            onClick={handleDownloadPendingApprovalExcel}
            disabled={downloadingPendingApproval || loading || isLoadingData}
            sx={{
              border: "1px solid #D0D5DD",
              borderRadius: 2,
              p: 1,
              color: downloadingPendingApproval ? "#9CA3AF" : "#667085",
              display: "flex",
              alignItems: "center",
              cursor: downloadingPendingApproval ? 'not-allowed' : 'pointer',
            }}
            title={downloadingPendingApproval ? "Downloading..." : "Download Pending Approval Orders"}
          >
            {downloadingPendingApproval ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="16"
                width="16"
                viewBox="0 0 384 512"
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
            )}
            <Typography fontSize={12} sx={{ ml: 1 }}>Pending Orders</Typography>
          </IconButton>

          {/* <Button
            variant="contained"
            color="secondary"
            startIcon={exportingPendingApproval ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleExportPendingClientApproval}
            disabled={exportingPendingApproval || loading || isLoadingData}
            sx={{ minWidth: '220px' }}
          >
            {exportingPendingApproval ? 'Exporting...' : 'Pending Approval Design Orders'}
          </Button> */}
          <IconButton
            onClick={handleExportPendingClientApproval}
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
            <Typography fontSize={12} sx={{ ml: 1 }}>Pending approval designs</Typography>
          </IconButton>
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
          // showExcelDownload={true}
          // excelHeaders={excelHeaders}
          // excelData={excelData}
          rowData={formattedRows}
          setCurrentFilterState={setCurrentFilterState}
          defaultFilter={defaultOrderFilter}
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
      <FollowUpDialog
        open={followUpDialogOpen}
        onClose={() => {
          setFollowUpDialogOpen(false);
          setSelectedOrderForFollowUp(null);
        }}
        order={selectedOrderForFollowUp}
        onSuccess={handleFollowUpSuccess}
      />

      <CancelOrderDialog
        cancelDialogOpen={cancelDialogOpen}
        setCancelDialogOpen={setCancelDialogOpen}
        selectedOrderForCancel={selectedOrderForCancel}
        setSelectedOrderForCancel={setSelectedOrderForCancel}
        setCancelRemarks={setCancelRemarks}
        cancelRemarks={cancelRemarks}
        handleCancelConfirm={handleCancelConfirm}
      />
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
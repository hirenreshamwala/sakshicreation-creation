import React, { useEffect, useState, useMemo, useCallback } from "react";
import { IconButton, TableCell } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllQPOrdersForDriverThunk, getQPOrdersByStaffIdThunk } from "@/store/slices/qpOrderSlice";
import CustomTable2 from "@/component/common_component/Table/CustomTable2";
import { getUserData } from "@/utills/utills";
import { orderService } from "@/services/qpOrder.service";
import { toast } from "react-toastify";
import _ from "lodash";
import moment from "moment";
import Loader from "@/component/common_component/loader";

const columns = [
  { id: "orderNo", label: "Order No", value: "orderNo" },
  { id: "partyName", label: "Party Name", value: "party" },
  { id: "market", label: "Market", value: "market" },
  { id: "area", label: "Area", value: "area" },
  { id: "noOfBox", label: "No of Box", value: "noOfPieces" },
  { id: "status", label: "Order Status", value: "status" },
  { id: "driver", label: "Driver", value: "driver" },
  { id: "driverName", label: "Driver Name", value: "driverName" },
  { id: "date", label: "Date", value: "createdAt" },
  { id: "deliveryStatus", label: "Delivery Status", value: "deliveryStatus" },
  { id: "loadingTime", label: "Loading Time" },
  { id: "deliveryTime", label: "Delivery Time" },
  { id: "totalTime", label: "Total Time" },
];

const QPOrdersPage = () => {
  const dispatch = useAppDispatch();
  const { orders, loading, totalCount } = useAppSelector((state) => state.qpOrders);
  const userData = getUserData();

  // Filter states
  const [currentFilterState, setCurrentFilterState] = useState<any>({
    page: 1,
    pageSize: 10,
    search: "",
    filters: {},
    includeCounts: true,
    isPagination: true,
    dateRange: { start: null, end: null },
    startDate: null,
    endDate: null,
    status: ["Completed"], // This is now sent as top-level parameter
  });


  const [appliedFilterState, setAppliedFilterState] = useState<any>({});
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filter options states
  const [filterOptionsData, setFilterOptionsData] = useState<{ [key: string]: string[] }>({});
  const [loadingFilterOptions, setLoadingFilterOptions] = useState(false);
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null);

  // Prevent multiple API calls
  const isLoadingRef = React.useRef(false);

  // Load orders function with filters
  const loadOrders = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log("⚠️ QP API call already in progress, skipping...");
      return;
    }

    setIsLoadingData(true);
    isLoadingRef.current = true;

    try {
      const params = {
        ...currentFilterState,
        isPagination: true,
        includeCounts: true
      };

      console.log("📡 Loading QP orders with params:", params);

      // Check permissions
      const canViewGlobal = userData?.role?.permissions?.all_orders?.view_global;
      const canViewOwn = userData?.role?.permissions?.all_orders?.view_own;

      if (canViewGlobal) {
        await dispatch(getAllQPOrdersForDriverThunk(params));
      } else if (canViewOwn && userData?.id) {
        await dispatch(getQPOrdersByStaffIdThunk({
          id: userData.id,
          filters: params
        }));
      } else {
        // Default to global if no specific permission
        await dispatch(getAllQPOrdersForDriverThunk(params));
      }

      setIsInitialLoad(true);
    } catch (err: any) {
      console.error("❌ Error loading QP orders:", err);
      toast.error(err.message || "Failed to load QP orders");
    } finally {
      setIsLoadingData(false);
      isLoadingRef.current = false;
    }
  }, [dispatch, currentFilterState, userData]);

  // Function to load filter options
  const loadFilterOptions = async (field: string) => {
    setLoadingFilterOptions(true);
    try {
      // Add staffId filter if user can only view own orders
      const extraFilters = userData?.role?.permissions?.all_orders?.view_own &&
        !userData?.role?.permissions?.all_orders?.view_global
        ? { staffId: userData.id }
        : {};

      const filterPayload = {
        ...currentFilterState.filters,
        ...extraFilters,
        startDate: currentFilterState.startDate,
        endDate: currentFilterState.endDate,
        status: currentFilterState.status || ["Completed"],
      };

      console.log(`🔍 Loading QP filter options for ${field}:`, filterPayload);

      const response = await orderService.searchFilterOptions(field, "", filterPayload);

      if (response.success && response.data) {
        setFilterOptionsData(prev => ({
          ...prev,
          [field]: response.data || []
        }));
      }
    } catch (error: any) {
      console.error(`Error loading QP filter options for ${field}:`, error);
      toast.error(`Failed to load filter options for ${field}`);
    } finally {
      setLoadingFilterOptions(false);
    }
  };

  // Handle filter field selection
  const handleFilterFieldSelect = useCallback(async (field: string | null) => {
    console.log("QP handleFilterFieldSelect called with:", field);
    setSelectedFilterField(field);

    if (field && !filterOptionsData[field]) {
      try {
        await loadFilterOptions(field);
      } catch (error) {
        console.error("Error loading QP filter options:", error);
        toast.error(`Failed to load options for ${field}`);
      }
    }

    return Promise.resolve();
  }, [filterOptionsData, currentFilterState, userData]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: { [key: string]: string[] }) => {
    console.log("QP Filters changed to:", newFilters);
    setCurrentFilterState((prev: any) => ({
      ...prev,
      filters: newFilters,
      page: 1,
    }));
  }, []);

  // Effect to load orders when filters change
  useEffect(() => {
    const isSame = _.isEqual(appliedFilterState, currentFilterState);
    if (!isSame) {
      console.log("🔄 QP Filter state changed, loading orders...");

      const timer = setTimeout(() => {
        loadOrders();
        setAppliedFilterState(currentFilterState);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentFilterState, appliedFilterState, loadOrders]);

  // Effect for initial load
  useEffect(() => {
    if (userData && !isInitialLoad) {
      console.log("🚀 Initial load started for QP orders");
      loadOrders();
    }
  }, [userData, isInitialLoad, loadOrders]);

  // Format time functions
  const formatTimeDifference = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return "N/A";

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffInMs = end.getTime() - start.getTime();

    if (diffInMs < 0) return "Invalid Time";

    const diffInSeconds = Math.floor(diffInMs / 1000);
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateLoadingTime = (order: any) => {
    const { loadingStartDate, deliveryStartTime } = order;
    if (loadingStartDate && deliveryStartTime) {
      return formatTimeDifference(loadingStartDate, deliveryStartTime);
    }
    if (loadingStartDate && !deliveryStartTime) {
      const diff = formatTimeDifference(loadingStartDate, new Date().toISOString());
      return `${diff} (Loading)`;
    }
    return "N/A";
  };

  const calculateDeliveryTime = (order: any) => {
    const { deliveryStartTime, deliveryEndTime } = order;
    if (deliveryStartTime && deliveryEndTime) {
      return formatTimeDifference(deliveryStartTime, deliveryEndTime);
    }
    if (deliveryStartTime && !deliveryEndTime) {
      const diff = formatTimeDifference(deliveryStartTime, new Date().toISOString());
      return `${diff} (In Transit)`;
    }
    return "N/A";
  };

  const calculateTotalTime = (order: any) => {
    const { loadingStartDate, deliveryEndTime } = order;
    if (loadingStartDate && deliveryEndTime) {
      return formatTimeDifference(loadingStartDate, deliveryEndTime);
    }
    if (loadingStartDate && !deliveryEndTime) {
      const diff = formatTimeDifference(loadingStartDate, new Date().toISOString());
      return `${diff} (Ongoing)`;
    }
    return "N/A";
  };

  // Format rows for table
  const formattedRows = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];

    return orders.map((order: any) => ({
      _id: order._id,
      id: order._id,
      orderNo: order.orderNo || "N/A",
      party: {
        partyName: order.party?.partyName || "N/A",
        address: order.party?.address || {}
      },
      market: order.party?.address?.marketName?.marketName || "N/A",
      area: order.party?.address?.area?.area || "N/A",
      noOfPieces: order.noOfPieces || "N/A",
      status: order.status || "N/A",
      driver: order.driver?.email?.split("@")[0] || "Not Assigned",
      driverName: order.driver
        ? `${order.driver.firstName || ""} ${order.driver.lastName || ""}`.trim() || "N/A"
        : "N/A",
      createdAt: order.createdAt || new Date().toISOString(),
      deliveryStatus: order.deliveryStatus || "N/A",
      loadingStartDate: order.loadingStartDate,
      deliveryStartTime: order.deliveryStartTime,
      deliveryEndTime: order.deliveryEndTime,
      company: order.companyName?.companyName || "N/A",
      partyName: order.party?.partyName || "N/A",
      createdDate: order.createdAt ? moment(order.createdAt).format("DD-MM-YYYY") : "N/A",
      orderStatus: order.status || "N/A",
      driverEmail: order.driver?.email || "N/A",
    }));
  }, [orders]);


  const handleExcelDownload = async () => {
  try {
    // Extract all filter values from currentFilterState.filters
    const filterEntries = Object.entries(currentFilterState.filters || {});
    const extractedFilters: any = {};
    
    filterEntries.forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        // Take the first value from each filter array
        extractedFilters[key] = value[0];
      }
    });

    // Create payload with all current filters
    const payload = {
      // Staff ID for permission-based filtering
      staffId: userData?.id || null,
      
      // Date range
      startDate: currentFilterState.startDate 
        ? new Date(currentFilterState.startDate).toISOString() 
        : null,
      endDate: currentFilterState.endDate 
        ? new Date(currentFilterState.endDate).toISOString() 
        : null,
      
      // Status filter (array)
      status: currentFilterState.status || ["Completed"],
      
      // Search query
      search: currentFilterState.search || "",
      
      // Include extracted filters
      ...extractedFilters,
    };

    // Remove undefined/null/empty values
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== null && value !== undefined && value !== '';
      })
    );

    console.log("📊 Exporting QP orders with payload:", cleanPayload);

    // Call the export service
    const blob = await orderService.exportDriverToExcel(cleanPayload);

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `QP_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
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
  }
};

  // Render row function
  const renderRow = (row: any, index: number) => (
    <>
      <TableCell>QP-{row.orderNo || "N/A"}</TableCell>
      <TableCell>{row.party?.partyName || "N/A"}</TableCell>
      <TableCell>{row.market || "N/A"}</TableCell>
      <TableCell>{row.area || "N/A"}</TableCell>
      <TableCell>{row.noOfPieces || "N/A"}</TableCell>
      <TableCell>{row.status || "N/A"}</TableCell>
      <TableCell>{row.driver || "Not Assigned"}</TableCell>
      <TableCell>{row.driverName || "N/A"}</TableCell>
      <TableCell>
        {row.createdAt
          ? new Date(row.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          : "N/A"}
      </TableCell>
      <TableCell>{row.deliveryStatus || "N/A"}</TableCell>
      <TableCell>{calculateLoadingTime(row)}</TableCell>
      <TableCell>{calculateDeliveryTime(row)}</TableCell>
      <TableCell>{calculateTotalTime(row)}</TableCell>
    </>
  );

  // Show loading while initial data is being loaded
  if ((loading || isLoadingData) && !isInitialLoad && orders.length === 0) {
    return <div><Loader /></div>;
  }

  return (
    <>
      <IconButton
        onClick={handleExcelDownload}
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
        {/* <Typography fontSize={12}>Download excel</Typography>  */}
      </IconButton>
      <CustomTable2
        showDatePicker={false}
        tableHeader={columns}
        showFillter={true}
        showSearch={true}
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
      />
    </>
  );
};

export default QPOrdersPage;

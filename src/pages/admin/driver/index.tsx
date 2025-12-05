import React, { useEffect, useState, useMemo, useCallback } from "react";
import { TableCell } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllQPOrdersForDriverThunk, getQPOrdersByStaffIdThunk } from "@/store/slices/qpOrderSlice";
import CustomTable2 from "@/component/common_component/Table/CustomTable2";
import { getUserData } from "@/utills/utills";
import { orderService } from "@/services/qpOrder.service";
import { toast } from "react-toastify";
import _ from "lodash";
import moment from "moment";

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
  
  // Excel data
  const excelHeaders = useMemo(() => [
    "Order Number",
    "Party Name",
    "Market",
    "Area",
    "No of Box",
    "Order Status",
    "Driver",
    "Driver Name",
    "Date",
    "Delivery Status",
    "Loading Time",
    "Delivery Time",
    "Total Time",
  ], []);
  
  const excelData = useMemo(() => {
    return formattedRows.map((order) => ({
      "Order Number": `QP-${order.orderNo}` || "N/A",
      "Party Name": order.party?.partyName || "N/A",
      "Market": order.market || "N/A",
      "Area": order.area || "N/A",
      "No of Box": order.noOfPieces || "N/A",
      "Order Status": order.status || "N/A",
      "Driver": order.driver || "N/A",
      "Driver Name": order.driverName || "N/A",
      "Date": order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : "N/A",
      "Delivery Status": order.deliveryStatus || "N/A",
      "Loading Time": calculateLoadingTime(order),
      "Delivery Time": calculateDeliveryTime(order),
      "Total Time": calculateTotalTime(order),
    }));
  }, [formattedRows]);
  
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
    return <div>Loading QP Orders...</div>;
  }
  
  return (
    <CustomTable2
      showDatePicker={false}
      tableHeader={columns}
      showFillter={true}
      showSearch={true}
      title="Completed Orders"
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
    />
  );
};

export default QPOrdersPage;

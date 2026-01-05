import React, { useEffect, useState, useMemo } from "react"
import {
  Avatar, Box, IconButton, TableCell, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Tooltip
} from "@mui/material"
import BasicTable from "@/component/common_component/Table/themetable"
import { useRouter } from "next/router"
import ThemeButton from "@/component/common_component/themebutton"
import { useAppDispatch, useAppSelector } from "@/store"
import { authService } from "@/services/auth.service"
import FilterDropdown from "@/component/fillter"
import DateRangePicker from "@/component/daterangepicker"
import { FiSearch, FiDownload } from "react-icons/fi"
import { InputBase } from "@mui/material"
import { getDisplayStatus } from "@/utills/utills"
import { getAllQPOrdersThunk, getQPOrdersByStaffIdThunk, markOrderAsUrgentThunk } from "@/store/slices/qpOrderSlice"
import { toast } from "react-toastify"
import moment from "moment"
import Loader from "../common_component/loader"
import { ExpandedRowForm } from "./expandableRows/QpOrderRows"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import { StaticCompanyOptions } from "@/constants"
import { getAllInventoryThunk } from "@/store/slices/inventorySlice"
import { Label } from "@mui/icons-material"
import ComplainDialogue from "@/pages/admin/all-complains/ComplainDialogue"
import AddQPOrderDialog from "./QpOrderDialog"
import Swal from 'sweetalert2';
import * as XLSX from "xlsx";

type OrderRow = {
  _id: string;
  orderNo: string;
  companyName: {
    companyName: string;
    avatar?: string;
  };
  party: {
    partyName: string;
  };
  orderFrom: string;
  date: string;
  size?: {
    size: string;
  };
  ply?: {
    ply: string;
  };
  uom?: {
    uom: string
  }
  deckalCalculation?: string;
  deckal?: string;
  gsm?: string;
  noOfPieces?: number;
  ratePerPiece?: number;
  amount?: string;
  kgPerUnit?: string;
  totalKg?: string;
  kantan?: {
    kantanName: string;
  };
  kantanPerUnit?: string;
  totalKantan?: {
    reel: string;
    inch: string;
  };
  kantanDeckal?: string;
  salesRemark?: string;
  createdAt: string;
  createdBy: {
    firstName: string
    lastName: string
  }
  status: string
  designerStatus?: string
  printerStatus?: string
  binderStatus?: string
  bookletBinderStatus?: string
  designer?: { _id: string }
  printer?: { _id: string }
  binder?: { _id: string }
  bookletBinder?: { _id: string }
  unitNo?: string
  deliveryDate?: string
  startDate?: string
  dyeNumber?: string
  dyeSize?: string
  glue?: string
  wire?: string
  dyeRemark?: string
  godownRemark?: string
  factoryRemark?: string
  orderdata?: {
    ply?: string;
    length?: string;
    height?: string;
    width?: string;
    paper1GSM?: string;
    paper2GSM?: string;
    paper3GSM?: string;
    deckal?: string;
  }
  isUrgent?: boolean;
}

const AdminManagerSalesView = () => {
  const [open, setOpen] = React.useState(false)
  const [selectedRow, setSelectedRow] = useState<OrderRow | null>(null)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [editData, setEditData] = useState<OrderRow | null>(null)
  const { user } = useAppSelector((state) => state.auth)

  const { companies } = useAppSelector((state) => state.company)
  const { orders, loading, error, totalCount, pagination } = useAppSelector((state) => state.qpOrders)
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({})

  const canViewGlobal = user?.role?.permissions?.all_orders?.view_global;
  const canViewOwn = user?.role?.permissions?.all_orders?.view_own;
  const canCreate = user?.role?.permissions?.all_orders?.create;
  const canStatus = user?.role?.permissions?.all_orders?.status;
  const { companyName, staffId, startDate: st, endDate: ed, party } = router.query

  const columns = [
    { id: "orderNo", label: "Order No" },
    { id: "companyName", label: "Company Name" },
    { id: "orderDate", label: "Order Date" },
    { id: "size", label: "Size" },
    { id: "ply", label: "Ply" },
    { id: "party", label: "Party Name" },
    { id: "deckal", label: "Deckal" },
    { id: "gsm", label: "GSM" },
    { id: "pcs", label: "PCS" },
    { id: "created", label: "" },
    { id: "kgs", label: "KGS" },
    { id: "rate", label: "RATE" },
    { id: "amount", label: "amount" },
    { id: "status", label: "Status" },
    { id: "kantan", label: "kantan" },
    { id: "urgent", label: "Urgent" },
    { id: "actions", label: "Actions" },
  ]

  const allFilterableColumns = [
    { id: "orderNo", label: "Order No" },
    { id: "companyName", label: "Company Name" },
    { id: "party", label: "Party Name" },
    { id: "orderDate", label: "Order Date" },
    { id: "status", label: "Status" },
    { id: "ply", label: "Ply" },
    { id: "size", label: "Size" },
    { id: "uom", label: "Unit of Measurement" },
    { id: "paperGSM", label: "Paper GSM" },
    { id: "gsm", label: "GSM" },
    { id: "deckalCalculation", label: "Cal Deckal" },
    { id: "deckal", label: "Deckal" },
    { id: "noOfPieces", label: "Piece No" },
    { id: "ratePerPiece", label: "Rate/Piece" },
    { id: "amount", label: "Amount" },
    { id: "kgPerUnit", label: "KG Per Unit" },
    { id: "totalKg", label: "Total KG" },
    { id: "kantan", label: "Kantan" },
    { id: "kantanPerUnit", label: "Kantan/Piece" },
    { id: "totalKantan", label: "Total Kantan" },
    { id: "kantanDeckal", label: "Kantan Dec" },
    { id: "salesRemark", label: "Sales Remarks" },
    { id: "unitNo", label: "Unit No" },
    { id: "startDate", label: "Start Date" },
    { id: "deliveryDate", label: "Delivery Date" },
    { id: "dyeNumber", label: "Dye Number" },
    { id: "dyeSize", label: "Dye Sheet Size" },
    { id: "glue", label: "Glue KG" },
    { id: "wire", label: "Wire KG" },
    { id: "dyeRemark", label: "Dye Remark" },
    { id: "godownRemark", label: "Godown Remark" },
    { id: "factoryRemark", label: "Factory Remark" },
  ]

  const refreshData = () => {
    if (canViewGlobal)
      dispatch(getAllQPOrdersThunk({ companyName, staffId, startDate: st, endDate: ed, party }))
    else if (canViewOwn && user?.id)
      dispatch(getQPOrdersByStaffIdThunk({
        id: user.id,
        filters: {},
      }))
  };

  useEffect(() => {
    dispatch(getAllInventoryThunk());
  }, []);

  const handleRepeatOrder = (rowData: OrderRow) => {
    const repeatOrderData = {
      ...rowData,
      _id: undefined,
      orderNo: undefined,
      createdAt: new Date().toISOString(),
      status: "pending",
      designerStatus: undefined,
      printerStatus: undefined,
      binderStatus: undefined,
      bookletBinderStatus: undefined,
      unitNo: undefined,
      startDate: undefined,
      deliveryDate: undefined,
      dyeNumber: undefined,
      dyeSize: undefined,
      glue: undefined,
      wire: undefined,
      dyeRemark: undefined,
      godownRemark: undefined,
      factoryRemark: undefined,
    };

    setEditData(repeatOrderData);
    setOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return moment(date).format('DD/MM/YY')
    } catch {
      return dateString
    }
  }

  // Prepare Excel headers (table में जैसे कॉलम दिख रहे हैं वैसे ही)
  const excelHeaders = useMemo(() => [
    "Order No",
    "Company Name",
    "Order Date",
    "Size",
    "Ply",
    "Party Name",
    "Deckal",
    "GSM",
    "PCS",
    "",
    "KGS",
    "RATE",
    "Amount",
    "Status",
    "Kantan",
    "Urgent"
  ], []);

  // Filtered orders जो टेबल में दिख रहे हैं
  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchesDateRange =
        (!startDate || new Date(order.createdAt) >= new Date(startDate).setHours(0, 0, 0, 0)) &&
        (!endDate || new Date(order.createdAt) <= new Date(endDate).setHours(23, 59, 59, 999))

      // Format size and paperGSM for search (same as displayed in table)
      const displaySize = order.size?.size || `${order.orderdata?.length || "N/A"} x ${order.orderdata?.width || "N/A"} x ${order.orderdata?.height || "N/A"}`
      const displayPaperGSM = `${order.orderdata?.paper1GSM || "N/A"} x ${order.orderdata?.paper2GSM || "N/A"} x ${order.orderdata?.paper3GSM || "N/A"}`

      const matchesSearch = searchQuery
        ? order.orderNo?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.companyName?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.party?.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderdata?.ply?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        displaySize.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.uom?.uom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        displayPaperGSM.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.gsm?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deckalCalculation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderdata?.deckal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.noOfPieces?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.ratePerPiece?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.amount?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.kgPerUnit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.totalKg?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.kantan?.kantanName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.kantanPerUnit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.totalKantan && `${order.totalKantan.reel} reel ${order.totalKantan.inch} inch`.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.kantanDeckal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.salesRemark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.status?.toLowerCase().includes(searchQuery.toLowerCase())
        : true

      const matchesFilters = Object.keys(filters).every((columnId) => {
        if (filters[columnId].length === 0) return true
        let value: string | number | undefined

        switch (columnId) {
          case "orderNo":
            value = order.orderNo
            break
          case "companyName":
            value = order.companyName?.companyName
            break
          case "party":
            value = order.party?.partyName
            break
          case "orderDate":
            value = formatDate(order.createdAt) || "N/A"
            break
          case "status":
            value = order.status
            break
          case "ply":
            value = order.orderdata?.ply
            break
          case "size":
            // Format size same as displayed in table
            value = order.size?.size || `${order.orderdata?.length || "N/A"} x ${order.orderdata?.width || "N/A"} x ${order.orderdata?.height || "N/A"}`
            break
          case "uom":
            value = order.orderdata?.uom
            break
          case "paperGSM":
            // Format paper GSM same as displayed in table
            value = `${order.orderdata?.paper1GSM || "N/A"} x ${order.orderdata?.paper2GSM || "N/A"} x ${order.orderdata?.paper3GSM || "N/A"}`
            break
          case "gsm":
            value = order.gsm
            break
          case "deckalCalculation":
            value = order.deckalCalculation
            break
          case "deckal":
            value = order.orderdata?.deckal
            break
          case "noOfPieces":
            value = order.noOfPieces
            break
          case "ratePerPiece":
            value = order.ratePerPiece
            break
          case "amount":
            value = order.amount
            break
          case "kgPerUnit":
            value = order.kgPerUnit
            break
          case "totalKg":
            value = order.totalKg
            break
          case "kantan":
            value = order.kantan?.kantanName
            break
          case "kantanPerUnit":
            value = order.kantanPerUnit
            break
          case "totalKantan":
            value = order.totalKantan ? `${order.totalKantan.reel} reel ${order.totalKantan.inch} inch` : "N/A"
            break
          case "kantanDeckal":
            value = order.kantanDeckal
            break
          case "salesRemark":
            value = order.salesRemark
            break
          case "unitNo":
            value = order.unitNo
            break
          case "startDate":
            value = order.startDate ? formatDate(order.startDate) : "N/A"
            break
          case "deliveryDate":
            value = order.deliveryDate ? formatDate(order.deliveryDate) : "N/A"
            break
          case "dyeNumber":
            value = order.dyeNumber
            break
          case "dyeSize":
            value = order.dyeSize
            break
          case "glue":
            value = order.glue
            break
          case "wire":
            value = order.wire
            break
          case "dyeRemark":
            value = order.dyeRemark
            break
          case "godownRemark":
            value = order.godownRemark
            break
          case "factoryRemark":
            value = order.factoryRemark
            break
        }
        return value && filters[columnId].includes(value.toString())
      })

      return matchesDateRange && matchesSearch && matchesFilters
    })
  }, [orders, startDate, endDate, searchQuery, filters])

  // Excel डेटा तैयार करें (filteredOrders का उपयोग करें जो टेबल में दिख रहे हैं)
  const prepareExcelData = useMemo(() => {
    return filteredOrders.map((order: OrderRow) => {
      const urgentStatus = order.isUrgent ? "Yes" : "No";

      return {
        "Order No": `QP-${order.orderNo || "N/A"}`,
        "Company Name": order.companyName?.companyName || "N/A",
        "Order Date": formatDate(order.createdAt) || "N/A",
        "Size": `${order.orderdata?.length || "N/A"} x ${order.orderdata?.width || "N/A"} x ${order.orderdata?.height || "N/A"}`,
        "Ply": order.orderdata?.ply || "N/A",
        "Party Name": order.party?.partyName || "N/A",
        "Deckal": order.orderdata?.deckal || "N/A",
        "GSM": `${order.orderdata?.paper1GSM || "N/A"} x ${order.orderdata?.paper2GSM || "N/A"} x ${order.orderdata?.paper3GSM || "N/A"}`,
        "PCS": order.noOfPieces?.toString() || "N/A",
        "": order.createdBy?.firstName?.[0] || "N/A", // Empty column header but with data
        "KGS": order.totalKg || "N/A",
        "RATE": order.ratePerPiece?.toString() || "N/A",
        "Amount": order.amount || "N/A",
        "Status": order.status || "N/A",
        "Kantan": order.kantan?.kantanName || "N/A",
        "Urgent": urgentStatus,
      };
    });
  }, [filteredOrders]); // केवल filteredOrders पर निर्भर

  // Excel डाउनलोड फंक्शन
  const handleExcelDownload = () => {
    if (filteredOrders.length === 0) {
      toast.warning("No data to export");
      return;
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(prepareExcelData);

    // Add headers to the worksheet
    XLSX.utils.sheet_add_aoa(worksheet, [excelHeaders], { origin: "A1" });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "QP Orders");

    // Download file
    const fileName = `QP_Orders_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success(`Exported ${filteredOrders.length} records to Excel`);
  };

  const handleToggleUrgent = async (rowData: OrderRow) => {
    const newUrgentStatus = !rowData.isUrgent;
    const actionText = newUrgentStatus ? 'mark as urgent' : 'unmark as urgent';

    const result = await Swal.fire({
      title: `${newUrgentStatus ? 'Mark as Urgent' : 'Unmark as Urgent'}?`,
      text: `Are you sure you want to ${actionText} order QP-${rowData.orderNo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newUrgentStatus ? '#ff6b6b' : '#6B7280',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${actionText}!`,
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(markOrderAsUrgentThunk({
          orderId: rowData._id,
          isUrgent: newUrgentStatus
        })).unwrap();

        Swal.fire(
          `Order ${newUrgentStatus ? 'Marked as Urgent' : 'Unmarked'}!`,
          `Order QP-${rowData.orderNo} has been ${newUrgentStatus ? 'marked as urgent' : 'unmarked'}.`,
          'success'
        );
        refreshData();
      } catch (error: any) {
        Swal.fire(
          'Error!',
          error || `Failed to ${actionText} order`,
          'error'
        );
      }
    }
  };

  const getUniqueValues = useMemo(() => {
    if (!selectedFilterField) return []
    const columnId = allFilterableColumns.find(col => col.label === selectedFilterField)?.id
    if (!columnId) return []

    const values = orders.map((order: any) => {
      let value: string | number | undefined
      switch (columnId) {
        case "orderNo":
          value = order.orderNo
          break
        case "companyName":
          value = order.companyName?.companyName
          break
        case "party":
          value = order.party?.partyName
          break
        case "orderDate":
          value = formatDate(order.createdAt) || "N/A"
          break
        case "status":
          value = order.status
          break
        case "ply":
          value = order.orderdata?.ply
          break
        case "size":
          // Format size same as displayed in table: "length x width x height"
          value = order.size?.size || `${order.orderdata?.length || "N/A"} x ${order.orderdata?.width || "N/A"} x ${order.orderdata?.height || "N/A"}`
          break
        case "uom":
          value = order.orderdata?.uom
          break
        case "paperGSM":
          // Format paper GSM same as displayed in table: "paper1GSM x paper2GSM x paper3GSM"
          value = `${order.orderdata?.paper1GSM || "N/A"} x ${order.orderdata?.paper2GSM || "N/A"} x ${order.orderdata?.paper3GSM || "N/A"}`
          break
        case "gsm":
          value = order.gsm
          break
        case "deckalCalculation":
          value = order.deckalCalculation
          break
        case "deckal":
          value = order.orderdata?.deckal
          break
        case "noOfPieces":
          value = order.noOfPieces
          break
        case "ratePerPiece":
          value = order.ratePerPiece
          break
        case "amount":
          value = order.amount
          break
        case "kgPerUnit":
          value = order.kgPerUnit
          break
        case "totalKg":
          value = order.totalKg
          break
        case "kantan":
          value = order.kantan?.kantanName
          break
        case "kantanPerUnit":
          value = order.kantanPerUnit
          break
        case "totalKantan":
          value = order.totalKantan ? `${order.totalKantan.reel} reel ${order.totalKantan.inch} inch` : "N/A"
          break
        case "kantanDeckal":
          value = order.kantanDeckal
          break
        case "salesRemark":
          value = order.salesRemark
          break
        case "unitNo":
          value = order.unitNo
          break
        case "startDate":
          value = order.startDate ? formatDate(order.startDate) : "N/A"
          break
        case "deliveryDate":
          value = order.deliveryDate ? formatDate(order.deliveryDate) : "N/A"
          break
        case "dyeNumber":
          value = order.dyeNumber
          break
        case "dyeSize":
          value = order.dyeSize
          break
        case "glue":
          value = order.glue
          break
        case "wire":
          value = order.wire
          break
        case "dyeRemark":
          value = order.dyeRemark
          break
        case "godownRemark":
          value = order.godownRemark
          break
        case "factoryRemark":
          value = order.factoryRemark
          break
      }
      return value?.toString() || "N/A"
    })

    return Array.from(new Set(values)).filter((v) => v !== "N/A").sort()
  }, [selectedFilterField, orders])

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk())
  }, [])

  useEffect(() => {
    const token = authService.getToken()
    if (!token) {
      router.push("/login")
      return
    }
    if (!orders.length) {
      refreshData()
    }
  }, [dispatch, router, canViewGlobal, canViewOwn, user?.id])

  const renderExpandedRow = (row: OrderRow) => {
    if (!canViewGlobal) return null;
    return <ExpandedRowForm row={row} setEditData={setEditData} setOpen={setOpen} />;
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, dispatch]);

  if (loading) return <Loader />

  const renderField = (label: string, value: string | number | JSX.Element) => (
    <Box display="flex" justifyContent="flex-start" alignItems="center" minHeight={40} gap={0.5}>
      <Typography variant="body2" fontWeight={500} color="#111827" sx={{ minWidth: '180px' }}>
        {label}:
      </Typography>
      <Typography fontSize="14px" color="#6B7280">
        {value}
      </Typography>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => setStartDate(date as any)}
            onEndDateChange={(date) => setEndDate(date as any)}
          />
          <ThemeButton
            onClick={() => {
              setStartDate(null)
              setEndDate(null)
            }}
          >
            Clear Range
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
            filterOptions={allFilterableColumns
              .filter((col) => col.id !== "actions")
              .map((col) => col.label)}
            uniqueValues={selectedFilterField ? getUniqueValues : []}
            onFiltersChange={(newFilters) => {
              const idBasedFilters: { [key: string]: string[] } = {}
              Object.entries(newFilters).forEach(([label, values]) => {
                const columnId = allFilterableColumns.find(col => col.label === label)?.id
                if (columnId) {
                  idBasedFilters[columnId] = values
                }
              })
              setFilters(idBasedFilters)
            }}
            filters={Object.keys(filters).reduce((acc, columnId) => {
              const columnLabel = allFilterableColumns.find(col => col.id === columnId)?.label
              if (columnLabel) {
                acc[columnLabel] = filters[columnId]
              }
              return acc
            }, {} as { [key: string]: string[] })}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />

          {/* Excel Download Button - शो करें अगर filteredOrders में डेटा है */}
          {filteredOrders.length > 0 && (
            <Tooltip title={`Download ${filteredOrders.length} filtered records as Excel`}>
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
            </Tooltip>
          )}

          {canCreate && (
            <ThemeButton
              onClick={() => {
                setEditData(null)
                setOpen(true)
              }}
            >
              + Add New Order
            </ThemeButton>
          )}
        </Box>
      </Box>

      <Box py={2}>
        <BasicTable
          id={true}
          showDatePicker={false}
          tableHeader={columns}
          showFillter={false}
          showSearch={false}
          showExcelDownload={false} // BasicTable का एक्सेल डाउनलोड बंद करें
          title="QP-ORDERS"
          rowData={filteredOrders as any}
          totalCount={totalCount}
          pagination={pagination}
          renderExpandedRow={canViewGlobal && !canStatus ? renderExpandedRow : undefined}
          renderRow={(row: any) => {
            return (<>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography fontSize="14px" color="#6B7280">
                    QP-{row.orderNo || "N/A"}
                  </Typography>

                  <Box display="flex" flexDirection="column" gap={0.5} ml={1}>
                    {row.reworkDesignerFiles?.length > 0 && !row.approveDesign && (
                      <Typography
                        fontSize="10px"
                        color="#2563eb"
                        sx={{
                          backgroundColor: '#dbeafe',
                          px: 1,
                          py: 0.25,
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}
                      >
                        Rework Submitted
                      </Typography>
                    )}

                    {row.designerFiles?.length > 0 && !row.approveDesign &&
                      !row.reworkDesignFiles?.length && !row.reworkDesignerFiles?.length && (
                        <Typography
                          fontSize="10px"
                          color="#f59e0b"
                          sx={{
                            backgroundColor: '#fef3c7',
                            px: 1,
                            py: 0.25,
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}
                        >
                          Files to Review
                        </Typography>
                      )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar src={row.companyName?.avatar} sx={{ width: 32, height: 32 }} alt={row.companyName?.companyName || "Company"} />
                </Box>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {formatDate(row.createdAt) || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {`${row.orderdata?.length || "N/A"} x ${row.orderdata?.width || "N/A"} x ${row.orderdata?.height || "N/A"}`}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {`${row.orderdata?.ply || "N/A"}`}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.party?.partyName || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.orderdata?.deckal}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {`${row.orderdata?.paper1GSM || "N/A"} x ${row.orderdata?.paper2GSM || "N/A"} x ${row.orderdata?.paper3GSM || "N/A"}`}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.noOfPieces}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.createdBy?.firstName?.[0]}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.totalKg}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.ratePerPiece}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.amount}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.status}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.kantan?.kantanName}
                </Typography>
              </TableCell>
              <TableCell>
                <ThemeButton
                  size="small"
                  onClick={() => handleToggleUrgent(row)}
                  sx={{
                    backgroundColor: row.isUrgent ? '#6B7280' : '#ff6b6b',
                    '&:hover': {
                      backgroundColor: row.isUrgent ? '#4B5563' : '#dc2626',
                    }
                  }}
                >
                  {row.isUrgent ? 'Unmark Urgent' : 'Mark as Urgent'}
                </ThemeButton>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1} flexWrap="no-wrap">
                  {canCreate && (
                    <ThemeButton
                      size="small"
                      onClick={() => handleRepeatOrder(row)}
                    >
                      Repeat Order
                    </ThemeButton>
                  )}
                </Box>
              </TableCell>
            </>);
          }}
        />
      </Box>

      {
        open && (
          <>
            {editData === null ? (
              <AddQPOrderDialog
                company={companies.find((item) => item.companyName === StaticCompanyOptions[1])?._id}
                open={open}
                onClose={() => {
                  setOpen(false);
                  refreshData();
                }}
                refreshData={refreshData}
                orderNo={orders[0]?.orderNo}
              />
            ) : (
              <AddQPOrderDialog
                company={companies.find((item) => item.companyName === StaticCompanyOptions[1])?._id}
                open={open}
                onClose={() => {
                  setOpen(false);
                  refreshData();
                }}
                editData={editData}
                refreshData={refreshData}
              />
            )}
          </>
        )
      }
    </>
  );
};

export default AdminManagerSalesView;
import React, { useEffect, useState, useMemo } from "react"
import { Avatar, Box, IconButton, TableCell, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material"
import BasicTable from "@/component/common_component/Table/themetable"
import { useRouter } from "next/router"
import ThemeButton from "@/component/common_component/themebutton"
import { useAppDispatch, useAppSelector } from "@/store"
import { authService } from "@/services/auth.service"
import FilterDropdown from "@/component/fillter"
import DateRangePicker from "@/component/daterangepicker"
import { FiSearch } from "react-icons/fi"
import { InputBase } from "@mui/material"
import { getDisplayStatus } from "@/utills/utills"
import { getAllQPOrdersThunk, getQPOrdersByStaffIdThunk } from "@/store/slices/qpOrderSlice"
import { toast } from "react-toastify"
import moment from "moment"
import { StatusCell } from "./StatusCell"
import Loader from "../common_component/loader"
import { ExpandedRowForm } from "./expandableRows/QpOrderRows"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import { StaticCompanyOptions } from "@/constants"
import { getAllInventoryThunk } from "@/store/slices/inventorySlice"
import { Label } from "@mui/icons-material"
import ComplainDialogue from "@/pages/admin/all-complains/ComplainDialogue"
import AddQPOrderDialog from "./QpOrderDialog"

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
}

const AdminManagerSalesView = () => {
  const [open, setOpen] = React.useState(false)
  const [selectedRow, setSelectedRow] = useState<OrderRow | null>(null)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [editData, setEditData] = useState<OrderRow | null>(null)
  const { user } = useAppSelector((state) => state.auth)
  const { allInventory } = useAppSelector(state => state.inventory);

  const { companies } = useAppSelector((state) => state.company)
  const { orders, loading, error, totalCount, pagination } = useAppSelector((state) => state.qpOrders)
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({})
  const [complainOpen, setComplainOpen] = useState(false);
  const [selectedOrderForComplain, setSelectedOrderForComplain] = useState<OrderRow | null>(null);

  const canViewGlobal = user?.role?.permissions?.all_orders?.view_global;
  const canViewOwn = user?.role?.permissions?.all_orders?.view_own;
  const canCreate = user?.role?.permissions?.all_orders?.create;
  const canStatus = user?.role?.permissions?.all_orders?.status;
  const { companyName, staffId, startDate: st, endDate: ed, party } = router.query

  const columns = [
    { id: "orderNo", label: "Order No" },
    { id: "companyName", label: "Company Name" },
    { id: "party", label: "Party Name" },
    { id: "orderDate", label: "Order Date" },
    { id: "status", label: "Status" },
    { id: "details", label: "Details" },
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
    if (canViewGlobal) {
      dispatch(getAllQPOrdersThunk({ companyName, staffId, startDate: st, endDate: ed, party }))
    } else if (canViewOwn && user?.id) {
      dispatch(getQPOrdersByStaffIdThunk(user?.id))
    }
  };

  useEffect(() => {
    dispatch(getAllInventoryThunk());
  }, []);

  const handleComplainClick = (rowData: OrderRow) => {
    setSelectedOrderForComplain(rowData);
    setComplainOpen(true);
  };

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

  const handleViewDetails = (row: OrderRow) => {
    setSelectedRow(row);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return moment(date).format('DD/MM/YY')
    } catch {
      return dateString
    }
  }

  // Prepare Excel headers (full set to match excelData)
  const excelHeaders = useMemo(() => [
    "Order No",
    "Company Name",
    "Party Name",
    "Order Date",
    "Ply",
    "Unit of Measurement",
    "Size",
    "Paper GSM",
    "GSM",
    "Cal Deckal",
    "Deckal",
    "Piece No",
    "Cutting length",
    "sheet to cut",
    "Rate/Piece",
    "Amount",
    "KG Per Unit",
    "Total KG",
    "Kantan",
    "Kantan/Piece",
    "Total Kantan",
    "Kantan Dec",
    "Sales Remarks",
    "Status",
    "Unit No",
    "Start Date",
    "Delivery Date",
    "Dye Number",
    "Dye Sheet Size",
    "Glue KG",
    "Wire KG",
    "Dye Remark",
    "Godown Remark",
    "Factory Remark",
    "Actual no of piece",
  ], []);

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

  // Prepare Excel data
  const excelData = useMemo(() => {
    return filteredOrders.map((order: OrderRow) => ({
      "Order No": `QP-${order.orderNo || "N/A"}`,
      "Company Name": order.companyName?.companyName || "N/A",
      "Party Name": order.party?.partyName || "N/A",
      "Order Date": formatDate(order.createdAt) || "N/A",
      Ply: order.orderdata?.ply || "N/A",
      "Unit of Measurement": order.orderdata?.uom || "N/A",
      Size: order.size?.size || `${order.orderdata?.length || "N/A"} x ${order.orderdata?.width || "N/A"} x ${order.orderdata?.height || "N/A"}`,
      "Paper GSM": `${order.orderdata?.paper1GSM || "N/A"} x ${order.orderdata?.paper2GSM || "N/A"} x ${order.orderdata?.paper3GSM || "N/A"}`,
      GSM: order.gsm || "N/A",
      "Cal Deckal": order.deckalCalculation || "N/A",
      Deckal: order.orderdata?.deckal || "N/A",
      "Piece No": order.noOfPieces?.toString() || "N/A",
      "Rate/Piece": order.ratePerPiece?.toString() || "N/A",
      Amount: order.amount || "N/A",
      "KG Per Unit": order.kgPerUnit || "N/A",
      "Total KG": order.totalKg || "N/A",
      Kantan: order.kantan?.kantanName || "N/A",
      "Kantan/Piece": order.kantanPerUnit || "N/A",
      "Total Kantan": order.totalKantan ? `${order.totalKantan.reel} reel ${order.totalKantan.inch} inch` : "N/A",
      "Kantan Dec": order.kantanDeckal || "N/A",
      "Sales Remarks": order.salesRemark || "N/A",
      Status: getDisplayStatus(order).text || "N/A",
      "Unit No": order.unitNo || "N/A",
      "Start Date": order.startDate ? formatDate(order.startDate) : "N/A",
      "Delivery Date": order.deliveryDate ? formatDate(order.deliveryDate) : "N/A",
      "Dye Number": order.dyeNumber || "N/A",
      "Dye Sheet Size": order.dyeSize || "N/A",
      "Glue KG": order.glue || "N/A",
      "Wire KG": order.wire || "N/A",
      "Dye Remark": order.dyeRemark || "N/A",
      "Godown Remark": order.godownRemark || "N/A",
      "Factory Remark": order.factoryRemark || "N/A",
      "Actual no of piece": "N/A",
    }));
  }, [filteredOrders]);

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
    if (!companies.length) dispatch(getAllCompaniesThunk(true))
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
          title="QP-ORDERS"
          showExcelDownload={true}
          excelHeaders={excelHeaders}
          excelData={excelData}
          rowData={filteredOrders as any}
          totalCount={totalCount}
          pagination={pagination}
          renderExpandedRow={canViewGlobal && !canStatus ? renderExpandedRow : undefined}
          renderRow={(row: any) => {
            return (<>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  QP-{row.orderNo || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar src={row.companyName?.avatar} sx={{ width: 32, height: 32 }} alt={row.companyName?.companyName || "Company"} />
                  <Typography fontWeight={600} fontSize="14px" color="#111827">
                    {row.companyName?.companyName || "N/A"}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.party?.partyName || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {formatDate(row.createdAt) || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.status}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <ThemeButton
                    size="small"
                    onClick={() => handleViewDetails(row)}
                  >
                    View Details
                  </ThemeButton>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {canCreate && (
                    <ThemeButton
                      size="small"
                      onClick={() => handleRepeatOrder(row)}
                    >
                      Repeat Order
                    </ThemeButton>
                  )}
                  <ThemeButton
                    size="small"
                    onClick={() => handleComplainClick(row)}
                  >
                    Complain
                  </ThemeButton>
                </Box>
              </TableCell>
            </>);
          }}
        />
      </Box>

      {selectedRow && (
        <Dialog
          open={true}
          onClose={() => setSelectedRow(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Order Details - QP-{selectedRow.orderNo}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, p: 1 }}>
              {renderField("Ply", selectedRow.orderdata?.ply || "N/A")}
              {renderField("Size", selectedRow.size?.size || `${selectedRow.orderdata?.length || "N/A"} x ${selectedRow.orderdata?.width || "N/A"} x ${selectedRow.orderdata?.height || "N/A"}`)}
              {renderField("Unit of Measurement", selectedRow.orderdata?.uom || "N/A")}
              {renderField("Paper GSM", `${selectedRow.orderdata?.paper1GSM || "N/A"} x ${selectedRow.orderdata?.paper2GSM || "N/A"} x ${selectedRow.orderdata?.paper3GSM || "N/A"}`)}
              {renderField("GSM", selectedRow.gsm || "N/A")}
              {renderField("Cal Deckal", selectedRow.deckalCalculation || "N/A")}
              {renderField("Deckal", selectedRow.orderdata?.deckal || "N/A")}
              {renderField("Piece No", selectedRow.noOfPieces || "N/A")}
              {renderField("Cutting Length", selectedRow.orderdata?.length && selectedRow.orderdata?.width
                ? Number(selectedRow.orderdata.length) + Number(selectedRow.orderdata.width) + 2
                : "N/A")}
              {renderField("Sheet to Cut", selectedRow.noOfPieces
                ? Number(selectedRow.noOfPieces) * 2
                : "N/A")}
              {renderField("Rate/Piece", selectedRow.ratePerPiece ? `${selectedRow.ratePerPiece}` : "N/A")}
              {renderField("Amount", selectedRow.amount || "N/A")}
              {renderField("KG Per Unit", selectedRow.kgPerUnit || "N/A")}
              {renderField("Total KG", selectedRow.totalKg || "N/A")}
              {renderField("Kantan", selectedRow.kantan?.kantanName || "N/A")}
              {renderField("Kantan/Piece", selectedRow.kantanPerUnit || "N/A")}
              {renderField("Total Kantan", selectedRow.totalKantan ? `${selectedRow.totalKantan.reel} reel ${selectedRow.totalKantan.inch} inch` : "N/A")}
              {renderField("Kantan Dec", selectedRow.kantanDeckal || "N/A")}
              {renderField("Sales Remarks", selectedRow.salesRemark || "N/A")}
              {renderField("Status", selectedRow.status)}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedRow(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {open && (
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
          refreshData={refreshData}
        />
      )}
    </>
  );
};

export default AdminManagerSalesView;
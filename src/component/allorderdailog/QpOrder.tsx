import React, { useEffect, useState, useMemo } from "react"
import { Avatar, Box, IconButton, MenuItem, TableCell, TextField, Typography, Stack } from "@mui/material"
import BasicTable from "@/component/common_component/Table/themetable"
import { FaChevronRight } from "react-icons/fa6"
import { useRouter } from "next/router"
import ThemeButton from "@/component/common_component/themebutton"
import AddOrderDialog from "@/component/allorderdailog"
import { useAppDispatch, useAppSelector } from "@/store"
import { authService } from "@/services/auth.service"
import FilterDropdown from "@/component/fillter"
import DateRangePicker from "@/component/daterangepicker"
import { FiSearch } from "react-icons/fi"
import { InputBase } from "@mui/material"
import { getDisplayStatus } from "@/utills/utills"
import { getAllQPOrdersThunk, getQPOrdersByStaffIdThunk, updateQPOrderThunk } from "@/store/slices/qpOrderSlice"
import EditOrderDialog from "./EditOrderDialog"
import { toast } from "react-toastify"
import moment from "moment"
import { StatusCell } from "./StatusCell"

const columns = [
  { id: "orderNo", label: "Order No" },
  { id: "companyName", label: "Company Name" },
  { id: "party", label: "Party Name" },
  { id: "date", label: "Order Date" },
  { id: "name", label: "Item Name" },
  { id: "ply", label: "Ply" },
  { id: "size", label: "Size" },
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
  { id: "status", label: "Status" },
]


type OrderRow = {
  _id: string
  orderNo: string
  companyName: {
    companyName: string
    avatar?: string
  }
  party: {
    partyName: string
  }
  orderFrom: string
  date: string
  size?: {
    size: string
  }
  ply?: {
    ply: string
  }
  deckalCalculation?: string
  deckal?: string
  gsm?: string
  noOfPieces?: number
  ratePerPiece?: number
  amount?: string
  kgPerUnit?: string
  totalKg?: string
  kantan?: {
    kantanName: string
  }
  kantanPerUnit?: string
  totalKantan?: {
    reel: string
    inch: string
  }
  kantanDeckal?: string
  salesRemark?: string
  createdAt: string
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
  dyeRemark?: string
  godownRemark?: string
  factoryRemark?: string
}

// ExpandedRowForm component
interface ExpandedRowFormProps {
  row: OrderRow
  setEditData: React.Dispatch<React.SetStateAction<OrderRow | null>>
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const ExpandedRowForm = ({ row, setEditData, setOpen }: ExpandedRowFormProps) => {
  const dispatch = useAppDispatch()

  const [formData, setFormData] = useState({
    _id: row._id,
    unitNo: row.unitNo || '',
    startDate: row.startDate || '',
    deliveryDate: row.deliveryDate || '',
    dyeNumber: row.dyeNumber || "",
    dyeSize: row.dyeSize || "",
    dyeRemark: row.dyeRemark || "",
    godownRemark: row.godownRemark || "",
    factoryRemark: row.factoryRemark || "",
    status: row.status || "Pending",
  })

  const [initialFormData, setInitialFormData] = useState(formData)

  // Initialize formData when row changes
  useEffect(() => {
    const newFormData = {
      _id: row._id,
      unitNo: row.unitNo || '',
      startDate: row.startDate || '',
      deliveryDate: row.deliveryDate || '',
      dyeNumber: row.dyeNumber || "",
      dyeSize: row.dyeSize || "",
      dyeRemark: row.dyeRemark || "",
      godownRemark: row.godownRemark || "",
      factoryRemark: row.factoryRemark || "",
      status: row.status || "Pending",
    }
    setFormData(newFormData)
    setInitialFormData(newFormData)
    console.log("ExpandedRowForm: Initialized formData for row ID:", row._id, newFormData)
  }, [row._id, row.unitNo, row.startDate, row.deliveryDate, row.dyeNumber, row.dyeSize, row.dyeRemark, row.godownRemark, row.factoryRemark, row.status])

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData._id) {
      console.error("Error: formData._id is empty")
      toast.error("Cannot submit: Invalid order ID")
      return
    }
    try {
      const updateData = {
        unitNo: formData.unitNo,
        startDate: formData.startDate,
        deliveryDate: formData.deliveryDate,
        dyeNumber: formData.dyeNumber,
        dyeSize: formData.dyeSize,
        dyeRemark: formData.dyeRemark,
        godownRemark: formData.godownRemark,
        factoryRemark: formData.factoryRemark,
        status: formData.status,
      }
      console.log("ExpandedRowForm: Submitting with ID:", formData._id, "and data:", updateData)
      await dispatch(updateQPOrderThunk({ id: formData._id, data: updateData })).unwrap()
      setInitialFormData({ ...formData })
      toast.success("Order updated successfully")
    } catch (err: any) {
      console.error("ExpandedRowForm: Update failed:", err)
      toast.error(err?.message || "Failed to update order")
    }
  }

  const handleCancel = () => {
    setFormData(initialFormData)
  }

  return (
    <Box sx={{ p: 2, backgroundColor: '#f9fafb' }}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {/* Dye Number, Dye Size, and Status in one row */}
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <TextField
              select
              label="Unit No"
              value={formData.unitNo || ''}
              onChange={(e) => handleFormChange('unitNo', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="Unit1">Unit1</MenuItem>
              <MenuItem value="Unit2">Unit2</MenuItem>
            </TextField>

            <TextField
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleFormChange('startDate', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Delivery Date"
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => handleFormChange('deliveryDate', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Dye Number"
              value={formData.dyeNumber}
              onChange={(e) => handleFormChange("dyeNumber", e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Dye Sheet Size"
              value={formData.dyeSize}
              onChange={(e) => handleFormChange("dyeSize", e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              select
              label="Status"
              value={formData.status}
              onChange={(e) => handleFormChange("status", e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
            >
              {[
                "Paper cutting",
                "Corogation",
                "Pasting",
                "Rotery",
                "Sloting/rs4",
                "Printing",
                "Pinning",
                "Kanthan",
                "Puching",
                "Manual pasting",
                "Pending",
                "Order",
                "In Progress",
                "Canceled",
                "Completed",
              ].map((item) => (
                <MenuItem key={item} value={item} sx={{ textTransform: "capitalize" }}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* Remarks in one row, multiline */}
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <TextField
              label="Dye Remark"
              value={formData.dyeRemark}
              onChange={(e) => handleFormChange("dyeRemark", e.target.value)}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <TextField
              label="Godown Remark"
              value={formData.godownRemark}
              onChange={(e) => handleFormChange("godownRemark", e.target.value)}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <TextField
              label="Factory Remark"
              value={formData.factoryRemark}
              onChange={(e) => handleFormChange("factoryRemark", e.target.value)}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              sx={{ flex: 1, minWidth: 220 }}
            />
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <ThemeButton type="submit">
              Submit
            </ThemeButton>
            <ThemeButton type="button" onClick={handleCancel} variant="outlined">
              Cancel
            </ThemeButton>
            <ThemeButton
              type="button"
              onClick={() => {
                setEditData(row)
                setOpen(true)
              }}
            >
              Edit
            </ThemeButton>
          </Stack>
        </Stack>
      </form>
    </Box>
  )
}

const AllOrdersPage = () => {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [editData, setEditData] = useState<OrderRow | null>(null)
  const { user } = useAppSelector((state) => state.auth)
  const { orders, loading, error, totalCount, pagination } = useAppSelector((state) => state.qpOrders)
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({})

  const canViewGlobal = user?.role?.permissions?.all_orders?.view_global
  const canViewOwn = user?.role?.permissions?.all_orders?.view_own
  const canCreate = user?.role?.permissions?.all_orders?.create
  const canStatus = user?.role?.permissions?.all_orders?.status

  // Get unique values for the selected filter field
  const getUniqueValues = useMemo(() => {
    if (!selectedFilterField) return []
    const columnId = columns.find(col => col.label === selectedFilterField)?.id
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
        case "date":
          value = order.date
          break
        case "ply":
          value = order.ply?.ply
          break
        case "name":
          value = order.name?.name
          break
        case "length":
          value = order.length?.length
          break
        case "height":
          value = order.height?.height
          break
        case "width":
          value = order.width?.width
          break
        case "gsm":
          value = order.gsm
          break
        // case "size":
        //   value = order.size?.size
        //   break
        case "deckalCalculation":
          value = order.deckalCalculation
          break
        case "deckal":
          value = order.deckal
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
        case "status":
          value = order.status
          break
      }
      return value?.toString() || "N/A"
    })

    return Array.from(new Set(values)).filter((v) => v !== "N/A").sort()
  }, [selectedFilterField, orders])

  // Filter orders based on search query, date range, and selected filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchesDateRange =
        (!startDate || new Date(order.createdAt) >= new Date(startDate).setHours(0, 0, 0, 0)) &&
        (!endDate || new Date(order.createdAt) <= new Date(endDate).setHours(23, 59, 59, 999))

      const matchesSearch = searchQuery
        ? order.orderNo?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.companyName?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.party?.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.ply?.ply?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.name?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.length?.length?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.height?.height?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.width?.width?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.gsm?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // order.size?.size?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deckalCalculation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deckal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          case "date":
            value = order.date
            break
          case "ply":
            value = order.ply?.ply
            break
          case "name":
            value = order.name?.name
            break
          case "length":
            value = order.length?.length
            break
          case "height":
            value = order.height?.height
            break
          case "width":
            value = order.width?.width
            break
          case "gsm":
            value = order.gsm
            break
          // case "size":
          //   value = order.size?.size
          //   break
          case "deckalCalculation":
            value = order.deckalCalculation
            break
          case "deckal":
            value = order.deckal
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
          case "status":
            value = order.status
            break
        }
        return value && filters[columnId].includes(value.toString())
      })

      return matchesDateRange && matchesSearch && matchesFilters
    })
  }, [orders, startDate, endDate, searchQuery, filters])

  console.log("DEBUG : AllOrdersPage : canViewOwn && user?.id:", canViewOwn && user?.id);
  useEffect(() => {
    const token = authService.getToken()
    if (!token) {
      router.push("/login")
      return
    }

    if (canViewGlobal) {
      if (!orders.length) dispatch(getAllQPOrdersThunk())

    } else if (canViewOwn && user?.id) {

      if (!orders.length) dispatch(getQPOrdersByStaffIdThunk(user.id))
    }
  }, [dispatch, router, canViewGlobal, canViewOwn, user?.id])

  const getRouteByStatus = (row: OrderRow): string => {
    const { status, designer, printer, binder, bookletBinder } = row
    switch (status) {
      case "Received":
        return `/admin/all-orders/view?id=${row._id}`
      case "Designer":
        return `/admin/all-orders/view/designer?id=${row._id}`
      case "Printer":
        return `/admin/all-orders/view/printers?id=${row._id}`
      case "Binder":
        return `/admin/all-orders/view/binder?id=${row._id}`
      case "Booklet & Folder Binder":
        return `/admin/all-orders/view/booklet-folder?id=${row._id}`
      case "Delivery":
        return `/admin/all-orders/view/dilevery?id=${row._id}`
      case "Hold":
        if (bookletBinder) {
          return `/admin/all-orders/view/booklet-folder?id=${row._id}`
        } else if (binder) {
          return `/admin/all-orders/view/binder?id=${row._id}`
        } else if (printer) {
          return `/admin/all-orders/view/printers?id=${row._id}`
        } else if (designer) {
          return `/admin/all-orders/view/designer?id=${row._id}`
        } else {
          return `/admin/all-orders/view?id=${row._id}`
        }
      default:
        return `/admin/all-orders/view?id=${row._id}`
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return moment(date).format('DD/MM/YY')
    } catch {
      return dateString
    }
  }

  const handleRowClick = (row: OrderRow) => {
    const route = getRouteByStatus(row)
    router.push(route)
  }

  const StatusBadge = ({ row }: { row: OrderRow }) => {
    const { text, isHold } = getDisplayStatus(row)
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
      )
    }

    return (
      <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
        {text}
      </Typography>
    )
  }

  const renderExpandedRow = (row: OrderRow) => {
    if (!canViewGlobal) return null;
    return <ExpandedRowForm row={row} setEditData={setEditData} setOpen={setOpen} />;
  };

  if (loading) return <Typography>Loading orders...</Typography>
  if (error) return <Typography color="error">Error: {error}</Typography>

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
            filterOptions={columns
              .filter((col) => col.id !== "action")
              .map((col) => col.label)}
            uniqueValues={selectedFilterField ? getUniqueValues : []}
            onFiltersChange={(newFilters) => {
              const idBasedFilters: { [key: string]: string[] } = {}
              Object.entries(newFilters).forEach(([label, values]) => {
                const columnId = columns.find(col => col.label === label)?.id
                if (columnId) {
                  idBasedFilters[columnId] = values
                }
              })
              setFilters(idBasedFilters)
            }}
            filters={Object.keys(filters).reduce((acc, columnId) => {
              const columnLabel = columns.find(col => col.id === columnId)?.label
              if (columnLabel) {
                acc[columnLabel] = filters[columnId]
              }
              return acc
            }, {} as { [key: string]: string[] })}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />
          <ThemeButton
            onClick={() => {
              setEditData(null)
              setOpen(true)
            }}
          >
            + Add New Order
          </ThemeButton>
        </Box>
      </Box>
      <Box py={2}>
        <BasicTable
          showDatePicker={false}
          tableHeader={columns}
          showFillter={false}
          showSearch={false}
          rowData={filteredOrders as any}
          totalCount={totalCount}
          pagination={pagination}
          renderExpandedRow={
            canViewGlobal && !canStatus ? renderExpandedRow : undefined
          }
          renderRow={(row: any) => (
            <>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  QP-{row.orderNo || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    src={row.companyName?.avatar}
                    sx={{ width: 32, height: 32 }}
                    alt={row.companyName?.companyName || "Company"}
                  />
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
                  {row.name?.name || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.ply?.ply || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.length?.length || "N/A"} x {row.width?.width || "N/A"} x {row.height?.height || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.gsm || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.deckalCalculation || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.deckal || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.noOfPieces || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.ratePerPiece ? `${row.ratePerPiece}` : "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.amount || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.kgPerUnit || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.totalKg || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.kantan?.kantanName || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.kantanPerUnit || "N/A"} {/* Added */}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.totalKantan ? `${row.totalKantan.reel} reel ${row.totalKantan.inch} inch` : "N/A"} {/* Added */}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.kantanDeckal || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.salesRemark || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusCell row={row} />
              </TableCell>
            </>
          )}
        />
      </Box>

      {open && (
        <>
          {editData === null ? (
            <AddOrderDialog open={open} onClose={() => setOpen(false)} />
          ) : (
            <EditOrderDialog open={open} onClose={() => setOpen(false)} editData={editData} />
          )}
        </>
      )}
    </>
  )
}

export default AllOrdersPage

import React, { useEffect, useState, useMemo } from "react"
import { Avatar, Box, IconButton, MenuItem, TableCell, TextField, Typography } from "@mui/material"
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

const columns = [
  { id: "orderNo", label: "Order No" },
  { id: "orderFrom", label: "Order From" },
  { id: "party", label: "Party" },
  { id: "type", label: "Order Type" },
  { id: "size", label: "Size" },
  { id: "ply", label: "Ply" },
  { id: "deckal", label: "Deckal" },
  { id: "rate", label: "Rate" },
  { id: "pcs", label: "Pcs" },
  { id: "gsm", label: "Gsm" },
  { id: "status", label: "Status" },
  { id: "delivery", label: "Delivery" },
  { id: "godownRemark", label: "Godown Remark" },
  { id: "factoryRemark", label: "Factory Remark" },
]

type OrderRow = {
  _id: string
  orderNo: string
  companyName: {
    companyName: string
  }
  party: {
    partyName: string
  }
  productItem: {
    itemName: string
  }
  size?: string
  ply?: string
  deckal?: string
  rate?: number
  pcs?: number
  gsm?: number
  delivery?: string
  godownRemark?: string
  factoryStatus?: string
  orderType?: string
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
}

const AllOrdersPage = () => {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [editData, setEditData] = useState(null)
  const { user } = useAppSelector((state) => state.auth)
  const { orders, loading, error, totalCount, pagination } = useAppSelector((state) => state.qpOrders)
  const [formData, setFormData] = useState({
    _id: "",
    unitNo: '',
    startDate: '',
    pasteing: '',
    pinning: '',
    rsFor: '',
    kantan: '',
    kantanDeckal: '',
    deliveryDate: '',
    otherStatus: ""
  })
  const [initialFormData, setInitialFormData] = useState(formData)
  // Filter state
  const [selectedFilterField, setSelectedFilterField] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const canViewGlobal = user?.role?.permissions?.all_orders?.view_global
  const canViewOwn = user?.role?.permissions?.all_orders?.view_own
  const canCreate = user?.role?.permissions?.all_orders?.create

  // Get unique values for the selected filter field
  const getUniqueValues = useMemo(() => {
    if (!selectedFilterField) return [];
    const columnId = columns.find(col => col.label === selectedFilterField)?.id;
    if (!columnId) return [];

    const values = orders.map((order: any) => {
      let value: string | number | undefined;

      switch (columnId) {
        case "orderNo":
          value = order.orderNo;
          break;
        case "orderFrom":
          value = order.companyName?.companyName;
          break;
        case "party":
          value = order.party?.partyName;
          break;
        case "type":
          value = order.orderType;
          break;
        case "size":
          value = order.size;
          break;
        case "ply":
          value = order.ply;
          break;
        case "deckal":
          value = order.deckal;
          break;
        case "rate":
          value = order.rate;
          break;
        case "pcs":
          value = order.pcs;
          break;
        case "gsm":
          value = order.gsm;
          break;
        case "status":
          value = getDisplayStatus(order).text;
          break;
        case "delivery":
          value = order.delivery;
          break;
        case "godownRemark":
          value = order.godownRemark;
          break;
        case "factoryStatus":
          value = order.factoryStatus;
          break;
      }
      return value?.toString() || "N/A";
    });

    return Array.from(new Set(values)).filter((v) => v !== "N/A").sort();
  }, [selectedFilterField, orders]);

  // Filter orders based on search query, date range, and selected filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchesDateRange =
        (!startDate || new Date(order.createdAt) >= new Date(startDate).setHours(0, 0, 0, 0)) &&
        (!endDate || new Date(order.createdAt) <= new Date(endDate).setHours(23, 59, 59, 999));

      const matchesSearch = searchQuery
        ? order.orderNo?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.companyName?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.party?.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.size.size?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.ply.ply?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.deckal.deckal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.delivery?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.godownRemark?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.factoryStatus?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesFilters = Object.keys(filters).every((columnId) => {
        if (filters[columnId].length === 0) return true;
        let value: string | number | undefined;

        switch (columnId) {
          case "orderNo":
            value = order.orderNo;
            break;
          case "orderFrom":
            value = order.companyName?.companyName;
            break;
          case "party":
            value = order.party?.partyName;
            break;
          case "type":
            value = order.orderType;
            break;
          case "size":
            value = order.size;
            break;
          case "ply":
            value = order.ply;
            break;
          case "deckal":
            value = order.deckal;
            break;
          case "rate":
            value = order.rate;
            break;
          case "pcs":
            value = order.pcs;
            break;
          case "gsm":
            value = order.gsm;
            break;
          case "status":
            value = getDisplayStatus(order).text;
            break;
          case "delivery":
            value = order.delivery;
            break;
          case "godownRemark":
            value = order.godownRemark;
            break;
          case "factoryStatus":
            value = order.factoryStatus;
            break;
        }
        return value && filters[columnId].includes(value.toString());
      });

      return matchesDateRange && matchesSearch && matchesFilters;
    });
  }, [orders, startDate, endDate, searchQuery, filters]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (canViewGlobal) {
      if (!orders.length) dispatch(getAllQPOrdersThunk())
    } else if (canViewOwn && user?.id) {
      if (!orders.length) dispatch(getQPOrdersByStaffIdThunk(user.id));
    }
  }, [dispatch, router, canViewGlobal, canViewOwn, user?.id]);

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
    const route = getRouteByStatus(row);
    router.push(route);
  };

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

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would normally dispatch an update action

    await dispatch(updateQPOrderThunk({ id: formData?._id, data: formData })).unwrap();
    setExpandedRowId(null)
  }
  const handleCancel = () => {
    setFormData(initialFormData)
    setExpandedRowId(null)
  }

  const renderExpandedRow = (row: OrderRow) => {

    return (
      <Box sx={{ p: 2, backgroundColor: '#f9fafb' }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            {/* 🔥 Unit No Dropdown */}
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
              label="Pasteing"
              value={formData.pasteing}
              onChange={(e) => handleFormChange('pasteing', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Pinning"
              value={formData.pinning}
              onChange={(e) => handleFormChange('pinning', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Rs For"
              value={formData.rsFor}
              onChange={(e) => handleFormChange('rsFor', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Kantan"
              value={formData.kantan}
              onChange={(e) => handleFormChange('kantan', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Kantan deckal"
              value={formData.kantanDeckal}
              onChange={(e) => handleFormChange('kantanDeckal', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="Delivery date"
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => handleFormChange('deliveryDate', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
              InputLabelProps={{ shrink: true }}
            />

            {/* 🔥 Status Dropdown */}
            <TextField
              select
              label="Status"
              value={formData.otherStatus || ''}
              onChange={(e) => handleFormChange('otherStatus', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="order">Order</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="canceled">Canceled</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <ThemeButton type="submit" onClick={() => handleFormChange('_id', row?._id)}>Submit</ThemeButton>
            <ThemeButton type="button" onClick={handleCancel} variant="outlined">
              Cancel
            </ThemeButton>
            <ThemeButton
              type="button"
              onClick={() => {
                setEditData(row as any);
                setOpen(true);
              }}
            >
              Edit
            </ThemeButton>
          </Box>
        </form>
      </Box>
    )
  };


  if (loading) return <Typography>Loading orders...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

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
            uniqueValues={selectedFilterField ? getUniqueValues : []}
            onFiltersChange={(newFilters) => {
              const idBasedFilters: { [key: string]: string[] } = {};

              Object.entries(newFilters).forEach(([label, values]) => {
                const columnId = columns.find(col => col.label === label)?.id;
                if (columnId) {
                  idBasedFilters[columnId] = values;
                }
              });

              setFilters(idBasedFilters);
            }}
            filters={Object.keys(filters).reduce((acc, columnId) => {
              const columnLabel = columns.find(col => col.id === columnId)?.label;
              if (columnLabel) {
                acc[columnLabel] = filters[columnId];
              }
              return acc;
            }, {} as { [key: string]: string[] })}
            selectedField={selectedFilterField}
            onFieldSelect={setSelectedFilterField}
          />
          <ThemeButton onClick={() => {
            setEditData(null)
            setOpen(true)

          }}>+ Add New Order</ThemeButton>
        </Box>
      </Box>
      <Box px={2} py={2}>
        <BasicTable
          showDatePicker={false}
          tableHeader={columns}
          showFillter={false}
          showSearch={false}
          rowData={filteredOrders as any}
          totalCount={totalCount}
          pagination={pagination}
          renderExpandedRow={renderExpandedRow}
          renderRow={(row: any) => (
            <>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.orderNo || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    src={row.companyName?.avatar}
                    sx={{ width: 32, height: 32 }}
                    alt={row.companyName?.companyName || "Company"}
                  />
                  <Typography
                    fontWeight={600}
                    fontSize="14px"
                    color="#111827"
                  >
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
                  {row.orderType || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.size?.size || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.ply?.ply || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.deckal?.deckal || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.rate ? `₹${row.rate}` : "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.pcs || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.gsm?.gsm || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusBadge row={row} />
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.delivery || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.godownRemark || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.factoryRemark || "N/A"}
                </Typography>
              </TableCell>
            </>
          )}
        />
      </Box>

      {open ?
        <>
          {editData === null ?
            <AddOrderDialog open={open} onClose={() => setOpen(false)} />
            :
            <EditOrderDialog open={open} onClose={() => setOpen(false)} editData={editData} />}
        </>
        : null}

    </>
  )
}

export default AllOrdersPage;
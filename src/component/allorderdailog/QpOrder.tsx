import React, { useEffect, useState, useMemo } from "react"
import { Avatar, Box, IconButton, MenuItem, TableCell, TextField, Typography, Stack } from "@mui/material"
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
import { getAllQPOrdersThunk, getQPOrdersByStaffIdThunk, updateQPOrderThunk } from "@/store/slices/qpOrderSlice"
import { toast } from "react-toastify"
import moment from "moment"
import { StatusCell } from "./StatusCell"
import Loader from "../common_component/loader"
import { ExpandedRowForm } from "./expandableRows/QpOrderRows"
import AddQPOrderDialog from "./QpOrderDialog"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import { StaticCompanyOptions } from "@/constants"

const columns = [
  { id: "orderNo", label: "Order No" },
  { id: "companyName", label: "Company Name" },
  { id: "party", label: "Party Name" },
  { id: "date", label: "Order Date" },
  { id: "ply", label: "Ply" },
  { id: "size", label: "Size" },
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
  { id: "status", label: "Status" },
]


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
}

const AllOrdersPage = () => {
  const [open, setOpen] = React.useState(false)
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
  const { companyName, staffId, startDate : st, endDate : ed } = router.query
  const refreshData = () => {
    if (canViewGlobal) {
      dispatch(getAllQPOrdersThunk({ companyName, staffId, startDate : st, endDate : ed }))
    } else if (canViewOwn && user?.id) {
      dispatch(getQPOrdersByStaffIdThunk(user.id))
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return moment(date).format('DD/MM/YY')
    } catch {
      return dateString
    }
  }

  // Prepare Excel headers
  const excelHeaders = useMemo(() => {
    const tableHeaders = columns.map((col) => col.label);
    const expandedHeaders = [
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
    ];
    return [...tableHeaders, ...expandedHeaders];
  }, []);

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
        order.orderdata?.ply?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderdata?.length?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderdata?.height?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderdata?.width?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderdata?.paper1GSM?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderdata?.paper2GSM?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderdata?.paper3GSM?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.gsm?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // order.size?.size?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          case "date":
            value = order.date
            break
          case "ply":
            value = order.orderdata?.ply
            break
          case "length":
            value = order.orderdata?.length
            break
          case "height":
            value = order.orderdata?.height
            break
          case "width":
            value = order.orderdata?.width
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
          case "status":
            value = order.status
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
      "Actual no of piece": order.actualNoOfPieces || "N/A",
    }));
  }, [filteredOrders]);

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
          value = order.orderdata?.ply
          break
        case "length":
          value = order.orderdata?.length
          break
        case "height":
          value = order.orderdata?.height
          break
        case "width":
          value = order.orderdata?.width
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
          value = order.orderdata.deckal
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


  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true))
  }, [])

  // console.log("DEBUG : AllOrdersPage : canViewOwn && user?.id:", canViewOwn && user?.id);
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
          title="QP-ORDERS"
          showExcelDownload={true} // Enable Excel download button
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
                  {row.orderdata?.ply || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.orderdata?.length || "N/A"} x {row.orderdata?.width || "N/A"} x {row.orderdata?.height || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.orderdata?.paper1GSM || "N/A"} x {row.orderdata?.paper2GSM || "N/A"} x {row.orderdata?.paper3GSM || "N/A"}
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
                  {row.orderdata?.deckal || "N/A"}
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
                  {row.kantanPerUnit || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.totalKantan ? `${row.totalKantan.reel} reel ${row.totalKantan.inch} inch` : "N/A"}
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
            </>);
          }}
        />
      </Box>

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
    </>
  );
};

export default AllOrdersPage;
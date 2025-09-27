import React, { useEffect, useState, useMemo } from "react"
import { Avatar, Box, IconButton, TableCell, Typography, Button, Modal, Paper, Table, TableBody, TableCell as MUITableCell, TableContainer, TableHead, TableRow } from "@mui/material"
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
import { getAllQPOrdersThunk, getQPOrdersByStaffIdThunk, updateQPOrderThunk } from "@/store/slices/qpOrderSlice"
import { toast } from "react-toastify"
import moment from "moment"
import { StatusCell } from "./StatusCell"
import Loader from "../common_component/loader"
import { ExpandedRowForm } from "./expandableRows/QpOrderRows"
import AddQPOrderDialog from "./QpOrderDialog"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import { StaticCompanyOptions } from "@/constants"
import ThemeInput from "../common_component/themeinput"

const columns = [
  { id: "orderNo", label: "Order No" },
  { id: "party", label: "Party Name" },
  { id: "boxSize", label: "Box Size" },
  { id: "noOfBox", label: "No of Box" },
  { id: "ply", label: "Ply" },
  { id: "top", label: "Top" },
  { id: "corogation", label: "Corogation" },
  { id: "bottom", label: "Bottom" },
  { id: "deckal", label: "Deckal" },
  { id: "cuttingLength", label: "Cutting length" },
  { id: "noOfSheetut", label: "No of sheet to cut / PCs" },
  { id: "liner", label: "Liner" },
  { id: "totalKG", label: "Total KG" },
  { id: "kgOfPaper", label: "KG of each paper" },
  { id: "status", label: "Status" },
  { id: "noOfPeice", label: "No of piece" },
  { id: "action", label: "Actions" },
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
  orderdata?: {
    ply?: string;
    length?: string;
    width?: string;
    height?: string;
    paper1GSM?: string;
    paper2GSM?: string;
    paper3GSM?: string;
    deckal?: string;
  };
  actualNoOfPieces?: string;
}

const OperatorView = () => {
  const [open, setOpen] = React.useState(false)
  const [jobSheetOpen, setJobSheetOpen] = React.useState(false)
  const [selectedRow, setSelectedRow] = React.useState<OrderRow | null>(null)
  console.log("DEBUG : OperatorView : selectedRow:", selectedRow);
  const [pieceInputs, setPieceInputs] = useState<{ [key: string]: string }>({});
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarksRow, setRemarksRow] = useState<OrderRow | null>(null);

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
  const { companyName, staffId, startDate: st, endDate: ed } = router.query
  const refreshData = () => {
    if (canViewGlobal) {
      dispatch(getAllQPOrdersThunk({ companyName, staffId, startDate: st, endDate: ed }))
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

  const handleSavePieces = async (row: OrderRow) => {
  const value = pieceInputs[row._id];
  if (!value) {
    toast.error("Please enter a number before saving");
    return;
  }

  try {
    await dispatch(
      updateQPOrderThunk({
        id: row._id,
        data: { operatorNoOfPieces: Number(value) },
      })
    ).unwrap();

    toast.success("Pieces saved successfully");
  } catch (err: any) {
    toast.error(err?.message || "Failed to save pieces");
  }
};


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
          showDatePicker={false}
          tableHeader={columns}
          showFillter={false}
          showSearch={false}
          // title="QP-ORDERS"
          // showExcelDownload={true}
          // excelHeaders={excelHeaders}
          // excelData={excelData}
          rowData={filteredOrders as any}
          totalCount={totalCount}
          pagination={pagination}
          renderExpandedRow={canViewGlobal && !canStatus ? renderExpandedRow : undefined}
          renderRow={(row: any) => {
            // console.log("DEBUG : row:", row);
            return (<>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  QP-{row.orderNo || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="14px" color="#6B7280">
                  {row.party?.partyName || "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography>{`${row.orderdata?.length || "N/A"} x ${row.orderdata?.width || "N/A"} x ${row.orderdata?.height || "N/A"}`}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{row.noOfPieces || "N/A"}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{row.orderdata?.ply || "N/A"}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{`${row.orderdata?.paper1GSM || "N/A"}`}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{`${row.orderdata?.paper2GSM || "N/A"}`}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{row.orderdata?.paper3GSM || "N/A"}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{row.deckalCalculation || "N/A"}</Typography>
              </TableCell>
              <TableCell>
                <Typography>
                  {row.orderdata?.length && row.orderdata?.height
                    ? Number(row.orderdata.length) + Number(row.orderdata.height)
                    : "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography>
                  {row.noOfPieces
                    ? Number(row.noOfPieces) * 2
                    : "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography>
                  {row.orderdata.ply
                    ? Number(row.orderdata.ply) - 1
                    : "N/A"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography>{row.totalKg || "N/A"}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{`${row?.paperKG?.paper1?.totalKg || "N/A"} - ${row?.paperKG?.paper2?.totalKg || "N/A"} - ${row?.paperKG?.paper3?.totalKg || "N/A"}`}</Typography>
              </TableCell>
              <TableCell>
                <StatusCell row={row} />
              </TableCell>
              <TableCell>
                <ThemeInput
                  placeholder="No of piece"
                  type="number"
                  value={pieceInputs[row._id] || ""}
                  onChange={(e) =>
                    setPieceInputs((prev) => ({ ...prev, [row._id]: e.target.value }))
                  }
                />
              </TableCell>

              <TableCell>
                <Box display="flex" gap={1}>
                  <ThemeButton
                    size="small"
                    onClick={() => handleSavePieces(row)}
                  >
                    Save
                  </ThemeButton>
                  <ThemeButton
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setRemarksRow(row);
                      setRemarksOpen(true);
                    }}
                  >
                    Show Remarks
                  </ThemeButton>
                </Box>
              </TableCell>

            </>);
          }}
        />
      </Box>

      <Modal open={remarksOpen} onClose={() => setRemarksOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            p: 3,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" mb={2}>
            Remarks
          </Typography>
          <Typography>
            {remarksRow?.factoryRemark ||
              remarksRow?.godownRemark ||
              remarksRow?.dyeRemark ||
              "No remarks available"}
          </Typography>
          <Box textAlign="right" mt={2}>
            <ThemeButton onClick={() => setRemarksOpen(false)}>Close</ThemeButton>
          </Box>
        </Box>
      </Modal>


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

export default OperatorView;
import React, { useEffect, useState, useMemo } from "react"
import { Avatar, Box, IconButton, TableCell, Typography, Button, Modal, Paper, Table, TableBody, TableCell as MUITableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import BasicTable from "@/component/common_component/Table/themetable"
import { useRouter } from "next/router"
import ThemeButton from "@/component/common_component/themebutton"
import { useAppDispatch, useAppSelector } from "@/store"
import { authService } from "@/services/auth.service"
import FilterDropdown from "@/component/fillter"
import DateRangePicker from "@/component/daterangepicker"
import { FiSearch, FiSave } from "react-icons/fi"
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
import { calculatePaperKg } from "@/utills/qpCalculations"

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
    paperKG?: {
        paper1?: { totalKg?: string };
        paper2?: { totalKg?: string };
        paper3?: { totalKg?: string };
    };
    cuttingLength?: string; // Add this optional field
    operatorNoOfSheet?: string;
    operatorNoOfPieces?: string;
    operatorPaperKG?: any;
    operatorTotalKg?: string;
}
const OperatorView = () => {
    const [open, setOpen] = React.useState(false)
    const [jobSheetOpen, setJobSheetOpen] = React.useState(false)
    const [selectedRow, setSelectedRow] = React.useState<OrderRow | null>(null)
    const [pieceInputs, setPieceInputs] = useState<{ [key: string]: string }>({});
    const [cuttingLengthInputs, setCuttingLengthInputs] = useState<{ [key: string]: string }>({});
    const [remarksOpen, setRemarksOpen] = useState(false);
    const [remarksRow, setRemarksRow] = useState<OrderRow | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
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


    // Define columns based on user role - UPDATED: Operator columns come before Status
    const columns = useMemo(() => [
        { id: "orderNo", label: "Order No" },
        { id: "unitNo", label: "Unit No" },
        { id: "date", label: "Date" },
        { id: "boxSize", label: "Box Size" },
        { id: "top", label: "Top" },
        { id: "corogation", label: "Corogation" },
        { id: "bottom", label: "Bottom" },
        { id: "ply", label: "Ply" },
        { id: "deckal", label: "Deckal" },
        { id: "liner", label: "Liner" },
        { id: "noofliner", label: "No of Liner" },
        { id: "noOfBox", label: "Piece" },
        { id: "cuttingLength", label: "Cutting length" },
        { id: "cutsheet", label: "No Cut sheet" },
        { id: "totalKG", label: "Total KG" },
        { id: "party", label: "Party Name" },
        { id: "status", label: "Status" },
        { id: "noOfPeice", label: "No of sheet to cut" },
        { id: "action", label: "Actions" },
    ], []);

    const { companyName, staffId, startDate: st, endDate: ed } = router.query
    const refreshData = () => {
        if (canViewGlobal) {
            dispatch(getAllQPOrdersThunk({ companyName, staffId, startDate: st, endDate: ed }))
        } else if (canViewOwn && user?.id) {
            dispatch(getQPOrdersByStaffIdThunk(user?.id))
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

    // Helper function to get field value based on column ID
    const getFieldValue = (order: OrderRow, columnId: string): string => {
        switch (columnId) {
            case "orderNo":
                return order.orderNo || "N/A";
            case "party":
                return order.party?.partyName || "N/A";
            case "boxSize":
                return `${order.orderdata?.length || "N/A"} x ${order.orderdata?.width || "N/A"} x ${order.orderdata?.height || "N/A"}`;
            case "noOfBox":
                return order.noOfPieces?.toString() || "N/A";
            case "ply":
                return order.orderdata?.ply || "N/A";
            case "top":
                return order.orderdata?.paper1GSM || "N/A";
            case "corogation":
                return order.orderdata?.paper2GSM || "N/A";
            case "bottom":
                return order.orderdata?.paper3GSM || "N/A";
            case "deckal":
                return order.orderdata?.deckal || "N/A";
            case "cuttingLength":
                return order.cuttingLength
                    ? order.cuttingLength
                    : order.orderdata?.length && order.orderdata?.width
                        ? (Number(order.orderdata.length) + Number(order.orderdata.width) + 2).toString()
                        : "N/A";
            case "noOfSheetut":
                return order.noOfPieces
                    ? (Number(order.noOfPieces) * 2).toString()
                    : "N/A";
            case "liner":
                return order.orderdata?.ply
                    ? (Number(order.orderdata.ply) - 1).toString()
                    : "N/A";
            case "noofliner":
                return order.orderdata?.ply && order.noOfPieces
                    ? (Number(order.noOfPieces) * 2 * (Number(order.orderdata.ply) - 1)).toString()
                    : "N/A";
            case "totalKG":
                return order.totalKg || "N/A";
            case "kgOfPaper":
                return `${order?.paperKG?.paper1?.totalKg || "N/A"} - ${order?.paperKG?.paper2?.totalKg || "N/A"} - ${order?.paperKG?.paper3?.totalKg || "N/A"}`;
            case "status":
                return order.status || "N/A";
            case "noOfPeice":
                return order.noOfPieces?.toString() || "N/A";
            case "unitNo":
                return order.unitNo || "N/A";
            case "dyenumber":
                return order.dyeNumber || "NO";
            case "dyesize":
                return order.dyeSize || "NO";
            case "kantan":
                return order.kantan?.kantanName || "N/A";
            default:
                return "N/A";
        }
    };


    // Safe string conversion for search
    const safeToString = (value: any): string => {
        if (value === null || value === undefined) return "";
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value.toString();
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    // Filter orders based on selected unit
    const filteredOrders = useMemo(() => {
        return orders.filter((order: OrderRow) => {
            // Date range filter
            const matchesDateRange =
                (!startDate || new Date(order.createdAt) >= new Date(startDate).setHours(0, 0, 0, 0)) &&
                (!endDate || new Date(order.createdAt) <= new Date(endDate).setHours(23, 59, 59, 999))

            // Unit filter
            const matchesUnit =
                !selectedUnit ||
                order.unitNo === selectedUnit;

            // Search filter - search across all visible fields
            const matchesSearch = searchQuery
                ? columns.some(column => {
                    const value = getFieldValue(order, column.id);
                    return safeToString(value).toLowerCase().includes(searchQuery.toLowerCase());
                }) ||
                safeToString(order.companyName?.companyName).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.party?.partyName).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.orderdata?.ply).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.orderdata?.paper1GSM).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.orderdata?.paper2GSM).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.orderdata?.paper3GSM).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.noOfPieces).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.totalKg).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.kantan?.kantanName).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.status).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.unitNo).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.cuttingLength).toLowerCase().includes(searchQuery.toLowerCase())
                : true

            // Column filters
            const matchesFilters = Object.keys(filters).every((columnId) => {
                if (filters[columnId].length === 0) return true

                const value = getFieldValue(order, columnId);
                return value && value !== "N/A" && filters[columnId].includes(value.toString())
            })

            return matchesDateRange && matchesUnit && matchesSearch && matchesFilters;
        })
    }, [orders, startDate, endDate, selectedUnit, searchQuery, filters, columns])

    const getUniqueValues = useMemo(() => {
        if (!selectedFilterField) return []

        const columnId = columns.find(col => col.label === selectedFilterField)?.id
        if (!columnId) return []

        const values = orders.map((order: OrderRow) => {
            return getFieldValue(order, columnId)
        })

        return Array.from(new Set(values)).filter((v) => v !== "N/A").sort()
    }, [selectedFilterField, orders, columns])

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

        const { paper1Kg, paper2Kg, paper3Kg, totalKgss } = calculatePaperKg(
            parseFloat(row?.orderdata?.length),
            parseFloat(row.orderdata.width),
            parseFloat(row.orderdata.height),
            parseFloat(row.orderdata.deckal),
            parseInt(row.orderdata.ply),
            parseFloat(row.orderdata.paper3GSM),
            parseFloat(row.orderdata.paper2GSM),
            parseFloat(row.orderdata.paper1GSM),
            Number(value)
        );

        // 📝 build payload for operatorPaperKG
        const operatorPaperKG = {
            paper1: {
                deckal: row.orderdata.deckal,
                gsm: row.orderdata.paper1GSM,
                totalKg: paper3Kg?.toFixed(2).toString(),
            },
            paper2: {
                deckal: row.orderdata.deckal,
                gsm: row.orderdata.paper2GSM,
                totalKg: paper2Kg?.toFixed(2).toString(),
            },
            paper3: {
                deckal: row.orderdata.deckal,
                gsm: row.orderdata.paper3GSM,
                totalKg: paper1Kg?.toFixed(2).toString(),
            },
        };
        const operatorTotalKg = totalKgss?.toFixed(2).toString()

        try {
            await dispatch(
                updateQPOrderThunk({
                    id: row._id,
                    data: {
                        operatorNoOfSheet: Number(value),
                        operatorPaperKG,
                        operatorTotalKg,
                    },
                })
            ).unwrap();
            // Set local input to the saved value for immediate UI feedback
            setPieceInputs(prev => ({ ...prev, [row._id]: value }));
            // Refresh data to update the table with new values from backend
            refreshData();
            toast.success("Data saved successfully");
        } catch (err: any) {
            toast.error(err?.message || "Failed to save pieces");
        }
    };
    // Handle saving cutting length
    const handleSaveCuttingLength = async (row: OrderRow) => {
        const cuttingLength = cuttingLengthInputs[row._id];

        if (!cuttingLength) {
            toast.error("Please enter a cutting length before saving");
            return;
        }
        // Validate that it's a positive number
        const cuttingLengthNum = parseFloat(cuttingLength);
        if (isNaN(cuttingLengthNum) || cuttingLengthNum <= 0) {
            toast.error("Please enter a valid positive number for cutting length");
            return;
        }
        try {
            await dispatch(
                updateQPOrderThunk({
                    id: row._id,
                    data: {
                        cuttingLength: cuttingLength,
                    },
                })
            ).unwrap();

            // Set local input to the saved value for immediate UI feedback
            setCuttingLengthInputs(prev => ({
                ...prev,
                [row._id]: cuttingLength
            }));

            // Refresh data to update the table with new values from backend
            refreshData();
            toast.success("Cutting length updated successfully");

        } catch (err: any) {
            toast.error(err?.message || "Failed to update cutting length");
        }
    };
    // Function to get row background color based on unit
    const getRowBackgroundColor = (row: OrderRow) => {
        if (row?.unitNo === 'Unit1') {
            return 'rgba(59, 130, 246, 0.1)'; // Light blue for unit 1
        } else if (row?.unitNo === 'Unit2') {
            return 'rgba(34, 197, 94, 0.1)'; // Light green for unit 2
        }
        return 'transparent'; // Default background
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

                    {/* Unit Filter Buttons */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                        <Button
                            variant={selectedUnit === 'Unit1' ? "contained" : "outlined"}
                            sx={{
                                backgroundColor: selectedUnit === 'Unit1' ? '#3B82F6' : 'transparent',
                                color: selectedUnit === 'Unit1' ? 'white' : '#3B82F6',
                                borderColor: '#3B82F6',
                                '&:hover': {
                                    backgroundColor: selectedUnit === 'Unit1' ? '#2563EB' : 'rgba(59, 130, 246, 0.1)',
                                },
                                minWidth: '80px'
                            }}
                            onClick={() => setSelectedUnit(selectedUnit === 'Unit1' ? null : 'Unit1')}
                        >
                            Unit 1
                        </Button>
                        <Button
                            variant={selectedUnit === 'Unit2' ? "contained" : "outlined"}
                            sx={{
                                backgroundColor: selectedUnit === 'Unit2' ? '#22C55E' : 'transparent',
                                color: selectedUnit === 'Unit2' ? 'white' : '#22C55E',
                                borderColor: '#22C55E',
                                '&:hover': {
                                    backgroundColor: selectedUnit === 'Unit2' ? '#16A34A' : 'rgba(34, 197, 94, 0.1)',
                                },
                                minWidth: '80px'
                            }}
                            onClick={() => setSelectedUnit(selectedUnit === 'Unit2' ? null : 'Unit2')}
                        >
                            Unit 2
                        </Button>

                        {/* Clear Unit Filter Button */}
                        {selectedUnit && (
                            <Button
                                variant="outlined"
                                sx={{
                                    color: '#6B7280',
                                    borderColor: '#6B7280',
                                    '&:hover': {
                                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                                        borderColor: '#6B7280',
                                    },
                                    minWidth: '80px',
                                    ml: 1
                                }}
                                onClick={() => setSelectedUnit(null)}
                            >
                                Clear Unit
                            </Button>
                        )}
                    </Box>
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
                        filterOptions={["Deckal"]}
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
                    rowData={filteredOrders as any}
                    totalCount={totalCount}
                    pagination={pagination}
                    renderExpandedRow={canViewGlobal && !canStatus ? renderExpandedRow : undefined}
                    renderRow={(row: OrderRow) => {
                        const rowBackgroundColor = getRowBackgroundColor(row);

                        return (<>
                            {/* Order No */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography fontSize="14px" color="#6B7280">
                                        QP-{row.orderNo || "N/A"}
                                    </Typography>
                                    {row.isUrgent && (
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
                                            URGENT
                                        </Box>
                                    )}
                                </Box>
                            </TableCell >

                            {/* Unit No */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>{`${row.unitNo || "N/A"} ${row.unitType || ""}`}</Typography>
                            </TableCell>

                            {/* Date */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography fontSize="14px" color="#6B7280">
                                    {formatDate(row.createdAt) || "N/A"}
                                </Typography>
                            </TableCell>

                            {/* Box Size */}
                            <TableCell sx={{ whiteSpace: "nowrap", backgroundColor: rowBackgroundColor }}>
                                <Typography>{`${row.orderdata?.length || "N/A"} x ${row.orderdata?.width || "N/A"} x ${row.orderdata?.height || "N/A"}`}</Typography>
                            </TableCell>

                            {/* Top */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>{`${row.orderdata?.paper1GSM || "N/A"}`}</Typography>
                            </TableCell>

                            {/* Corogation */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>{`${row.orderdata?.paper2GSM || "N/A"}`}</Typography>
                            </TableCell>

                            {/* Bottom */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>{row.orderdata?.paper3GSM || "N/A"}</Typography>
                            </TableCell>

                            {/* Ply */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>{row.orderdata?.ply || "N/A"}</Typography>
                            </TableCell>

                            {/* Deckal */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>{row.orderdata?.deckal || "N/A"}</Typography>
                            </TableCell>

                            {/* Liner */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>
                                    {row.orderdata?.linear || Number(row.orderdata.ply) - 1}
                                </Typography>
                            </TableCell>

                            {/* No of Liner */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>
                                    {row.orderdata?.noOfLinear || Number(row.noOfPieces) * 2 * (Number(row.orderdata.ply) - 1)}
                                </Typography>
                            </TableCell>

                            {/* Piece */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>{row.noOfPieces || "N/A"}</Typography>
                            </TableCell>

                            {/* Cutting length */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>
                                    {row.orderdata?.cuttingLength || (Number(row.orderdata.length) + Number(row.orderdata.width) + 2).toString()}
                                </Typography>
                            </TableCell>
                            
                            {/* no of sheet to cut */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>
                                    {row.orderdata?.noOfSheetCut || (Number(row.orderdata.noOfPieces)) * 2}
                                </Typography>
                            </TableCell>

                            {/* Total KG */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography>{row.totalKg || "N/A"}</Typography>
                            </TableCell>

                            {/* Party Name */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <Typography fontSize="14px" color="#6B7280">
                                    {row.party?.partyName || "N/A"}
                                </Typography>
                            </TableCell>

                            {/* Status */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <StatusCell row={row} />
                            </TableCell>

                            {/* No of piece */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
                                <ThemeInput
                                    placeholder="sheet"
                                    type="number"
                                    sx={{ width: 70, padding: "0" }}
                                    value={
                                        pieceInputs[row._id] !== undefined
                                            ? pieceInputs[row._id]
                                            : row.operatorNoOfSheet || ""
                                    }
                                    onChange={(e) =>
                                        setPieceInputs((prev) => ({ ...prev, [row._id]: e.target.value }))
                                    }
                                />
                            </TableCell>

                            {/* Actions */}
                            <TableCell sx={{ backgroundColor: rowBackgroundColor }}>
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

            {/* Remarks Modal */}
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
                    <Box>
                        {remarksRow?.salesRemark && (
                            <Box mb={1}>
                                <Typography variant="subtitle2">Sales Remark:</Typography>
                                <Typography variant="body2">{remarksRow.salesRemark}</Typography>
                            </Box>
                        )}

                        {remarksRow?.factoryRemark && (
                            <Box mb={1}>
                                <Typography variant="subtitle2">Factory Remark:</Typography>
                                <Typography variant="body2">{remarksRow.factoryRemark}</Typography>
                            </Box>
                        )}

                        {remarksRow?.godownRemark && (
                            <Box mb={1}>
                                <Typography variant="subtitle2">Godown Remark:</Typography>
                                <Typography variant="body2">{remarksRow.godownRemark}</Typography>
                            </Box>
                        )}

                        {remarksRow?.dyeRemark && (
                            <Box mb={1}>
                                <Typography variant="subtitle2">Dye Remark:</Typography>
                                <Typography variant="body2">{remarksRow.dyeRemark}</Typography>
                            </Box>
                        )}
                    </Box>

                    <Box textAlign="right" mt={2}>
                        <ThemeButton onClick={() => setRemarksOpen(false)}>Close</ThemeButton>
                    </Box>
                </Box>
            </Modal>

            {/* Add/Edit Order Dialog */}
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
import React, { useEffect, useState, useMemo } from "react"
import { Box, IconButton, TableCell, Typography, Modal, Checkbox, Button, Chip } from "@mui/material"
import BasicTable from "@/component/common_component/Table/themetable"
import { useRouter } from "next/router"
import ThemeButton from "@/component/common_component/themebutton"
import { useAppDispatch, useAppSelector } from "@/store"
import { authService } from "@/services/auth.service"
import FilterDropdown from "@/component/fillter"
import DateRangePicker from "@/component/daterangepicker"
import { FiSearch, FiUpload } from "react-icons/fi"
import { InputBase } from "@mui/material"
import { bulkUpdateQPOrderStatusThunk, getAllQPOrdersThunk } from "@/store/slices/qpOrderSlice"
import { toast } from "react-toastify"
import { StatusCell } from "./StatusCell"
import Loader from "../common_component/loader"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import Request from "@/services/axios"

const columns = [
    { id: "select", label: "Select" },
    { id: "orderNo", label: "Order No" },
    { id: "party", label: "Party Name" },
    { id: "noOfBox", label: "No of Box" },
    { id: "status", label: "Status" },
    { id: "deliveryStatus", label: "Delivery Status" },
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
    deliveryStatus: string
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
}

// File upload function
const uploadFilesToServer = async (files: File[], folder: string): Promise<any[]> => {
    const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";
    const formData = new FormData();

    files.forEach((file) => {
        formData.append("files", file);
    });

    formData.append("folder", folder);

    try {
        const response = await Request.post(`${BaseURL}/api/fileUpload/multiple`, formData);
        console.log("File upload response:", response);

        if (!response.status === 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.data.data || [];
    } catch (error) {
        console.error("Error uploading files:", error);
        throw error;
    }
};

const DriverView = () => {
    const [open, setOpen] = React.useState(false)
    const [remarksOpen, setRemarksOpen] = useState(false);
    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
    const [remarksRow, setRemarksRow] = useState<OrderRow | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [billPhotos, setBillPhotos] = useState<File[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [selectionType, setSelectionType] = useState<'completed' | 'loading' | null>(null);

    const router = useRouter()
    const dispatch = useAppDispatch()
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

    // Filter orders to show only orders that can be processed by driver
    const driverOrders = useMemo(() => {
        return orders.filter((order: OrderRow) =>
            order.status === 'Completed' ||
            order.deliveryStatus === 'loading' ||
            order.deliveryStatus === 'in_transit' ||
            !order.deliveryStatus ||
            order.deliveryStatus === 'not_started'
        );
    }, [orders]);

    const refreshData = () => dispatch(getAllQPOrdersThunk())

    // Helper function to get field value based on column ID
    const getFieldValue = (order: OrderRow, columnId: string): string => {
        switch (columnId) {
            case "orderNo":
                return order.orderNo || "N/A";
            case "party":
                return order.party?.partyName || "N/A";
            case "noOfBox":
                return order.noOfPieces?.toString() || "N/A";
            case "status":
                return order.status || "N/A";
            case "deliveryStatus":
                return order.deliveryStatus || "not_started";
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

    const filteredOrders = useMemo(() => {
        return driverOrders.filter((item) => item.status === 'Completed')?.filter((order: OrderRow) => {
            // Date range filter
            const matchesDateRange =
                (!startDate || new Date(order.createdAt) >= new Date(startDate).setHours(0, 0, 0, 0)) &&
                (!endDate || new Date(order.createdAt) <= new Date(endDate).setHours(23, 59, 59, 999))

            // Search filter
            const matchesSearch = searchQuery
                ? columns.some(column => {
                    const value = getFieldValue(order, column.id);
                    return safeToString(value).toLowerCase().includes(searchQuery.toLowerCase());
                }) ||
                safeToString(order.companyName?.companyName).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.party?.partyName).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.status).toLowerCase().includes(searchQuery.toLowerCase()) ||
                safeToString(order.deliveryStatus).toLowerCase().includes(searchQuery.toLowerCase())
                : true

            // Column filters
            const matchesFilters = Object.keys(filters).every((columnId) => {
                if (filters[columnId].length === 0) return true

                const value = getFieldValue(order, columnId);
                return value && value !== "N/A" && filters[columnId].includes(value.toString())
            })

            return matchesDateRange && matchesSearch && matchesFilters
        })
    }, [driverOrders, startDate, endDate, searchQuery, filters])

    const getUniqueValues = useMemo(() => {
        if (!selectedFilterField) return []

        const columnId = columns.find(col => col.label === selectedFilterField)?.id
        if (!columnId) return []

        const values = driverOrders.map((order: OrderRow) => {
            return getFieldValue(order, columnId)
        })

        return Array.from(new Set(values)).filter((v) => v !== "N/A").sort()
    }, [selectedFilterField, driverOrders])

    // Check if order can be selected based on current selection type
    const canSelectOrder = (order: OrderRow): boolean => {
        if (selectedOrders.length === 0) return true;

        if (!selectionType) return true;

        switch (selectionType) {
            case 'completed':
                return order.status === 'Completed' &&
                    (!order.deliveryStatus || order.deliveryStatus === 'not_started');
            case 'loading':
                return order.deliveryStatus === 'loading';
            default:
                return true;
        }
    }

    // Check if order is disabled for selection
    const isOrderDisabled = (order: OrderRow): boolean => {
        return !canSelectOrder(order);
    }

    // Handle individual order selection
    const handleSelectOrder = (orderId: string, order: OrderRow) => {
        // Determine selection type based on the first selected order
        if (selectedOrders.length === 0) {
            if (order.status === 'Completed' && (!order.deliveryStatus || order.deliveryStatus === 'not_started')) {
                setSelectionType('completed');
            } else if (order.deliveryStatus === 'loading') {
                setSelectionType('loading');
            }
        }

        setSelectedOrders(prev => {
            if (prev.includes(orderId)) {
                // If deselecting the last order, reset selection type
                if (prev.length === 1) {
                    setSelectionType(null);
                }
                return prev.filter(id => id !== orderId);
            } else {
                // Only allow selection if order matches current selection type
                if (canSelectOrder(order)) {
                    return [...prev, orderId];
                }
                return prev;
            }
        });
    };

    // Select all orders that are selectable based on current selection type
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            let selectableOrders: string[] = [];

            if (!selectionType) {
                // If no selection type, allow selecting any order
                selectableOrders = filteredOrders.map((order: OrderRow) => order._id);
            } else {
                // Select only orders that match the current selection type
                selectableOrders = filteredOrders
                    .filter((order: OrderRow) => canSelectOrder(order))
                    .map((order: OrderRow) => order._id);
            }

            setSelectedOrders(selectableOrders);
            setSelectAll(true);
        } else {
            setSelectedOrders([]);
            setSelectAll(false);
            setSelectionType(null);
        }
    };

    // Load selected orders (change delivery status to loading)
    const handleLoadOrders = async () => {
        if (selectedOrders.length === 0) {
            toast.warning("Please select at least one order to load");
            return;
        }

        try {
            await dispatch(bulkUpdateQPOrderStatusThunk({
                orderIds: selectedOrders,
                deliveryStatus: 'loading'
            })).unwrap();

            toast.success("Orders loaded successfully");
            setSelectedOrders([]);
            setSelectAll(false);
            setSelectionType(null);
            refreshData();
        } catch (error) {
            toast.error("Failed to load orders");
        }
    };

    // Handle delivery submission
    const handleDeliverySubmit = async () => {
        if (selectedOrders.length === 0) {
            toast.warning("Please select orders for delivery");
            return;
        }

        if (billPhotos.length === 0) {
            toast.warning("Please upload bill photos");
            return;
        }

        try {
            // Upload bill photos using the provided function
            const uploadedPhotos = await uploadFilesToServer(billPhotos, 'bill-photos');
            const imageUrls = uploadedPhotos.map(photo => ({
                url: photo.url || photo.path,
                filename: photo.filename || `bill_${Date.now()}`
            }));

            await dispatch(bulkUpdateQPOrderStatusThunk({
                orderIds: selectedOrders,
                deliveryStatus: 'in_transit',
                billPhotos: imageUrls
            })).unwrap();

            toast.success("Orders marked as in transit successfully");
            setSelectedOrders([]);
            setBillPhotos([]);
            setDeliveryModalOpen(false);
            setSelectAll(false);
            setSelectionType(null);
            refreshData();
        } catch (error) {
            console.error("Delivery submission error:", error);
            toast.error("Failed to update delivery status");
        }
    };

    // Handle file input for bill photos
    const handleBillPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newPhotos = Array.from(files);
            setBillPhotos(prev => [...prev, ...newPhotos]);
        }
    };

    // Remove a bill photo
    const removeBillPhoto = (index: number) => {
        setBillPhotos(prev => prev.filter((_, i) => i !== index));
    };

    // Get selection info text
    const getSelectionInfo = () => {
        if (selectedOrders.length === 0) return null;

        if (selectionType === 'completed') {
            return `Selected ${selectedOrders.length} completed order(s) ready for loading`;
        } else if (selectionType === 'loading') {
            return `Selected ${selectedOrders.length} loaded order(s) ready for delivery`;
        }

        return `Selected ${selectedOrders.length} order(s)`;
    };

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
                            .filter((col) => col.id !== "action" && col.id !== "select")
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
                </Box>
            </Box>

            {/* Selection Info */}
            {getSelectionInfo() && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.contrastText">
                        {getSelectionInfo()}
                    </Typography>
                </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 2 }}>
                {selectedOrders.length > 0 && (
                    <>
                        {/* Show Load Orders button only for completed orders */}
                        {selectionType === 'completed' && (
                            <ThemeButton onClick={handleLoadOrders}>
                                Load Selected Orders ({selectedOrders.length})
                            </ThemeButton>
                        )}

                        {/* Show Going to Delivery button only for loading orders */}
                        {selectionType === 'loading' && (
                            <ThemeButton onClick={() => setDeliveryModalOpen(true)}>
                                Mark as In Transit ({selectedOrders.length})
                            </ThemeButton>
                        )}
                    </>
                )}
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
                    renderHeader={() => (
                        <>
                            <TableCell>
                                <Checkbox
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    indeterminate={selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length}
                                />
                            </TableCell>
                            {columns.slice(1).map((column) => (
                                <TableCell key={column.id}>{column.label}</TableCell>
                            ))}
                        </>
                    )}
                    renderRow={(row: OrderRow) => {
                        const isDisabled = isOrderDisabled(row);
                        const isSelected = selectedOrders.includes(row._id);

                        return (
                            <>
                                <TableCell>
                                    <Checkbox
                                        checked={isSelected}
                                        onChange={() => handleSelectOrder(row._id, row)}
                                        disabled={isDisabled && !isSelected}
                                        sx={{
                                            '&.Mui-disabled': {
                                                color: isSelected ? 'primary.main' : 'text.disabled',
                                            }
                                        }}
                                    />
                                </TableCell>
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
                                    <Typography>{row.noOfPieces || "N/A"}</Typography>
                                </TableCell>
                                <TableCell>
                                    <StatusCell row={row} />
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        sx={{
                                            fontWeight: 'bold',
                                            color: row.deliveryStatus === 'loading' ? 'warning.main' :
                                                row.deliveryStatus === 'in_transit' ? 'info.main' :
                                                    row.deliveryStatus === 'delivered' ? 'success.main' : 'text.secondary'
                                        }}
                                    >
                                        {row.deliveryStatus === 'loading' ? "Load for Delivery" : row.deliveryStatus === 'in_transit' ? "Dispatched" : ""}
                                    </Typography>
                                </TableCell>
                            </>
                        );
                    }}
                />
            </Box>

            {/* Delivery Modal */}
            <Modal open={deliveryModalOpen} onClose={() => setDeliveryModalOpen(false)}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 500,
                        bgcolor: "background.paper",
                        p: 3,
                        borderRadius: 2,
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}
                >
                    <Typography variant="h6" mb={2}>
                        Upload Bill Photos for Delivery
                    </Typography>

                    <Typography variant="body2" mb={2}>
                        Selected Orders: {selectedOrders.length}
                    </Typography>

                    {/* File Upload */}
                    <Box mb={3}>
                        <input
                            type="file"
                            id="bill-photos"
                            multiple
                            accept="image/*"
                            onChange={handleBillPhotoUpload}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="bill-photos">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={<FiUpload />}
                                sx={{ mb: 2 }}
                            >
                                Upload Bill Photos
                            </Button>
                        </label>

                        {/* Display uploaded photos */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {billPhotos.map((photo, index) => (
                                <Box key={index} sx={{ position: 'relative' }}>
                                    <Chip
                                        label={`Photo ${index + 1}`}
                                        onDelete={() => removeBillPhoto(index)}
                                        variant="outlined"
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <ThemeButton onClick={() => setDeliveryModalOpen(false)}>
                            Cancel
                        </ThemeButton>
                        <ThemeButton
                            onClick={handleDeliverySubmit}
                            disabled={billPhotos.length === 0}
                        >
                            Mark as In Transit
                        </ThemeButton>
                    </Box>
                </Box>
            </Modal>

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
        </>
    );
};

export default DriverView;
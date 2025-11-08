"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Box, IconButton, TableCell, Typography, Modal, Checkbox, Button, Chip, InputBase, FormControl, FormLabel } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { authService } from "@/services/auth.service";
import DateRangePicker from "@/component/daterangepicker";
import { FiSearch, FiUpload } from "react-icons/fi";
import { bulkUpdateQPOrderStatusThunk, getAllQPOrdersThunk, removeLoadingOrderThunk } from "@/store/slices/qpOrderSlice";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import { toast } from "react-toastify";
import Loader from "../common_component/loader";
import { StatusCell } from "./StatusCell";
import Request from "@/services/axios";
import { getUserData } from "@/utills/utills";

const columns = [
    { id: "select", label: "Select" },
    { id: "orderNo", label: "Order No" },
    { id: "party", label: "Party Name" },
    { id: "market", label: "Market" },
    { id: "area", label: "Area" },
    { id: "noOfBox", label: "No of Box" },
    { id: "deliverto", label: "DeliverTo" },
    { id: "status", label: "Status" },
    { id: "deliveryStatus", label: "Delivery Status" },
    { id: "actions", label: "Actions" },
];

// Upload files to server
const uploadFilesToServer = async (files: File[], folder: string): Promise<any[]> => {
    const BaseURL = process.env.NEXT_PUBLIC_API_URL;
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("folder", folder);

    try {
        const response = await Request.post(`${BaseURL}/api/fileUpload/multiple`, formData);
        return response.data.data || [];
    } catch (error) {
        console.error("Error uploading files:", error);
        throw error;
    }
};

export const driverService = {
    backToFactory: async (driverId, factoryPhotos) => {
        const BaseURL = process.env.NEXT_PUBLIC_API_URL;
        const response = await Request.post(`${BaseURL}/api/factoryReturn/create`, {
            driverId,
            factoryPhotos,
        });
        return response.data;
    },
};

const DriverView = () => {
    const [selectAll, setSelectAll] = useState(false);
    const [billPhotos, setBillPhotos] = useState<File[]>([]);
    const [dispatchPhotos, setDispatchPhotos] = useState<File[]>([]);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
    const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
    const [deliveredModalOpen, setDeliveredModalOpen] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
    const [currentDispatchOrder, setCurrentDispatchOrder] = useState<any>(null);
    const [currentDeliveredOrder, setCurrentDeliveredOrder] = useState<any>(null);
    const [selectionType, setSelectionType] = useState<"completed" | "loading" | null>(null);
    const [factoryModalOpen, setFactoryModalOpen] = useState(false);
    const [factoryPhotos, setFactoryPhotos] = useState<File[]>([]);
    const [billNumber, setBillNumber] = useState("");

    const dispatch = useAppDispatch();
    const { companies } = useAppSelector((state) => state.company);
    const user = getUserData()
    const { orders, loading, totalCount, pagination } = useAppSelector((state) => state.qpOrders);

    // Filter only driver-relevant orders
    const driverOrders = useMemo(() => {
        return orders.filter((order: any) => {
            const deliveryMatch =
                order?.status === "Completed" ||
                order?.deliveryStatus === "loading" ||
                order?.deliveryStatus === "in_transit" ||
                !order?.deliveryStatus ||
                order?.deliveryStatus === "not_started";

            const driverMatch =
                !order?.driver ||
                order?.driver === user?.id ||
                order.driver?._id === user?.id;

            return deliveryMatch && driverMatch;
        });
    }, [orders, user]);


    const refreshData = () => dispatch(getAllQPOrdersThunk());

    const getFieldValue = (order: any, columnId: string): string => {
        switch (columnId) {
            case "orderNo": return order.orderNo || "N/A";
            case "party": return order.party?.partyName || "N/A";
            case "noOfBox": return order.noOfPieces?.toString() || "N/A";
            case "status": return order?.status || "N/A";
            case "deliveryStatus": return order?.deliveryStatus || "not_started";
            default: return "N/A";
        }
    };

    const safeToString = (value: any): string => {
        if (value === null || value === undefined) return "";
        if (typeof value === "string") return value;
        if (typeof value === "number") return value.toString();
        if (typeof value === "boolean") return value.toString();
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
    };

    const filteredOrders = useMemo(() => {
        return driverOrders.filter((item) => item?.status === "Completed")?.filter((order: any) => {
            const matchesDateRange =
                (!startDate || new Date(order.createdAt) >= new Date(startDate).setHours(0, 0, 0, 0)) &&
                (!endDate || new Date(order.createdAt) <= new Date(endDate).setHours(23, 59, 59, 999));

            const matchesSearch = searchQuery
                ? columns.some((column) => safeToString(getFieldValue(order, column.id)).toLowerCase().includes(searchQuery.toLowerCase()))
                : true;

            const matchesFilters = Object.keys(filters).every((columnId) => {
                if (filters[columnId].length === 0) return true;
                const value = getFieldValue(order, columnId);
                return value && filters[columnId].includes(value.toString());
            });

            return matchesDateRange && matchesSearch && matchesFilters;
        });
    }, [driverOrders, startDate, endDate, searchQuery, filters]);

    const canSelectOrder = (order: any) => {
        if (user?.isDisptach && order?.status === "Completed" && (!order?.deliveryStatus || order?.deliveryStatus === "not_started")) {
            return false;
        }

        if (selectedOrders.length === 0) return true;
        if (!selectionType) return true;
        switch (selectionType) {
            case "completed": return order?.status === "Completed" && (!order?.deliveryStatus || order?.deliveryStatus === "not_started");
            case "loading": return order?.deliveryStatus === "loading";
            default: return true;
        }
    };

    const isOrderDisabled = (order: any) => !canSelectOrder(order);

    const handleSelectOrder = (orderId: string, order: any) => {
        if (user?.isDisptach && order?.status === "Completed" && (!order?.deliveryStatus || order?.deliveryStatus === "not_started")) {
            toast.error("You have ongoing dispatch. Complete deliveries before selecting new orders.");
            return;
        }

        if (selectedOrders.length === 0) {
            if (order?.status === "Completed" && (!order?.deliveryStatus || order?.deliveryStatus === "not_started")) setSelectionType("completed");
            else if (order?.deliveryStatus === "loading") setSelectionType("loading");
        }

        setSelectedOrders((prev) => {
            if (prev.includes(orderId)) {
                if (prev.length === 1) setSelectionType(null);
                return prev.filter((id) => id !== orderId);
            } else if (canSelectOrder(order)) {
                return [...prev, orderId];
            }
            return prev;
        });
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (user?.isDisptach) {
            toast.error("You have ongoing dispatch. Complete deliveries before selecting new orders.");
            return;
        }

        if (event.target.checked) {
            const selectableOrders = !selectionType
                ? filteredOrders.map((o: any) => o._id)
                : filteredOrders.filter((o: any) => canSelectOrder(o)).map((o: any) => o._id);
            setSelectedOrders(selectableOrders);
            setSelectAll(true);
        } else {
            setSelectedOrders([]);
            setSelectAll(false);
            setSelectionType(null);
        }
    };

    const handleLoadOrders = async () => {
        console.log("DEBUG : handleLoadOrders : user:", user);

        if (user?.isDisptach) {
            toast.error("You are currently on delivery. Complete all deliveries before loading new orders.");
            return;
        }

        if (selectedOrders.length === 0) {
            return toast.warning("Please select at least one order to load");
        }

        try {
            await dispatch(
                bulkUpdateQPOrderStatusThunk({
                    orderIds: selectedOrders,
                    deliveryStatus: "loading",
                })
            ).unwrap();
            toast.success("Orders loaded successfully");
            setSelectedOrders([]);
            setSelectAll(false);
            setSelectionType(null);
            refreshData();
        } catch {
            toast.error("Failed to load orders");
        }
    };


    const handleDeliverySubmit = async () => {
        if (selectedOrders.length === 0) return toast.warning("Please select orders for delivery");
        if (billPhotos.length === 0) return toast.warning("Please upload bill photos");
        try {
            const uploadedPhotos = await uploadFilesToServer(billPhotos, "bill-photos");
            const imageUrls = uploadedPhotos.map((p) => p.path);
            await dispatch(bulkUpdateQPOrderStatusThunk({
                orderIds: selectedOrders,
                deliveryStatus: "in_transit",
                billPhotos: imageUrls
            })).unwrap();
            toast.success("Orders marked as in transit successfully");
            setSelectedOrders([]);
            setBillPhotos([]);
            setDeliveryModalOpen(false);
            setSelectAll(false);
            setSelectionType(null);
            refreshData();
        } catch {
            toast.error("Failed to update delivery status");
        }
    };

    const handleDispatchSubmit = async () => {
        if (!currentDispatchOrder) return;
        if (dispatchPhotos.length === 0) return toast.warning("Please upload dispatch photos");
        if (!billNumber) return toast.warning("Please enter a bill number");

        try {
            const uploadedPhotos = await uploadFilesToServer(dispatchPhotos, "dispatch-photos", billNumber);
            const imageUrls = uploadedPhotos.map((p) => p.path);

            const response:any = await dispatch(
                bulkUpdateQPOrderStatusThunk({
                    orderIds: [currentDispatchOrder._id],
                    deliveryStatus: "in_transit",
                    dispatchPhotos: imageUrls,
                    dispatchTime: new Date().toISOString(),
                    billNumber,
                })
            ).unwrap();

            toast.success("Order dispatched successfully");

            // 🟢 Update localStorage (isDisptach = true)
            const updatedDriver = response?.data?.[0]?.driver;
            console.log("DEBUG : handleDispatchSubmit : updatedDriver:", updatedDriver);

            console.log("DEBUG : handleDispatchSubmit : response:", response);

            if (updatedDriver) {
                const storedUser = JSON.parse(localStorage.getItem("user"));
                const updatedUser = { ...storedUser, isDisptach: updatedDriver.isDisptach };
                console.log("DEBUG : handleDispatchSubmit : updatedDriver.isDisptach: ispe true hoga ", updatedDriver.isDisptach);
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }

            setDispatchModalOpen(false);
            setDispatchPhotos([]);
            setBillNumber("");
            setCurrentDispatchOrder(null);
            refreshData();
        } catch {
            toast.error("Failed to dispatch order");
        }
    };

    const handleDeliveredSubmit = async () => {
        if (!currentDeliveredOrder) return;
        if (billPhotos.length === 0) return toast.warning("Please upload delivery photos");

        try {
            const uploadedPhotos = await uploadFilesToServer(billPhotos, "delivery-photos", "");
            const imageUrls = uploadedPhotos.map((p) => p.path);

            const response = await dispatch(
                bulkUpdateQPOrderStatusThunk({
                    orderIds: [currentDeliveredOrder._id],
                    deliveryStatus: "delivered",
                    billPhotos: imageUrls,
                    // step:currentDeliveredOrder.step,
                    deliveryTime: new Date().toISOString(),
                })
            ).unwrap();

            toast.success("Order marked as delivered successfully");

            // 🟡 Update localStorage (isDisptach = false when all delivered)
            const updatedDriver = response?.data?.[0]?.driver;
            console.log("DEBUG : handleDeliveredSubmit : updatedDriver:", updatedDriver);

            console.log("DEBUG : handleDeliveredSubmit : response:", response);

            if (updatedDriver) {
                const storedUser = JSON.parse(localStorage.getItem("user"));
                const updatedUser = { ...storedUser, isDisptach: updatedDriver.isDisptach };
                console.log("DEBUG : handleDeliveredSubmit : updatedDriver.isDisptach: deliver dipstach need to be false at last order", updatedDriver.isDisptach);

                localStorage.setItem("user", JSON.stringify(updatedUser));
            }

            setDeliveredModalOpen(false);
            setBillPhotos([]);
            setCurrentDeliveredOrder(null);
            refreshData();
        } catch {
            toast.error("Failed to mark order as delivered");
        }
    };

    const handleBackToFactorySubmit = async () => {
        if (factoryPhotos.length === 0) return toast.warning("Please upload factory photos");

        try {
            const uploadedPhotos = await uploadFilesToServer(factoryPhotos, "factory-photos", "");
            const imageUrls = uploadedPhotos.map((p) => p.path);

            const response = await driverService.backToFactory(user?.id, imageUrls);

            if (response?.success) {
                toast.success("Back to factory recorded successfully");

                // 🟡 Update localStorage: set isDisptach = false
                const storedUser = JSON.parse(localStorage.getItem("user"));
                const updatedUser = { ...storedUser, isDisptach: false };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                setFactoryModalOpen(false);
                setFactoryPhotos([]);
                refreshData();
            } else {
                toast.error(response?.message || "Failed to record back to factory");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to record back to factory");
        }
    };

    const handleRemoveLoading = async (orderId: string) => {
        console.log("DEBUG : handleRemoveLoading : orderId:", orderId);

        try {
            const result = await dispatch(removeLoadingOrderThunk(orderId)).unwrap();
            toast.success("Order removed from loading successfully");
            if (result) refreshData();
        } catch (err: any) {
            toast.error(err || "Failed to remove loading");
        }
    };


    useEffect(() => { if (!companies.length) dispatch(getAllCompaniesThunk(true)); }, []);
    useEffect(() => {
        const token = authService.getToken();
        if (!token) return;
        if (!orders.length) refreshData();
    }, [dispatch, orders]);

    if (loading) return <Loader />;

    return (
        <>
            {/* Table Filters */}
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <DateRangePicker startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
                    <ThemeButton onClick={() => { setStartDate(null); setEndDate(null); }}>Clear Date Range</ThemeButton>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", border: "1px solid #D0D5DD", borderRadius: 2, px: 1.5, width: 200, height: 35 }}>
                        <IconButton size="small" sx={{ color: "#98A2B3" }}><FiSearch /></IconButton>
                        <InputBase placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ ml: 1, fontSize: 14 }} />
                    </Box>
                </Box>
            </Box>

            {/* Action Buttons */}
            {selectedOrders.length > 0 && (
                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                    {selectionType === "completed" && (
                        <ThemeButton
                            onClick={handleLoadOrders}
                            disabled={user?.isDisptach} // 🚫 disable when already dispatched
                            title={user?.isDisptach ? "You have ongoing dispatch. Complete all deliveries before loading new orders." : ""}
                        >
                            {user?.isDisptach ? "Dispatch In Progress" : `Load Selected Orders (${selectedOrders.length})`}
                        </ThemeButton>
                    )}
                    {selectionType === "loading" && <ThemeButton onClick={() => setDeliveryModalOpen(true)}>Mark as In Transit ({selectedOrders.length})</ThemeButton>}
                </Box>
            )}
            {user?.isDisptach && filteredOrders.every(o => o?.deliveryStatus !== "in_transit" && o?.deliveryStatus !== "loading") && (
                <Box sx={{ mt: 3 }}>
                    <ThemeButton onClick={() => setFactoryModalOpen(true)}>
                        Back to Factory
                    </ThemeButton>
                </Box>
            )}

            {/* Table */}
            <Box py={2}>
                <BasicTable
                    showDatePicker={false}
                    tableHeader={columns}
                    showFillter={false}
                    showSearch={false}
                    rowData={filteredOrders}
                    totalCount={totalCount}
                    pagination={pagination}
                    renderHeader={() => (
                        <>
                            <TableCell>
                                <Checkbox checked={selectAll} onChange={handleSelectAll} indeterminate={selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length} />
                            </TableCell>
                            {columns.slice(1).map((col) => <TableCell key={col.id}>{col.label}</TableCell>)}
                        </>
                    )}
                    renderRow={(row: any) => {
                        const isDisabled = isOrderDisabled(row) || row?.deliveryStatus === "delivered"; // disable if delivered
                        const isSelected = selectedOrders.includes(row._id);
                        return (
                            <>
                                <TableCell>
                                    <Checkbox
                                        checked={isSelected}
                                        onChange={() => handleSelectOrder(row._id, row)}
                                        disabled={
                                            isDisabled ||
                                            row?.deliveryStatus === "in_transit" ||
                                            row?.deliveryStatus === "loading" ||
                                            (user?.isDisptach && row?.status === "Completed" && (!row?.deliveryStatus || row?.deliveryStatus === "not_started"))
                                        }
                                    />
                                </TableCell>
                                <TableCell>{row.orderNo}</TableCell>
                                <TableCell>{`${row.party?.partyName} - ${row.party?.address?.unitNo} - ${row.party?.address?.marketName?.marketName} - ${row.party?.address?.area?.area}`}</TableCell>
                                <TableCell>{`${row.party?.address?.marketName?.marketName}`}</TableCell>
                                <TableCell>{`${row.party?.address?.area?.area}`}</TableCell>
                                <TableCell>{row.noOfPieces}</TableCell>
                                <TableCell>{row.deliverTo}</TableCell>
                                <TableCell><StatusCell row={row} /></TableCell>
                                <TableCell>
                                    <Chip
                                        label={
                                            row?.deliveryStatus === "loading"
                                                ? "Loading"
                                                : row?.deliveryStatus === "delivered"
                                                    ? "Delivered"
                                                    : row?.deliveryStatus === "in_transit"
                                                        ? "Dispatched"
                                                        : "Not Started"
                                        }
                                        sx={{
                                            bgcolor:
                                                row?.deliveryStatus === "delivered"
                                                    ? "#2e7d32" // green
                                                    : row?.deliveryStatus === "loading"
                                                        ? "#fbc02d" // yellow
                                                        : row?.deliveryStatus === "in_transit"
                                                            ? "#1976d2" // blue
                                                            : "#d32f2f", // red
                                            color:
                                                row?.deliveryStatus === "loading" ? "#000" : "#fff",
                                            fontWeight: 600,
                                            textTransform: "capitalize",
                                            px: 1,
                                            borderRadius: "6px",
                                        }}
                                    />
                                </TableCell>

                                <TableCell>
                                    {row?.deliveryStatus === "loading" && row?.status === "Completed" && (
                                        <>
                                            <ThemeButton
                                                onClick={() => {
                                                    setCurrentDispatchOrder(row);
                                                    setDispatchModalOpen(true);
                                                }}
                                                sx={{ mr: 1, }}
                                            >
                                                Mark as Dispatched
                                            </ThemeButton>

                                            {/* Remove Loading visible only when not yet dispatched */}
                                            {!user?.isDisptach && (
                                                <ThemeButton
                                                    color="error"
                                                    onClick={() => handleRemoveLoading(row._id)}
                                                >
                                                    Remove Loading
                                                </ThemeButton>
                                            )}
                                        </>
                                    )}

                                    {row?.deliveryStatus === "in_transit" && (
                                        <ThemeButton onClick={() => { setCurrentDeliveredOrder(row); setDeliveredModalOpen(true); }}>Mark as Delivered</ThemeButton>
                                    )}
                                </TableCell>
                            </>
                        );
                    }}


                />
            </Box>

            {/* Dispatch Modal */}
            <Modal open={dispatchModalOpen} onClose={() => setDispatchModalOpen(false)}>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, bgcolor: "background.paper", p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" mb={2}>Upload Dispatch Photos</Typography>
                    <Typography variant="body2" mb={2}>Order No: <strong>{currentDispatchOrder?.orderNo}</strong></Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <FormLabel required>Bill Number</FormLabel>
                        <InputBase
                            value={billNumber}
                            onChange={(e) => setBillNumber(e.target.value)}
                            placeholder="Enter Bill Number"
                            sx={{ border: "1px solid #D0D5DD", borderRadius: 1, px: 1, py: 0.5 }}
                        />
                    </FormControl>
                    <input
                        type="file"
                        id="dispatch-photos"
                        multiple
                        accept="image/*"
                        onChange={(e) => { if (e.target.files) setDispatchPhotos(Array.from(e.target.files)); }}
                        style={{ display: "none" }}
                    />
                    <label htmlFor="dispatch-photos">
                        <Button variant="outlined" component="span" startIcon={<FiUpload />} sx={{ mb: 2 }}>
                            Upload Dispatch Photos
                        </Button>
                    </label>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {dispatchPhotos.map((photo, i) => (
                            <Chip
                                key={i}
                                label={`Photo ${i + 1}`}
                                onDelete={() => setDispatchPhotos(prev => prev.filter((_, idx) => idx !== i))}
                            />
                        ))}
                    </Box>

                    <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
                        <ThemeButton onClick={() => {
                            setDispatchModalOpen(false);
                            setBillNumber("");
                        }}>
                            Cancel
                        </ThemeButton>
                        <ThemeButton
                            onClick={handleDispatchSubmit}
                            disabled={dispatchPhotos.length === 0 || !billNumber}
                        >
                            Dispatch Order
                        </ThemeButton>
                    </Box>
                </Box>
            </Modal>

            {/* Delivery Modal (for bulk in-transit) */}
            <Modal open={deliveryModalOpen} onClose={() => setDeliveryModalOpen(false)}>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, bgcolor: "background.paper", p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" mb={2}>Upload Bill Photos for Delivery</Typography>
                    <input
                        type="file"
                        id="bill-photos"
                        multiple
                        accept="image/*"
                        onChange={(e) => { if (e.target.files) setBillPhotos(Array.from(e.target.files)); }}
                        style={{ display: "none" }}
                    />
                    <label htmlFor="bill-photos">
                        <Button variant="outlined" component="span" startIcon={<FiUpload />} sx={{ mb: 2 }}>
                            Upload Bill Photos
                        </Button>
                    </label>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {billPhotos.map((photo, i) => (
                            <Chip
                                key={i}
                                label={`Photo ${i + 1}`}
                                onDelete={() => setBillPhotos(prev => prev.filter((_, idx) => idx !== i))}
                            />
                        ))}
                    </Box>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
                        <ThemeButton onClick={() => setDeliveryModalOpen(false)}>Cancel</ThemeButton>
                        <ThemeButton onClick={handleDeliverySubmit} disabled={billPhotos.length === 0}>
                            Mark as In Transit
                        </ThemeButton>
                    </Box>
                </Box>
            </Modal>

            {/* Delivered Modal */}
            <Modal open={deliveredModalOpen} onClose={() => setDeliveredModalOpen(false)}>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, bgcolor: "background.paper", p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" mb={2}>Upload Delivery Photos</Typography>
                    <Typography variant="body2" mb={2}>Order No: <strong>{currentDeliveredOrder?.orderNo}</strong></Typography>

                    <input type="file" id="delivery-photos" multiple accept="image/*" onChange={(e) => { if (e.target.files) setBillPhotos(Array.from(e.target.files)); }} style={{ display: "none" }} />
                    <label htmlFor="delivery-photos">
                        <Button variant="outlined" component="span" startIcon={<FiUpload />} sx={{ mb: 2 }}>Upload Delivery Photos</Button>
                    </label>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {billPhotos.map((photo, i) => <Chip key={i} label={`Photo ${i + 1}`} onDelete={() => setBillPhotos(prev => prev.filter((_, idx) => idx !== i))} />)}
                    </Box>

                    <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
                        <ThemeButton onClick={() => setDeliveredModalOpen(false)}>Cancel</ThemeButton>
                        <ThemeButton onClick={handleDeliveredSubmit} disabled={billPhotos.length === 0}>Mark as Delivered</ThemeButton>
                    </Box>
                </Box>
            </Modal>

            <Modal open={factoryModalOpen} onClose={() => setFactoryModalOpen(false)}>
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
                    }}
                >
                    <Typography variant="h6" mb={2}>
                        Upload Factory Arrival Photos
                    </Typography>

                    <input
                        type="file"
                        id="factory-photos"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files) setFactoryPhotos(Array.from(e.target.files));
                        }}
                        style={{ display: "none" }}
                    />
                    <label htmlFor="factory-photos">
                        <Button
                            variant="outlined"
                            component="span"
                            startIcon={<FiUpload />}
                            sx={{ mb: 2 }}
                        >
                            Upload Photos
                        </Button>
                    </label>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {factoryPhotos.map((photo, i) => (
                            <Chip
                                key={i}
                                label={`Photo ${i + 1}`}
                                onDelete={() =>
                                    setFactoryPhotos((prev) => prev.filter((_, idx) => idx !== i))
                                }
                            />
                        ))}
                    </Box>

                    <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
                        <ThemeButton onClick={() => setFactoryModalOpen(false)}>Cancel</ThemeButton>
                        <ThemeButton
                            onClick={handleBackToFactorySubmit}
                            disabled={factoryPhotos.length === 0}
                        >
                            Submit
                        </ThemeButton>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export default DriverView;
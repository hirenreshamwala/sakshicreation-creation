"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Box, TextField, Autocomplete, FormControlLabel, Checkbox } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomDialog from "@/component/customdialog";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import {
    createPerformanceInvoiceThunk,
    updatePerformanceInvoiceThunk,
    getPerformanceInvoiceByIdThunk,
    clearSuccessMessage,
    clearError,
} from "@/store/slices/performanceInvoiceSlice"
import { orderService } from "@/services/order.service"
import { performanceInvoiceService } from "@/services/performanceInvoice.service"
import InvoicePDFGenerator from "../InvoicePDFGenerator"
import { assignTaskService } from "@/services/assignTask.service";
import { getAllMarketsThunk } from "@/store/slices/marketDataSlice";
import { updateOrderThunk } from "@/store/slices/orderSlice";

interface FormData {
    orderNumber: string;
    companyName: string;
    partyName: string;
    quantity: number;
    color?: string;
    pType?: string;
    size?: string;
    GSTNo: string;
    remarks?: string;
    ownerMobileNo?: string;
    addressName: string;
    servicePerformance: string;
    unitPrice?: number;
    total?: number;
    applyGST: number;
    finalAmount?: number;
    assignedTo?: string;
    daysAfterConfirmation?: number;
}

interface Order {
    _id: string;
    orderNumber: string;
    companyName: {
        _id: string;
        companyName: string;
    };
    party: {
        _id: string;
        partyName: string;
        GSTNo?: string;
        address?: {
            unitNo?: string;
            streetAddress?: string;
            marketName?: string;
            landMark?: string;
            area?: string;
            pincode?: string;
        };
        ownerMobileNo?: string;
    };
    productItem: {
        _id: string;
        itemName: string;
    };
    color?: string;
    size?: string;
    pType?: string;
    qty: number;
    remarks?: string;
    status: string;
}

interface AddNewPerformanceInvoiceDialogProps {
    open: boolean;
    onClose: () => void;
    invoiceId?: string;
    refreshData?: () => void;
    data?: any;
    orderId: string;
    onInvoiceSaved?: () => void;
}
interface Staff {
    _id: string;
    firstName: string;
    lastName: string;
}
const validationSchema = Yup.object({
    quantity: Yup.number().required("Quantity is required").min(1, "Quantity must be at least 1"),
    unitPrice: Yup.number()
        .required("Unit Price is required")
        .min(0, "Unit Price cannot be negative"),
    applyGST: Yup.boolean(), // Added applyGST to validation
    gstPercentage: Yup.number() // Make conditional in validation
        .min(0, "GST Percentage cannot be negative")
        .max(100, "GST Percentage cannot exceed 100%")
        .when('applyGST', {
            is: true,
            then: (schema) => schema.required("GST Percentage is required when GST is applied"),
            otherwise: (schema) => schema.optional()
        }),
    GSTNo: Yup.string(),
    addressName: Yup.string(),
    servicePerformance: Yup.string().required("Service/Performance is required"),
    daysAfterConfirmation: Yup.number()
        .min(0, "Days after confirmation cannot be negative")
        .optional(),
});

const AddNewQuotation: React.FC<AddNewPerformanceInvoiceDialogProps> = ({
    open,
    onClose,
    invoiceId,
    refreshData,
    data,
    orderId,
    onInvoiceSaved,
}) => {
    const dispatch = useAppDispatch();
    const { loading: invoiceLoading, error: invoiceError } = useAppSelector((state) => state.performanceInvoices);
    const { markets } = useAppSelector((state) => state.markets);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [isEditMode, setIsEditMode] = useState(!!invoiceId);
    const [isUnitPriceValid, setIsUnitPriceValid] = useState(false);
    const [currentInvoiceId, setCurrentInvoiceId] = useState<string | undefined>(invoiceId);

    useEffect(() => {
        if (!markets.length) dispatch(getAllMarketsThunk())
    }, [])

    useEffect(() => {
        if (!open) return;
        dispatch(clearSuccessMessage());
        dispatch(clearError());

        const fetchStaffList = async () => {
            try {
                const response = await assignTaskService.getAllAssignTasks();
                if (response.success && response.data) {
                    // Extract unique staff members from assign tasks
                    const uniqueStaff = new Map<string, Staff>();
                    response.data.forEach(task => {
                        fetchStaffList();
                        if (task.assignTo && typeof task.assignTo === 'object') {
                            const staff = task.assignTo as unknown as Staff;
                            if (!uniqueStaff.has(staff._id)) {
                                uniqueStaff.set(staff._id, staff);
                            }
                        }
                    });
                    setStaffList(Array.from(uniqueStaff.values()));
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to fetch staff list");
            }
        };


        const fetchOrders = async () => {
            try {
                const response = await orderService.getAllOrders();
                if (response.success && Array.isArray(response.data)) {
                    setOrders(response.data);
                } else {
                    toast.error("Invalid response format: orders array not found");
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to fetch orders");
            }
        };
        fetchOrders();
    }, [open, dispatch]);

    const formik = useFormik<FormData>({
        initialValues: {
            orderNumber: "",
            companyName: "",
            partyName: "",
            quantity: 0,
            color: "",
            pType: "",
            size: "",
            GSTNo: "",
            remarks: "",
            ownerMobileNo: "",
            addressName: "",
            servicePerformance: "",
            unitPrice: data?.quotation[data?.quotation?.length -1 ]?.unitPrice || 0,
            total: 0,
            applyGST: false, // Initialize applyGST as false
            gstPercentage: 0,
            finalAmount: 0,
            assignedTo: "",
            daysAfterConfirmation: undefined,
        },
        validationSchema,
        validateOnBlur: true,
        validateOnChange: true,
        onSubmit: async (values, { setSubmitting }) => {
            const validationErrors = await formik.validateForm(values);
            if (Object.keys(validationErrors).length > 0) {
                toast.error(`Validation failed: ${JSON.stringify(validationErrors)}`, { autoClose: 5000 });
                setIsLoading(false);
                setSubmitting(false);
                return;
            }
            if (isEditMode && !currentInvoiceId) {
                toast.error("Invalid invoice ID for update");
                setIsLoading(false);
                setSubmitting(false);
                return;
            }
            setIsLoading(true);
            setSubmitting(true);
            try {

                let response;
                if (isEditMode && currentInvoiceId) {
                    response = await dispatch(updateOrderThunk({ id: data._id, data: { quotation: [...data.quotation, { unitPrice: values.unitPrice }] } })).unwrap();
                    toast.success("Quotation updated successfully");
                } else {
                    response = await dispatch(updateOrderThunk({ id: data._id, data: { quotation: [...data.quotation, { unitPrice: values.unitPrice }] } })).unwrap();
                    toast.success(response.message || "Quotation created successfully");
                }
                setIsSaved(true);
                if (refreshData) refreshData();
                if (onInvoiceSaved) onInvoiceSaved();
            } catch (err: any) {
                console.error("Submission error:", err);
                toast.error(err.message || "Operation failed");
            } finally {
                setIsLoading(false);
                setSubmitting(false);
            }
        },
    });

    useEffect(() => {
        setIsUnitPriceValid(
            formik.values.unitPrice !== undefined &&
            formik.values.unitPrice > 0 &&
            !formik.errors.unitPrice
        );
    }, [formik.values.unitPrice, formik.errors.unitPrice]);

    useEffect(() => {
        if (!open || !invoiceId || !isEditMode) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const result = await dispatch(getPerformanceInvoiceByIdThunk(invoiceId)).unwrap();
                if (result) {
                    const fullAddress = [
                        result.partyAddress?.unitNo || "",
                        result.partyAddress?.streetAddress || "",
                        result.partyAddress?.marketName || "",
                        result.partyAddress?.landMark || "",
                        result.partyAddress?.area || "",
                        result.partyAddress?.pincode || "",
                    ]
                        .filter((part) => part.trim() !== "")
                        .join(", ");
                    const assignedToValue = result.assignedTo?._id
                        ? result.assignedTo._id.toString()
                        : result.assignedTo || "";

                    formik.setValues({
                        orderNumber: result.orderNumber || "",
                        companyName: result.companyName?._id?.toString() || result.companyName || "",
                        partyName: result.party?._id?.toString() || result.partyName || "",
                        quantity: result.quantity || 0,
                        color: result.color || "",
                        pType: result.pType || "",
                        size: result.size || "",
                        GSTNo: result.GSTNo || "",
                        remarks: result.remarks || "",
                        ownerMobileNo: result.ownerMobileNo || "",
                        addressName: fullAddress || "",
                        servicePerformance: result.servicePerformance || "",
                        // unitPrice: result.unitPrice || 0,
                        total: result.total || 0,
                        applyGST: result.applyGST || 0, // Changed from applyGST
                        finalAmount: result.finalAmount || 0,
                        assignedTo: assignedToValue,
                        daysAfterConfirmation: result.daysAfterConfirmation, // Set new field
                    });
                    setIsSaved(true);
                }
            } catch (err: any) {
                console.error("Error fetching invoice:", err);
                toast.error(err.message || "Failed to fetch data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [open, isEditMode, invoiceId, dispatch]);

    useEffect(() => {
        const total = (formik.values.quantity || 0) * (formik.values.unitPrice || 0);
        const gstAmount = formik.values.applyGST ? total * (formik.values.gstPercentage / 100) : 0;
        const finalAmount = total + gstAmount;
        formik.setFieldValue("total", total);
        formik.setFieldValue("finalAmount", finalAmount);
    }, [formik.values.quantity, formik.values.unitPrice, formik.values.gstPercentage, formik.values.applyGST]);

    useEffect(() => {
        if (!open || orders.length === 0) {
            if (!invoiceId && !data?.orderNumber) {
                formik.resetForm();
                setIsEditMode(false);
                setCurrentInvoiceId(undefined);
                setIsSaved(false);
            }
            return;
        }
        const orderNumber = data?.orderNumber || "";
        if (!orderNumber) {
            return;
        }
        formik.setFieldValue("orderNumber", orderNumber);

        const selectedOrder = orders.find((order) => order.orderNumber === orderNumber);
        if (!selectedOrder) {
            toast.error("Selected order not found");
            return;
        }
        const fullAddress = [
            selectedOrder.party.address?.unitNo || "",
            markets.find((item) => item._id === selectedOrder.party.address?.streetAddress)?.streetAddress || "",
            markets.find((item) => item._id === selectedOrder.party.address?.marketName)?.marketName || "",
            markets.find((item) => item._id === selectedOrder.party.address?.landMark)?.landMark || "",
            markets.find((item) => item._id === selectedOrder.party.address?.area)?.area || "",
            markets.find((item) => item._id === selectedOrder.party.address?.pincode)?.pincode || "",
        ]
            .filter((part) => part.trim() !== "")
            .join(", ");

        const unitPrice = formik.values.unitPrice || 0;
        const total = selectedOrder.qty * unitPrice;
        const gstAmount = total * (formik.values.applyGST / 100);
        const finalAmount = total + gstAmount;

        const checkInvoice = async () => {
            try {
                const response = await performanceInvoiceService.getPerformanceInvoices();
                const existingInvoice = response.data?.find((invoice) => invoice.orderNumber === orderNumber);
                if (existingInvoice && !invoiceId) {
                    setIsEditMode(true);
                    setCurrentInvoiceId(existingInvoice._id);
                    setIsSaved(true);
                    const invoiceAddress = [
                        existingInvoice.partyAddress?.unitNo || "",
                        existingInvoice.partyAddress?.streetAddress || "",
                        existingInvoice.partyAddress?.marketName || "",
                        existingInvoice.partyAddress?.landMark || "",
                        existingInvoice.partyAddress?.area || "",
                        existingInvoice.partyAddress?.pincode || "",
                    ]
                        .filter((part) => part.trim() !== "")
                        .join(", ");

                    const assignedToValue = existingInvoice.assignedTo?._id
                        ? existingInvoice.assignedTo._id.toString()
                        : existingInvoice.assignedTo || "";
                    formik.setValues({
                        orderNumber: existingInvoice.orderNumber || "",
                        companyName: existingInvoice.companyName?._id?.toString() || existingInvoice.companyName || "",
                        partyName: existingInvoice.party?._id?.toString() || existingInvoice.partyName || "",
                        quantity: existingInvoice.quantity || 0,
                        color: existingInvoice.color || "",
                        pType: existingInvoice.pType || "",
                        size: existingInvoice.size || "",
                        GSTNo: existingInvoice.GSTNo || "",
                        remarks: existingInvoice.remarks || "",
                        ownerMobileNo: existingInvoice.ownerMobileNo || "",
                        addressName: invoiceAddress || fullAddress,
                        servicePerformance: existingInvoice.servicePerformance || "",
                        unitPrice: data?.quotation[data?.quotation?.length -1 ]?.unitPrice || 0,
                        total: existingInvoice.total || 0,
                        applyGST: existingInvoice.applyGST || 0, // Changed from applyGST
                        finalAmount: existingInvoice.finalAmount || 0,
                        assignedTo: assignedToValue,
                        daysAfterConfirmation: existingInvoice.daysAfterConfirmation,
                    });
                } else {
                    setIsEditMode(!!invoiceId);
                    setCurrentInvoiceId(invoiceId);
                    setIsSaved(false);
                    formik.setValues({
                        orderNumber,
                        companyName: selectedOrder.companyName._id || "",
                        partyName: selectedOrder.party._id || "",
                        quantity: selectedOrder.qty || 0,
                        color: selectedOrder.color || "",
                        pType: selectedOrder.pType || "",
                        size: selectedOrder.size || "",
                        GSTNo: selectedOrder.party.GSTNo || "",
                        remarks: selectedOrder.remarks || "",
                        ownerMobileNo: selectedOrder.party.ownerMobileNo || "",
                        addressName: fullAddress || "",
                        servicePerformance: selectedOrder.productItem.itemName || "",
                        unitPrice: formik.values.unitPrice || 0,
                        total,
                        applyGST: formik.values.applyGST || 0, // Changed from applyGST
                        finalAmount,
                        daysAfterConfirmation: undefined,
                    });
                }
            } catch (err: any) {
                console.error("Error checking existing invoice:", err);
                toast.error(err.message || "Failed to check existing invoice");
            }
        };
        checkInvoice();
    }, [open, data?.orderNumber, orders, invoiceId, dispatch]);

    const handleOrderChange = async (event: any, newValue: any) => {
        const orderNumber = newValue ? newValue.value : "";
        formik.setFieldValue("orderNumber", orderNumber);
        if (!orderNumber) {
            setIsEditMode(!!invoiceId);
            setCurrentInvoiceId(invoiceId);
            setIsSaved(false);
            formik.resetForm();
            return;
        }
        try {
            const selectedOrder = orders.find((order) => order.orderNumber === orderNumber);
            if (!selectedOrder) {
                toast.error("Order not found in local data");
                return;
            }
            const fullAddress = [
                selectedOrder.party.address?.unitNo || "",
                selectedOrder.party.address?.streetAddress || "",
                selectedOrder.party.address?.marketName || "",
                selectedOrder.party.address?.landMark || "",
                selectedOrder.party.address?.area || "",
                selectedOrder.party.address?.pincode || "",
            ]
                .filter((part) => part.trim() !== "")
                .join(", ");
            const total = selectedOrder.qty * (formik.values.unitPrice || 0);
            const gstAmount = total * (formik.values.applyGST / 100);
            const finalAmount = total + gstAmount;

            const response = await performanceInvoiceService.getPerformanceInvoices();
            const existingInvoice = response.data?.find((invoice) => invoice.orderNumber === orderNumber);
            if (existingInvoice && !invoiceId) {
                setIsEditMode(true);
                setCurrentInvoiceId(existingInvoice._id);
                setIsSaved(true);
                const invoiceAddress = [
                    existingInvoice.partyAddress?.unitNo || "",
                    existingInvoice.partyAddress?.streetAddress || "",
                    existingInvoice.partyAddress?.marketName || "",
                    existingInvoice.partyAddress?.landMark || "",
                    existingInvoice.partyAddress?.area || "",
                    existingInvoice.partyAddress?.pincode || "",
                ]
                    .filter((part) => part.trim() !== "")
                    .join(", ");
                const assignedToValue = existingInvoice.assignedTo?._id
                    ? existingInvoice.assignedTo._id.toString()
                    : existingInvoice.assignedTo || "";
                formik.setValues({
                    orderNumber: existingInvoice.orderNumber || "",
                    companyName: existingInvoice.companyName?._id?.toString() || existingInvoice.companyName || "",
                    partyName: existingInvoice.party?._id?.toString() || existingInvoice.partyName || "",
                    quantity: existingInvoice.quantity || 0,
                    color: existingInvoice.color || "",
                    pType: existingInvoice.pType || "",
                    size: existingInvoice.size || "",
                    GSTNo: existingInvoice.GSTNo || "",
                    remarks: existingInvoice.remarks || "",
                    ownerMobileNo: existingInvoice.ownerMobileNo || "",
                    addressName: invoiceAddress || fullAddress,
                    servicePerformance: existingInvoice.servicePerformance || "",
                    unitPrice: existingInvoice.unitPrice || 0,
                    total: existingInvoice.total || 0,
                    applyGST: existingInvoice.applyGST || 0, // Changed from applyGST
                    finalAmount: existingInvoice.finalAmount || 0,
                    assignedTo: assignedToValue,
                    daysAfterConfirmation: existingInvoice.daysAfterConfirmation,
                });
            } else {
                setIsEditMode(!!invoiceId);
                setCurrentInvoiceId(invoiceId);
                setIsSaved(false);
                formik.setValues({
                    orderNumber,
                    companyName: selectedOrder.companyName._id || "",
                    partyName: selectedOrder.party._id || "",
                    quantity: selectedOrder.qty || 0,
                    color: selectedOrder.color || "",
                    pType: selectedOrder.pType || "",
                    size: selectedOrder.size || "",
                    GSTNo: selectedOrder.party.GSTNo || "",
                    remarks: selectedOrder.remarks || "",
                    ownerMobileNo: selectedOrder.party.ownerMobileNo || "",
                    addressName: fullAddress || "",
                    servicePerformance: selectedOrder.productItem.itemName || "",
                    unitPrice: formik.values.unitPrice || 0,
                    total,
                    applyGST: formik.values.applyGST || 0, // Changed from applyGST
                    finalAmount,
                    daysAfterConfirmation: undefined, // Initialize new field
                });
            }
        } catch (err: any) {
            console.error("Error handling order change:", err);
            toast.error(err.message || "Failed to fetch order details");
        }
    };

    useEffect(() => {
        const total = (formik.values.quantity || 0) * (formik.values.unitPrice || 0);
        const gstAmount = total * (formik.values.applyGST / 100);
        const finalAmount = total + gstAmount;
        formik.setFieldValue("total", total);
        formik.setFieldValue("finalAmount", finalAmount);
    }, [formik.values.quantity, formik.values.unitPrice, formik.values.applyGST]);

    const selectedOrder = orders.find((o) => o.orderNumber === formik.values.orderNumber);
    const displayCompanyName = selectedOrder?.companyName?.companyName || formik.values.companyName || "N/A";
    const displayPartyName = selectedOrder?.party?.partyName || formik.values.partyName || "N/A";

    useEffect(() => {
        if (invoiceError) {
            toast.error(invoiceError, { autoClose: 5000 });
        }
    }, [invoiceError]);


    // Define label style for disabled fields
    const disabledLabelStyle = {
        "& .MuiInputLabel-root": {
            fontWeight: "bold",
            borderRadius: "4px",
            color: "#333", // Darker text for readability
        },
        "& .MuiInputLabel-root.Mui-disabled": {
            color: "#333", // Ensure readability when disabled
        },
    };

    return (
        <CustomDialog
            open={open}
            maxWidth="md"
            onClose={() => {
                formik.resetForm();
                setIsEditMode(!!invoiceId);
                setCurrentInvoiceId(invoiceId);
                setIsSaved(false);
                onClose();
            }}
            title={`${formik.values.orderNumber} Quotation`}
        >
            <Box
                sx={{ background: "#fff", borderRadius: 2 }}
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
            >
                <Box display="flex" flexDirection="column" gap={2} mb={1} width="100%">
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                        <TextField
                            label="Unit Price"
                            name="unitPrice"
                            type="number"
                            value={formik.values.unitPrice}
                            onChange={formik.handleChange}
                            error={formik.touched.unitPrice && Boolean(formik.errors.unitPrice)}
                            helperText={formik.touched.unitPrice && formik.errors.unitPrice}
                            required
                            fullWidth
                        />

                        <Box display="flex" flexDirection="row">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formik.values.applyGST}
                                        onChange={(e) => {
                                            formik.setFieldValue("applyGST", e.target.checked);
                                            // Reset GST percentage when unchecked
                                            if (!e.target.checked) {
                                                formik.setFieldValue("gstPercentage", 0);
                                            }
                                        }}
                                        name="applyGST"
                                        color="primary"
                                    />
                                }
                                label="Apply GST"
                            />

                            {formik.values.applyGST ? (
                                <TextField
                                    label="GST Percentage"
                                    name="gstPercentage"
                                    value={formik.values.gstPercentage}
                                    onChange={(e) => {
                                        let { value } = e.target;

                                        // Remove non-numeric characters
                                        value = value.replace(/\D/g, "");

                                        // Remove leading zeros (except for single zero)
                                        if (value.length > 1) {
                                            value = value.replace(/^0+/, "");
                                        }

                                        // If empty, default back to "0"
                                        if (value === "") {
                                            value = "0";
                                        }

                                        formik.setFieldValue("gstPercentage", value);
                                    }}
                                    error={formik.touched.gstPercentage && Boolean(formik.errors.gstPercentage)}
                                    helperText={formik.touched.gstPercentage && formik.errors.gstPercentage}
                                    required={formik.values.applyGST}
                                    fullWidth
                                />
                            ) : null}
                        </Box>
                    </Box>
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                        <TextField
                            label="Total"
                            type="number"
                            value={formik.values.total || ""}
                            disabled
                            fullWidth
                            sx={disabledLabelStyle}
                        />
                        <TextField
                            label="Final Amount"
                            type="number"
                            value={formik.values.finalAmount ? formik.values.finalAmount.toFixed(2) : "0.00"}
                            disabled
                            fullWidth
                            sx={disabledLabelStyle}
                        />
                    </Box>
                </Box>
                <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
                    <ThemeButton
                        type="submit"
                        sx={{ minWidth: 120, height: 40, mt: 2 }}
                        disabled={isLoading || invoiceLoading || formik.isSubmitting || !isUnitPriceValid ||
                            !formik.values.orderNumber ||
                            !formik.values.quantity}
                    >
                        {isLoading || invoiceLoading || formik.isSubmitting ? "Saving..." : "Save"}
                    </ThemeButton>
                    <InvoicePDFGenerator
                        formData={{
                            quotation: true,
                            companyName: displayCompanyName,
                            orderNumber: formik.values.orderNumber,
                            remarks: formik.values.remarks || "",
                            ownerMobileNo: formik.values.ownerMobileNo || "",
                            partyName: displayPartyName,
                            addressName: formik.values.addressName,
                            GSTNo: formik.values.GSTNo,
                            servicePerformance: formik.values.servicePerformance,
                            quantity: formik.values.quantity,
                            unitPrice: formik.values.unitPrice || 0,
                            total: formik.values.total || 0,
                            finalAmount: formik.values.finalAmount || 0,
                            applyGST: formik.values.applyGST, // Changed from applyGST
                            gstPercentage: formik.values.gstPercentage,
                            daysAfterConfirmation: formik.values.daysAfterConfirmation,
                        }}
                        isSaved={isSaved}
                        onClose={onClose}
                    />
                </Box>
            </Box>
        </CustomDialog>
    );
};

export default AddNewQuotation;
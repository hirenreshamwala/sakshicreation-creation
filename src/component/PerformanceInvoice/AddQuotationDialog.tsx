"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Box, TextField, FormControlLabel, Checkbox, Chip } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomDialog from "@/component/customdialog";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch } from "@/store";
import { updateOrderThunk } from "@/store/slices/orderSlice";

interface FormData {
    quantity: number;
    unitPrice: number;
    applyGST: boolean;
    gstPercentage: number;
    total: number;
    finalAmount: number;
}

interface AddNewQuotationProps {
    open: boolean;
    onClose: () => void;
    data?: any;
    refreshData?: () => void;
    onInvoiceSaved?: () => void;
}

const validationSchema = Yup.object({
    quantity: Yup.number().required("Quantity is required").min(1, "Quantity must be at least 1"),
    unitPrice: Yup.number()
        .required("Unit Price is required")
        .min(0, "Unit Price cannot be negative"),
    applyGST: Yup.boolean(),
    gstPercentage: Yup.number()
        .min(0, "GST Percentage cannot be negative")
        .max(100, "GST Percentage cannot exceed 100%")
        .when('applyGST', {
            is: true,
            then: (schema) => schema.required("GST Percentage is required when GST is applied"),
            otherwise: (schema) => schema.optional()
        }),
});

const AddNewQuotation: React.FC<AddNewQuotationProps> = ({
    open,
    onClose,
    data,
    refreshData,
    onInvoiceSaved,
}) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Get the last quotation to pre-fill the form
    const lastQuotation = data?.quotation?.[data?.quotation?.length - 1];

    const formik = useFormik<FormData>({
        initialValues: {
            quantity: lastQuotation?.qty || 0,
            unitPrice: lastQuotation?.unitPrice || 0,
            applyGST: lastQuotation?.gst > 0, // Set to true if last quotation had GST
            gstPercentage: lastQuotation?.gst || 0,
            total: 0,
            finalAmount: 0,
        },
        validationSchema,
        validateOnBlur: true,
        validateOnChange: true,
        onSubmit: async (values, { setSubmitting }) => {
            setIsLoading(true);
            setSubmitting(true);
            
            try {
                // Create new quotation entry
                const newQuotationEntry = {
                    unitPrice: values.unitPrice,
                    qty: values.quantity,
                    gst: values.applyGST ? values.gstPercentage : 0,
                    timestamp: new Date().toISOString()
                };

                // Update order with new quotation entry
                const updatedQuotation = data?.quotation ? [...data.quotation, newQuotationEntry] : [newQuotationEntry];
                
                const response = await dispatch(updateOrderThunk({ 
                    id: data._id, 
                    data: { quotation: updatedQuotation } 
                })).unwrap();
                
                toast.success("Quotation added successfully");
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

    // Calculate totals whenever relevant values change
    useEffect(() => {
        const total = (formik.values.quantity || 0) * (formik.values.unitPrice || 0);
        const gstAmount = formik.values.applyGST ? total * (Number(formik.values.gstPercentage) / 100) : 0;
        const finalAmount = total + gstAmount;
        
        formik.setFieldValue("total", total);
        formik.setFieldValue("finalAmount", finalAmount);
    }, [formik.values.quantity, formik.values.unitPrice, formik.values.gstPercentage, formik.values.applyGST]);

    // Reset form when dialog opens/closes - FIXED: Now preserves GST state from last quotation
    useEffect(() => {
        if (open && data) {
            const lastQuote = data?.quotation?.[data?.quotation?.length - 1];
            formik.setValues({
                quantity: lastQuote?.qty || 0,
                unitPrice: lastQuote?.unitPrice || 0,
                applyGST: lastQuote?.gst > 0, // This will be true if last quotation had GST > 0
                gstPercentage: lastQuote?.gst || 0,
                total: 0,
                finalAmount: 0,
            });
            setIsSaved(false);
        }
    }, [open, data]);

    const handleClose = () => {
        formik.resetForm();
        setIsSaved(false);
        onClose();
    };

    const disabledLabelStyle = {
        "& .MuiInputLabel-root": {
            fontWeight: "bold",
            borderRadius: "4px",
            color: "#333",
        },
        "& .MuiInputLabel-root.Mui-disabled": {
            color: "#333",
        },
    };

    return (
        <CustomDialog
            open={open}
            maxWidth="md"
            onClose={handleClose}
            title={`${data?.orderNumber || 'Order'} Quotation`}
        >
            <Box
                sx={{ background: "#fff", borderRadius: 2 }}
                component="form"
                onSubmit={formik.handleSubmit}
            >
                <Box display="flex" flexDirection="column" gap={2} mb={1} width="100%">
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                        <TextField
                            label="Quantity"
                            name="quantity"
                            type="number"
                            value={formik.values.quantity}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.quantity && Boolean(formik.errors.quantity)}
                            helperText={formik.touched.quantity && formik.errors.quantity}
                            required
                            fullWidth
                        />

                        <TextField
                            label="Unit Price"
                            name="unitPrice"
                            type="number"
                            value={formik.values.unitPrice}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.unitPrice && Boolean(formik.errors.unitPrice)}
                            helperText={formik.touched.unitPrice && formik.errors.unitPrice}
                            required
                            fullWidth
                        />
                    </Box>

                    <Box display="flex" alignItems="center" gap={2}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formik.values.applyGST}
                                    onChange={(e) => {
                                        formik.setFieldValue("applyGST", e.target.checked);
                                        // If unchecking GST, reset GST percentage to 0
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

                        {formik.values.applyGST && (
                            <TextField
                                label="GST Percentage"
                                name="gstPercentage"
                                value={formik.values.gstPercentage}
                                onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, "");
                                    if (value === "") value = "0";
                                    if (value.length > 1) value = value.replace(/^0+/, "");
                                    formik.setFieldValue("gstPercentage", Number(value));
                                }}
                                onBlur={formik.handleBlur}
                                error={formik.touched.gstPercentage && Boolean(formik.errors.gstPercentage)}
                                helperText={formik.touched.gstPercentage && formik.errors.gstPercentage}
                                required={formik.values.applyGST}
                                fullWidth
                            />
                        )}
                    </Box>

                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                        <TextField
                            label="Total"
                            type="number"
                            value={formik.values.total || 0}
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
                            InputProps={{
                                endAdornment: formik.values.applyGST ? (
                                    <Chip 
                                        label="GST Selected" 
                                        size="small" 
                                        color="primary" 
                                        variant="filled"
                                        sx={{ ml: 1 }}
                                    />
                                ) : null
                            }}
                        />
                    </Box>

                    {/* GST Status Display */}
                    <Box display="flex" justifyContent="flex-end">
                        {formik.values.applyGST ? (
                            <Chip 
                                label={`GST Applied: ${formik.values.gstPercentage}%`} 
                                color="primary" 
                                variant="filled"
                                sx={{ fontWeight: 'bold' }}
                            />
                        ) : (
                            <Chip 
                                label="No GST Applied" 
                                color="default" 
                                variant="outlined"
                            />
                        )}
                    </Box>
                </Box>

                <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
                    <ThemeButton
                        type="submit"
                        sx={{ minWidth: 120, height: 40 }}
                        disabled={isLoading || formik.isSubmitting || !formik.isValid}
                    >
                        {isLoading || formik.isSubmitting ? "Saving..." : "Save Quotation"}
                    </ThemeButton>
                </Box>

                {/* Display current quotation history */}
                {data?.quotation && data.quotation.length > 0 && (
                    <Box mt={3}>
                        <h4>Quotation History:</h4>
                        {data.quotation.map((quote: any, index: number) => (
                            <Box key={index} p={1} border={1} borderColor="grey.300" borderRadius={1} mb={1}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <div>
                                        Price: ₹{quote.unitPrice} | Qty: {quote.qty} | 
                                        {quote.gst > 0 ? (
                                            <Chip 
                                                label={`GST: ${quote.gst}%`} 
                                                size="small" 
                                                color="primary" 
                                                sx={{ ml: 1 }}
                                            />
                                        ) : (
                                            <Chip 
                                                label="No GST" 
                                                size="small" 
                                                color="default" 
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </div>
                                    <small>{new Date(quote.createdAt).toLocaleString()}</small>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </CustomDialog>
    );
};

export default AddNewQuotation;
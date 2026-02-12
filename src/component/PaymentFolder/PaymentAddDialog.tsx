"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { Box, Stack, Typography, Chip } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import CustomDialog from "@/component/customdialog";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { addPaymentToFolderThunk, updatePaymentFolderInState } from "@/store/slices/paymentFolderSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import { toast } from "react-toastify";
import moment from "moment";

const paymentMethodOptions = [
    { label: "Cash", value: "Cash" },
    { label: "Cheque", value: "Cheque" },
    { label: "NEFT", value: "NEFT" },
    { label: "UPI", value: "UPI" },
    { label: "Other", value: "Other" },
]

interface OptionType {
    label: string;
    value: string;
}

interface PaymentAddDialogProps {
    open: boolean;
    onClose: () => void;
    folderData: any;
}

interface PaymentHistoryItem {
    date: string;
    amount: number;
    remark: string;
    paymentMethod: string;
    receivedBy: string;
}

const PaymentAddDialog: React.FC<PaymentAddDialogProps> = memo(({
    open,
    onClose,
    folderData
}) => {

    const dispatch = useAppDispatch();
    const { staffList } = useAppSelector((state) => state.staff || {});
    const [isLoading, setIsLoading] = useState(false);

    const staffOptions = staffList.map((staff: any) => ({
        label: `${staff.firstName} ${staff.lastName}`,
        value: staff._id,
    }))

    const validationSchema = Yup.object({
        amount: Yup.number()
            .min(0, "Amount cannot be negative")
            .max(
                folderData?.pendingAmount || 0,
                `Amount cannot exceed pending amount (₹${folderData?.pendingAmount || 0})`
            ),
        differenceAmount: Yup.number()
            .min(0, "Difference cannot be negative")
            .max(
                folderData?.pendingAmount || 0,
                `Difference cannot exceed pending amount (₹${folderData?.pendingAmount || 0})`
            ),
        paymentDate: Yup.string().when("amount", {
            is: (val: number) => val > 0,
            then: (schema) => schema.required("Payment Date is required"),
            otherwise: (schema) => schema.optional(),
        }),
        paymentMethod: Yup.string().when("amount", {
            is: (val: number) => val > 0,
            then: (schema) => schema.required("Payment Method is required"),
            otherwise: (schema) => schema.optional(),
        }),
        receivedBy: Yup.string().when("amount", {
            is: (val: number) => val > 0,
            then: (schema) => schema.required("Received By is required"),
            otherwise: (schema) => schema.optional(),
        }),
        remark: Yup.string(),
    }).test(
        "at-least-one",
        "Either Amount or Difference must be greater than 0",
        function (values) {
            return (values.amount || 0) > 0 || (values.differenceAmount || 0) > 0;
        }
    );

    const getInitialValues = () => {
        return {
            amount: 0,
            differenceAmount: 0,
            paymentDate: moment().format('YYYY-MM-DD'),
            paymentMethod: "Cash",
            receivedBy: "",
            remark: "",
        };
    };

    const formik: any = useFormik({
        initialValues: getInitialValues(),
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            setIsLoading(true);
            try {
                const paymentData: any = {
                    differenceAmount: values.differenceAmount || 0,
                };

                if (values.amount > 0) {
                    paymentData.amount = values.amount;
                    paymentData.date = values.paymentDate;
                    paymentData.remark = values.remark;
                    paymentData.paymentMethod = values.paymentMethod;
                    paymentData.receivedBy = values.receivedBy;
                }

                const res = await dispatch(addPaymentToFolderThunk({
                    folderId: folderData._id,
                    payment: paymentData
                })).unwrap();
                dispatch(updatePaymentFolderInState(res as any))

                toast.success("Payment added successfully");

                handleClose();
            } catch (err: any) {
                toast.error(err.message || "Failed to add payment")
            } finally {
                setIsLoading(false);
            }
        },
    });

    useEffect(() => {
        if (!staffList?.length) dispatch(getAllStaffThunk());
    }, []);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            formik.resetForm({ values: getInitialValues() });
        }
    }, [open, folderData]);

    const handleClose = () => {
        formik.resetForm();
        onClose();
    };

    const getSelectedOption = (value: string, options: OptionType[]) => {
        return options.find((option) => option.value === value) || null;
    };

    // Calculate payment summary
    const paymentSummary = useMemo(() => {
        if (!folderData) return null;

        const totalReceived = folderData.receivedAmount || 0;
        const totalPending = folderData.pendingAmount || 0;
        const paymentAmount = folderData.paymentAmount || 0;
        const differenceAmount = folderData.differenceAmount || 0;

        return {
            totalReceived,
            totalPending,
            paymentAmount,
            differenceAmount,
            remainingAfterNewPayment: totalPending - (formik.values.amount || 0) - (formik.values.differenceAmount || 0)
        };
    }, [folderData, formik.values.amount, formik.values.differenceAmount]);

    // Get payment history
    const paymentHistory: PaymentHistoryItem[] = useMemo(() => {
        return folderData?.payments || [];
    }, [folderData]);

    return (
        <CustomDialog
            open={open}
            onClose={handleClose}
            title="Add Payment"
            maxWidth="md"
            fullWidth
        >
            <Box
                sx={{
                    // p: { xs: 1, sm: 2 },
                    background: "#fff",
                    borderRadius: 2,
                    maxHeight: "80vh",
                    overflowY: "auto",
                }}
                component="form"
                onSubmit={formik.handleSubmit}
            >
                {/* Payment Summary */}
                {folderData && (
                    <Box sx={{ mb: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#7F56D9' }}>
                            Payment Summary
                        </Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                            <Chip
                                label={`Total Amount: ₹${paymentSummary?.paymentAmount}`}
                                color="primary"
                                variant="outlined"
                            />
                            <Chip
                                label={`Received: ₹${paymentSummary?.totalReceived}`}
                                color="success"
                                variant="outlined"
                            />
                            <Chip
                                label={`Pending: ₹${paymentSummary?.totalPending}`}
                                color="warning"
                                variant="outlined"
                            />
                            {paymentSummary?.differenceAmount > 0 && (
                                <Chip
                                    label={`Difference: ₹${paymentSummary?.differenceAmount}`}
                                    color="error"
                                    variant="outlined"
                                />
                            )}
                            {(formik.values.amount > 0 || formik.values.differenceAmount > 0) && (
                                <Chip
                                    label={`Remaining: ₹${paymentSummary?.remainingAfterNewPayment}`}
                                    color="info"
                                    variant="filled"
                                />
                            )}
                        </Stack>
                    </Box>
                )}

                {/* Payment Form */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
                    <ThemeInput
                        labelName="Amount"
                        type="number"
                        value={formik.values.amount}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (val === "0") return;
                            if (formik.values.amount === "0" && val !== "" && val !== "0") {
                                formik.setFieldValue("amount", val.replace(/^0+/, ""));
                                return;
                            }
                            val = val.replace(/^0+/, "");
                            formik.setFieldValue("amount", val);
                        }}
                        error={formik.touched.amount && Boolean(formik.errors.amount)}
                        helperText={formik.touched.amount && formik.errors.amount}
                        fullWidth
                    />

                    <ThemeInput
                        labelName="Difference Amount"
                        type="number"
                        value={formik.values.differenceAmount}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (val === "0") return;
                            if (formik.values.differenceAmount === "0" && val !== "" && val !== "0") {
                                formik.setFieldValue("differenceAmount", val.replace(/^0+/, ""));
                                return;
                            }
                            val = val.replace(/^0+/, "");
                            formik.setFieldValue("differenceAmount", val);
                        }}
                        error={formik.touched.differenceAmount && Boolean(formik.errors.differenceAmount)}
                        helperText={formik.touched.differenceAmount && formik.errors.differenceAmount}
                        fullWidth
                    />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
                    <ThemeInput
                        labelName="Payment Date"
                        type="date"
                        value={formik.values.paymentDate}
                        onChange={(e) => formik.setFieldValue("paymentDate", e.target.value)}
                        error={formik.touched.paymentDate && Boolean(formik.errors.paymentDate)}
                        helperText={formik.touched.paymentDate && formik.errors.paymentDate}
                        required={formik.values.amount > 0}
                        fullWidth
                    />
                    <Box sx={{ width: '100%' }} />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={1}>
                    <ThemeSelect
                        label="Payment Method"
                        options={paymentMethodOptions}
                        value={getSelectedOption(formik.values.paymentMethod, paymentMethodOptions)}
                        onChange={(event, newValue) => formik.setFieldValue("paymentMethod", newValue ? newValue.value : "")}
                        error={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
                        helperText={formik.touched.paymentMethod && formik.errors.paymentMethod}
                        required={formik.values.amount > 0}
                    />
                    <ThemeSelect
                        label="Received By"
                        options={staffOptions}
                        value={getSelectedOption(formik.values.receivedBy, staffOptions)}
                        onChange={(event, newValue) => formik.setFieldValue("receivedBy", newValue ? newValue.value : "")}
                        error={formik.touched.receivedBy && Boolean(formik.errors.receivedBy)}
                        helperText={formik.touched.receivedBy && formik.errors.receivedBy}
                        required={formik.values.amount > 0}
                    />
                </Stack>

                <Box mb={1}>
                    <ThemeInput
                        labelName="Remark"
                        type="text"
                        value={formik.values.remark}
                        onChange={(e) => formik.setFieldValue("remark", e.target.value)}
                        multiline
                        rows={2}
                        fullWidth
                        placeholder="Add any additional remarks about this payment..."
                    />
                </Box>

                {/* Payment History */}
                {paymentHistory.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#7F56D9' }}>
                            Payment History
                        </Typography>
                        <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                            {paymentHistory.map((payment, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        p: 1,
                                        mb: 1,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        backgroundColor: '#fafafa'
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight="bold">
                                            ₹{payment.amount}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {moment(payment.date).format('DD/MM/YYYY')}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2">
                                            {payment.paymentMethod}
                                        </Typography>
                                        {payment.remark && (
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {payment.remark}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                <ThemeButton
                    type="submit"
                    sx={{
                        background: "#10B981",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 16,
                        borderRadius: 2,
                        py: 1.2,
                        width: "100%",
                        mt: 1,
                        "&:hover": { background: "#059669" },
                    }}
                    disabled={isLoading || formik.isSubmitting || (!formik.values.amount && !formik.values.differenceAmount)}
                >
                    {isLoading || formik.isSubmitting ? "Adding Payment..." : "Add Payment"}
                </ThemeButton>
            </Box>
        </CustomDialog>
    );
});

export default PaymentAddDialog;
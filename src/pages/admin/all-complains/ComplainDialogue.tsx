import { useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Box,
    Typography,
    IconButton,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllOrdersThunk, getOrdersByStaffIdThunk } from "@/store/slices/orderSlice";
import { getAllQPOrdersThunk, getQPOrdersByStaffIdThunk } from "@/store/slices/qpOrderSlice";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeInput from "@/component/common_component/themeinput";
import { createComplainThunk, updateComplainThunk } from "@/store/slices/complainSlice";
import { toast } from "react-toastify";
import { StaticCompanyOptions } from "@/constants";
import { useFormik } from "formik";
import * as Yup from "yup";
import DeleteIcon from "@mui/icons-material/Delete";

interface Complaint {
    _id?: string;
    subject: string;
    details: string;
    orderId?: string;
    company: string;
    scorder?: string | null;
    qporder?: string | null;
    status?: string;
    response?: string;
    createdBy?: string;
    assignTo?: string[];
    party?: {
        _id: string;
        partyName: string;
        address?: {
            marketName?: { marketName: string };
            area?: { area: string };
        };
    };
    files?: (File | string)[];
    filePaths?: string[]; // Add filePaths to handle backend response
}

interface ComplainDialogProps {
    company: { _id: string; companyName: string }
    open: boolean;
    onClose: () => void;
    refreshData?: () => void;
    editData?: Complaint | null;
}
const getValidationSchema = (isEdit: boolean, status: string) => {
    return Yup.object({
        subject: Yup.string()
            .required("Subject is required")
            .min(5, "Subject must be at least 5 characters")
            .max(100, "Subject must not exceed 100 characters"),
        details: Yup.string()
            .required("Details are required")
            .min(10, "Details must be at least 10 characters")
            .max(1000, "Details must not exceed 1000 characters"),
        party: Yup.string().required("Please select a party"),
        orderId: Yup.string().required("Please select an order"),
        status: Yup.string().required("Status is required"),
        response: Yup.string()
            .transform((value) => (value ? value.trim() : "")) // ✅ trim before validation
            .when([], {
                is: () => isEdit && status === "Completed",
                then: (schema) =>
                    schema
                        .required("Response is required when status is Completed")
                        .min(10, "Response must be at least 10 characters")
                        .max(500, "Response must not exceed 500 characters"),
                otherwise: (schema) =>
                    schema
                        .notRequired()
                        .max(500, "Response must not exceed 500 characters"),
            }),
        files: Yup.array()
            .of(
                Yup.mixed()
                    .test("fileSize", "File size must be less than 25MB", (value) => {
                        return !value || (value instanceof File && value.size <= 25 * 1024 * 1024);
                    })
                    .test("fileType", "Only PDF, PNG, JPG, and JPEG files are allowed", (value) => {
                        return !value || (value instanceof File && ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(value.type));
                    })
            )
            .max(25, "You can upload a maximum of 25 files")
            .notRequired(),
    });
};


const ComplainDialogue: React.FC<ComplainDialogProps> = ({
    company,
    open,
    onClose,
    refreshData,
    editData,
}) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { companies } = useAppSelector((state) => state.company);
    const { staffList } = useAppSelector((state) => state.staff);
    const { orders } = useAppSelector((state) => state.orders);
    const { orders: qporders } = useAppSelector((state) => state.qpOrders);

    const canViewGlobal = user?.role?.permissions?.all_orders?.view_global;
    const canViewOwn = user?.role?.permissions?.all_orders?.view_own;

    // Normalize editData to use files instead of filePaths
    const normalizedEditData = editData
        ? {
              ...editData,
              files: editData.filePaths || editData.files || [],
          }
        : null;

    const formik = useFormik({
        initialValues: {
            subject: normalizedEditData?.subject || "",
            details: normalizedEditData?.details || "",
            orderId: normalizedEditData
                ? normalizedEditData.scorder?._id || normalizedEditData.qporder?._id || ""
                : "",
            party: normalizedEditData?.party?._id || "",
            status: normalizedEditData?.status || "Pending",
            response: normalizedEditData?.response || "",
            files: normalizedEditData?.files || [],
        },
        validationSchema: (values) => getValidationSchema(!!normalizedEditData, values?.status),
        onSubmit: async (values) => {
            const formData = new FormData();
            formData.append("subject", values.subject);
            formData.append("details", values.details);
            formData.append("company", company._id);
            formData.append("createdBy", user?.id || "");
            formData.append("party", values.party);
            if (values.orderId) {
                if (company.companyName === StaticCompanyOptions[0]) {
                    formData.append("scorder", values.orderId);
                } else {
                    formData.append("qporder", values.orderId);
                }
            }
            if (normalizedEditData) {
                formData.append("status", values.status || "Pending");
                formData.append("response", values.response || "");
            }
            filteredStaffIds.forEach((id) => formData.append("assignTo", id));

            // Append new files
            (values.files || [])
                .filter((file): file is File => file instanceof File)
                .forEach((file) => formData.append("files", file));

            // Append files to remove
            if (normalizedEditData?._id) {
                const existingUrls = (normalizedEditData.files || []).filter(
                    (file): file is string => typeof file === "string"
                );
                const keptUrls = (values.files || []).filter(
                    (file): file is string => typeof file === "string"
                );
                const filesToRemove = existingUrls.filter((url) => !keptUrls.includes(url));
                if (filesToRemove.length) {
                    formData.append("filesToRemove", JSON.stringify(filesToRemove));
                }
            }

            try {
                if (normalizedEditData?._id) {
                    await dispatch(updateComplainThunk({ id: normalizedEditData._id, payload: formData }));
                    toast.success("Complaint updated successfully!");
                } else {
                    await dispatch(createComplainThunk(formData));
                    toast.success("Complaint created successfully!");
                }

                if (refreshData) refreshData();
                onClose();
            } catch (error) {
                console.error("Error saving complaint:", error);
                toast.error("Failed to save complaint. Please try again.");
            }
        },
        enableReinitialize: true
    });

    useEffect(() => {
        if (canViewGlobal) {
            if (!orders.length) dispatch(getAllOrdersThunk());
            if (!qporders.length) dispatch(getAllQPOrdersThunk({ limit: 100 }));
        } else if (canViewOwn && user?.id) {
            if (!orders.length) dispatch(getOrdersByStaffIdThunk(user?.id));
            if (!qporders.length) dispatch(getQPOrdersByStaffIdThunk(user?.id));
        }
    }, [canViewGlobal, canViewOwn, user?.id, dispatch]);

    const filteredStaffIds = staffList
        ?.filter((staff: any) => {
            const isAdminOrManager = staff.role?.roleName === "Admin" || staff.role?.roleName === "Manager";
            const matchesCompany = staff.CompanyName?._id === company._id;
            return isAdminOrManager && matchesCompany;
        })
        ?.map((staff: any) => staff._id) || [];

    const handleClose = () => {
        formik.resetForm();
        onClose();
    };

    // Prepare party options
    const partyOptions = (company.companyName === StaticCompanyOptions[0] ? orders : qporders)
        ?.filter((order: any) =>
            (order.createdBy?._id === user?.id || order.createdBy === user?.id) &&
            order?.party?._id
        )
        ?.reduce((unique: any[], order: any) => {
            if (order.party && !unique.find(item => item.value === order.party._id)) {
                unique.push({
                    value: order.party._id,
                    label: `${order.party.partyName} - ${order.party.address?.marketName?.marketName || ''} - ${order.party.address?.area?.area || ''}`.trim() || "Party",
                });
            }
            return unique;
        }, []) || [];

    // Find selected party option
    const selectedPartyOption = partyOptions.find(opt => opt.value === formik.values.party) || null;

    // Prepare order options - filtered by selected party
    const orderOptions = (company.companyName === StaticCompanyOptions[0] ? orders : qporders)
        ?.filter((order: any) =>
            (order.createdBy?._id === user?.id || order.createdBy === user?.id) &&
            order?.party?._id === formik.values.party
        )
        ?.map((order: any) => ({
            value: order._id,
            label: order.orderNumber || `QP-${order.orderNo}` || "Order",
        })) || [];

    // Find selected order option
    const selectedOrderOption = orderOptions.find(opt => opt.value === formik.values.orderId) || null;

    // Reset orderId when party changes
    useEffect(() => {
        if (formik.values.party && formik.values.orderId) {
            const selectedOrder = (company.companyName === StaticCompanyOptions[0] ? orders : qporders)
                ?.find((order: any) => order._id === formik.values.orderId);

            if (selectedOrder && selectedOrder.party?._id !== formik.values.party) {
                formik.setFieldValue("orderId", "");
            }
        }
    }, [formik.values.party, formik.values.orderId, orders, qporders, company.companyName]);

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(event.target.files || []);
        const currentFiles = formik.values.files || [];
        const updatedFiles = [...currentFiles, ...newFiles].slice(0, 5); // Limit to 5 files
        formik.setFieldValue("files", updatedFiles);
        event.target.value = ""; // Reset input to allow re-uploading same file
    };

    // Handle file removal
    const handleRemoveFile = (index: number) => {
        const updatedFiles = (formik.values.files || []).filter((_, i) => i !== index);
        formik.setFieldValue("files", updatedFiles);
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>{editData ? "Edit Complaint" : "Add Complaint"}</DialogTitle>

            <form onSubmit={formik.handleSubmit}>
                <DialogContent dividers>
                    {/* Company Dropdown */}
                    <Stack direction="row" spacing={2} mb={2}>
                        <ThemeSelect
                            label="Company"
                            options={companies.map((item) => ({ value: item._id, label: item.companyName }))}
                            value={companies.map((item) => ({ value: item._id, label: item.companyName })).find(opt => opt.value === company._id) || null}
                            disabled
                            sx={{ mb: 2 }}
                        />
                        <ThemeSelect
                            label="Party"
                            options={partyOptions}
                            value={selectedPartyOption}
                            onChange={(e, newValue) => {
                                formik.setFieldValue("party", newValue?.value || "");
                                formik.setFieldValue("orderId", ""); // Reset order when party changes
                            }}
                            onBlur={formik.handleBlur}
                            error={formik.touched.party && Boolean(formik.errors.party)}
                            helperText={formik.touched.party && formik.errors.party}
                            sx={{ mb: 2 }}
                        />
                    </Stack>

                    {/* Order and Subject Inputs */}
                    <Stack direction="row" spacing={2} mb={2}>
                        <ThemeSelect
                            label="Related Order"
                            options={orderOptions}
                            value={selectedOrderOption}
                            onChange={(e, newValue) => formik.setFieldValue("orderId", newValue?.value || "")}
                            onBlur={formik.handleBlur}
                            error={formik.touched.orderId && Boolean(formik.errors.orderId)}
                            helperText={formik.touched.orderId && formik.errors.orderId}
                            disabled={!formik.values.party}
                            sx={{ mb: 2 }}
                        />
                        <ThemeInput
                            labelName="Complaint Subject"
                            name="subject"
                            value={formik.values.subject}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.subject && Boolean(formik.errors.subject)}
                            helperText={formik.touched.subject && formik.errors.subject}
                            fullWidth
                            sx={{ mb: 2 }}
                        />
                    </Stack>

                    <ThemeInput
                        labelName="Details"
                        name="details"
                        value={formik.values.details}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.details && Boolean(formik.errors.details)}
                        helperText={formik.touched.details && formik.errors.details}
                        multiline
                        minRows={3}
                        fullWidth
                        sx={{ mb: 2 }}
                    />

                    {/* File Upload Input */}
                    <Box mb={2}>
                        <Button
                            variant="contained"
                            component="label"
                            color="primary"
                        >
                            Upload Files
                            <input
                                type="file"
                                hidden
                                multiple
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={handleFileChange}
                            />
                        </Button>
                        {formik.touched.files && formik.errors.files && (
                            <Typography color="error" variant="caption">
                                {formik.errors.files}
                            </Typography>
                        )}
                        <Box mt={1}>
                            {(formik.values.files || []).map((file, index) => (
                                <Stack
                                    key={index}
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    mt={1}
                                >
                                    <Typography variant="body2">
                                        {typeof file === "string" ? file.split('/').pop() : file.name}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveFile(index)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Stack>
                            ))}
                        </Box>
                    </Box>

                    {/* Status and Response Inputs (Edit Mode) */}
                    {editData && (
                        <>
                            <ThemeSelect
                                label="Status"
                                name="status"
                                options={[
                                    { value: "Pending", label: "Pending" },
                                    { value: "In Progress", label: "In Progress" },
                                    { value: "Completed", label: "Completed" }
                                ]}
                                value={{ value: formik.values.status, label: formik.values.status }}
                                onChange={(e, newValue) => formik.setFieldValue("status", newValue?.value || "Pending")}
                                onBlur={formik.handleBlur}
                                error={formik.touched.status && Boolean(formik.errors.status)}
                                helperText={formik.touched.status && formik.errors.status}
                                sx={{ mb: 2 }}
                            />

                            <ThemeInput
                                labelName="Response"
                                name="response"
                                value={formik.values.response}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.response && Boolean(formik.errors.response)}
                                helperText={formik.touched.response && formik.errors.response}
                                multiline
                                minRows={2}
                                fullWidth
                                sx={{ mb: 2 }}
                                required={formik.values.status === "Completed"}
                                placeholder={formik.values.status === "Completed" ? "Response is required when status is Completed" : ""}
                            />
                        </>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={handleClose}
                        color="secondary"
                        type="button"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        color="primary"
                        variant="contained"
                        disabled={formik.isSubmitting}
                    >
                        {formik.isSubmitting ? "Saving..." : (editData ? "Update" : "Save")}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ComplainDialogue;
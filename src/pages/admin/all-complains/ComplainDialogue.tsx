import { useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Box,
    Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllOrdersThunk, getOrdersByStaffIdThunk } from "@/store/slices/orderSlice";
import { getAllQPOrdersThunk, getQPOrdersByStaffIdThunk } from "@/store/slices/qpOrderSlice";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeInput from "@/component/common_component/themeinput";
import FileUpload from "@/component/reusablecomponents/FileUpload";
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog";
import { createComplainThunk, updateComplainThunk } from "@/store/slices/complainSlice";
import { toast } from "react-toastify";
import { StaticCompanyOptions } from "@/constants";
import { useFormik } from "formik";
import * as Yup from "yup";

interface Complaint {
    _id?: string;
    subject: string;
    details: string;
    orderId?: string;
    company: string;
    scorder?: any;
    qporder?: any;
    party?: any;
    status?: string;
    response?: string;
    createdBy?: string;
    assignTo?: string[];
    filePaths?: string[];
}

interface ComplainDialogProps {
    company: { _id: string; companyName: string }
    open: boolean;
    onClose: () => void;
    refreshData?: () => void;
    editData?: Complaint | null;
    // selectedOrderData?: OrderRow | null
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
            .transform((value) => (value ? value.trim() : ""))
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
    });
};

const ComplainDialogue: React.FC<ComplainDialogProps> = ({
    company,
    open,
    onClose,
    refreshData,
    editData,
    selectedOrderData,
}) => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { companies } = useAppSelector((state) => state.company);
    const { staffList } = useAppSelector((state) => state.staff);
    console.log("DEBUG : ComplainDialogue : staffList:", staffList);

    const { orders } = useAppSelector((state) => state.orders);
    const { orders: qporders } = useAppSelector((state) => state.qpOrders);

    // File upload ref और states
    const fileUploadRef = useRef<any>(null);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [fileLoading, setFileLoading] = useState(false);
    const [openFilesDialog, setOpenFilesDialog] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const canViewGlobal = user?.role?.permissions?.all_orders?.view_global;
    const canViewOwn = user?.role?.permissions?.all_orders?.view_own;

    const isAdminOrManager =
        user?.role?.roleName?.includes("Admin") ||
        user?.role?.roleName?.includes("Manager");


    useEffect(() => {
        if (selectedOrderData && open) {
            // Auto-fill the form with order data
            formik.setValues({
                company: selectedOrderData.companyName._id,
                // subject: `Complaint for QP-${selectedOrderData.orderNo}`,
                details: "",
                orderId: selectedOrderData._id,
                party: selectedOrderData.party?._id || "",
                status: "Pending",
                response: "",
                files: []
            });
        }
    }, [selectedOrderData, open]);

    // Formik initialization
    const formik = useFormik({
        initialValues: {
            subject: "",
            details: "",
            orderId: "",
            party: "",
            status: "Pending",
            response: "",
        },
        validationSchema: (values) => getValidationSchema(!!editData, values?.status),
        onSubmit: async (values) => {
            setFileLoading(true);

            try {
                let newFilePaths: string[] = [];

                // File upload logic
                if (fileUploadRef.current && typeof fileUploadRef.current.getSelectedFiles === "function") {
                    const selectedFiles = fileUploadRef.current.getSelectedFiles() || [];
                    if (selectedFiles.length > 0) {
                        const uploadedFileResults = await fileUploadRef.current.uploadSelectedFiles();
                        newFilePaths = uploadedFileResults.map((file: any) =>
                            file.path || `/${file.folder}/${file.filename}`
                        );
                        setUploadedFiles((prev) => [...prev, ...newFilePaths]);
                    }
                }

                const complainData: Complaint = {
                    ...values,
                    company: company._id,
                    createdBy: user?.id,
                    assignTo: filteredStaffIds,
                    scorder: company.companyName === "Sakshi Creation" ? values.orderId || null : null,
                    qporder: company.companyName !== "Sakshi Creation" ? values.orderId || null : null,
                    filePaths: [
                        ...(editData?.filePaths || []),
                        ...newFilePaths
                    ],
                };

                if (editData?._id) {
                    await dispatch(updateComplainThunk({ id: editData._id, payload: complainData }));
                    toast.success("Complaint updated successfully!");
                } else {
                    await dispatch(createComplainThunk(complainData));
                    toast.success("Complaint created successfully!");
                }

                if (refreshData) refreshData();
                onClose();
            } catch (error) {
                console.error("Error saving complaint:", error);
                toast.error("Failed to save complaint. Please try again.");
            } finally {
                setFileLoading(false);
            }
        },
        enableReinitialize: true
    });

    const filteredStaffIds = staffList
    ?.filter((staff: any) => {
            console.log("DEBUG : ComplainDialogue : staff:", staff);
            const isAdminOrManager = staff.role?.roleName.includes("Admin")  || staff.role?.roleName.includes("manager") ;
            
            const matchesCompany = staff.CompanyName?._id === company._id;
            return isAdminOrManager && matchesCompany;
        })
        ?.map((staff: any) => staff._id) || [];
    console.log("DEBUG : ComplainDialogue : filteredStaffIds:", filteredStaffIds);


    const handleClose = () => {
        formik.resetForm();
        setUploadedFiles([]);
        setInitialized(false);
        onClose();
    };

    // File handlers
    const handleFilesSelected = (files: File[]) => {
        console.log("Files selected:", files);
    };

    const handleUploadError = (error: string) => {
        console.error("Upload error:", error);
        toast.error(error);
    };

    // View Files Dialog handlers
    const handleViewFiles = () => {
        setOpenFilesDialog(true);
    };

    const handleCloseFilesDialog = () => {
        setOpenFilesDialog(false);
    };

    // Edit mode में data set करें
    useEffect(() => {
        if (editData && open && !initialized) {
            console.log("Edit Data:", editData);

            // Party set करें
            const partyId = editData.party?._id || editData.party;

            // Order set करें
            let orderId = "";
            if (company.companyName === "Sakshi Creation") {
                orderId = editData.scorder?._id || editData.scorder;
            } else {
                orderId = editData.qporder?._id || editData.qporder;
            }

            formik.setValues({
                subject: editData.subject || "",
                details: editData.details || "",
                orderId: orderId || "",
                party: partyId || "",
                status: editData.status || "Pending",
                response: editData.response || "",
            });

            // Files set करें
            if (editData.filePaths && Array.isArray(editData.filePaths)) {
                setUploadedFiles(editData.filePaths);
            }

            setInitialized(true);
        }
    }, [editData, open, initialized, company.companyName]);

    // Orders और QPOrders fetch करें
    useEffect(() => {
        if (open) {
            if (canViewGlobal) {
                if (!orders.length) dispatch(getAllOrdersThunk());
                if (!qporders.length) dispatch(getAllQPOrdersThunk({ limit: 100 }));
            } else if (canViewOwn && user?.id) {
                if (!orders.length) dispatch(getOrdersByStaffIdThunk(user?.id));
                if (!qporders.length) dispatch(getQPOrdersByStaffIdThunk(user?.id));
            }
        }
    }, [open, canViewGlobal, canViewOwn, user?.id]);

    // Order options - party select होने के बाद filter करें
    const orderOptions = (company.companyName === StaticCompanyOptions[0] ? orders : qporders)
        ?.filter((order: any) => {
            if (!formik.values.party) return false;

            const orderPartyId = order.party?._id || order.party;
            return orderPartyId === formik.values.party;
        })
        ?.map((order: any) => ({
            value: order._id,
            label: order.orderNumber || `QP-${order.orderNo}` || `Order-${order._id}`,
        })) || [];

    // Party options - सभी available parties
    const partyOptions = (company.companyName === StaticCompanyOptions[0] ? orders : qporders)
        ?.reduce((unique: any[], order: any) => {
            if (order.party) {
                const partyId = order.party._id || order.party;
                const partyName = order.party.partyName || "Unknown Party";
                const marketName = order.party.address?.marketName?.marketName || "";
                const area = order.party.address?.area?.area || "";

                if (!unique.find(item => item.value === partyId)) {
                    unique.push({
                        value: partyId,
                        label: `${partyName} - ${marketName} - ${area}`.trim() || partyName,
                    });
                }
            }
            return unique;
        }, []) || [];

    // Debug के लिए
    useEffect(() => {
        if (editData && open) {
            console.log("Current Form Values:", formik.values);
            console.log("Party Options:", partyOptions);
            console.log("Order Options:", orderOptions);
            console.log("Edit Data Party:", editData.party);
            console.log("Edit Data Order:", editData.scorder || editData.qporder);
        }
    }, [formik.values, partyOptions, orderOptions, editData, open]);

    // Party change पर order reset करें
    useEffect(() => {
        if (formik.values.party && formik.values.orderId) {
            const selectedOrder = (company.companyName === StaticCompanyOptions[0] ? orders : qporders)
                ?.find((order: any) => {
                    const orderId = order._id;
                    const orderPartyId = order.party?._id || order.party;
                    return orderId === formik.values.orderId && orderPartyId === formik.values.party;
                });

            if (!selectedOrder) {
                formik.setFieldValue("orderId", "");
            }
        }
    }, [formik.values.party]);

    return (
        <>
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
                                value={partyOptions.find(opt => opt.value === formik.values.party) || null}
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

                        <Stack direction="row" spacing={2} mb={2}>
                            <ThemeSelect
                                label="Related Order"
                                options={orderOptions}
                                value={orderOptions.find(opt => opt.value === formik.values.orderId) || null}
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

                        {/* File Upload Section */}
                        <Box mb={2}>
                            <FileUpload
                                ref={fileUploadRef}
                                folder="complaints"
                                multiple={true}
                                accept="*/*"
                                variant="dropzone"
                                onFilesSelected={handleFilesSelected}
                                onUploadError={handleUploadError}
                                showPreview={false}
                                showUploadButton={false}
                                autoUpload={false}
                                label="Attach Complaint Documents"
                                helperText="Upload relevant documents, images, or proof related to complaint"
                            />
                        </Box>

                        {/* Existing files display with View Button */}
                        {uploadedFiles.length > 0 && (
                            <Box mb={2}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="body2" color="textSecondary">
                                        Attached Files: {uploadedFiles.length}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handleViewFiles}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        View All Files
                                    </Button>
                                </Box>
                                <Box sx={{ maxHeight: 100, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                                    {uploadedFiles.map((filePath, index) => (
                                        <Typography
                                            key={index}
                                            variant="caption"
                                            display="block"
                                            sx={{
                                                fontFamily: 'monospace',
                                                fontSize: '0.75rem',
                                                color: '#666',
                                                py: 0.5
                                            }}
                                        >
                                            {filePath?.split('/').pop()}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Status and Response - Show for edit mode */}
                        {editData && isAdminOrManager && (
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
                            disabled={formik.isSubmitting || fileLoading}
                        >
                            {(formik.isSubmitting || fileLoading) ? "Saving..." : (editData ? "Update" : "Save")}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* View Files Dialog */}
            <ViewFilesDialog
                open={openFilesDialog}
                onClose={handleCloseFilesDialog}
                files={uploadedFiles}
                title="Complaint Documents"
                showDownload={true}
                showView={true}
                downloadEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/filedownload/download`}
            />
        </>
    );
};

export default ComplainDialogue;
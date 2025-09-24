import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Stack,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/router";
import { getAllOrdersThunk, getOrdersByStaffIdThunk } from "@/store/slices/orderSlice";
import { getAllQPOrdersThunk, getQPOrdersByStaffIdThunk } from "@/store/slices/qpOrderSlice";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeInput from "@/component/common_component/themeinput";
import {
    createComplainThunk,
    updateComplainThunk,
} from "@/store/slices/complainSlice";
import { toast } from "react-toastify";

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
}

interface ComplainDialogProps {
    company: { _id: string; companyName: string }
    open: boolean;
    onClose: () => void;
    refreshData?: () => void;
    editData?: Complaint | null;
}

const ComplainDialogue: React.FC<ComplainDialogProps> = ({
    company,
    open,
    onClose,
    refreshData,
    editData,
}) => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { user } = useAppSelector((state) => state.auth);
    const { companies } = useAppSelector((state) => state.company);
    const { staffList, loading: staffLoading, error: staffError } = useAppSelector((state) => state.staff);
    const { orders } = useAppSelector((state) => state.orders);
    const { orders: qporders } = useAppSelector((state) => state.qpOrders);

    const canViewGlobal = user?.role?.permissions?.all_orders?.view_global;
    const canViewOwn = user?.role?.permissions?.all_orders?.view_own;

    const [subject, setSubject] = useState("");
    const [details, setDetails] = useState("");
    const [orderId, setOrderId] = useState("");
    const [status, setStatus] = useState("Pending");
    const [response, setResponse] = useState("");

    useEffect(() => {
        if (!open) return; // only run when dialog is opened
        const token = authService.getToken();
        if (!token) {
            router.push("/login");
            return;
        }
        if (canViewGlobal) {
            dispatch(getAllOrdersThunk());
            dispatch(getAllQPOrdersThunk({ limit: 100 }));
        } else if (canViewOwn && user?.id) {
            dispatch(getOrdersByStaffIdThunk(user.id));
            dispatch(getQPOrdersByStaffIdThunk(user.id));
        }
        if (editData) {
            setSubject(editData.subject || "");
            setDetails(editData.details || "");
            setOrderId(editData.scorder?._id || editData.qporder?._id || "");
            setStatus(editData.status || "Pending");       
            setResponse(editData.response || "");          
        } else {
            setSubject("");
            setDetails("");
            setOrderId("");
            setStatus("Pending");
            setResponse("");
        }
    }, [open, canViewGlobal, canViewOwn, user?.id, dispatch, router, editData, company]);

    const filteredStaffIds = staffList
        ?.filter((staff: any) => {
            const isAdminOrManager = staff.role?.roleName === "Admin" || staff.role?.roleName === "Manager";
            const matchesCompany = staff.CompanyName?._id === company._id;
            return isAdminOrManager && matchesCompany;
        })
        ?.map((staff: any) => staff._id) || [];


    const handleSave = async () => {
        const complainData: Complaint = {
            subject,
            details,
            company: company._id,
            status,
            response,
            createdBy: user.id,
            assignTo: filteredStaffIds,
            scorder: company.companyName === "Sakshi Creation" ? orderId || null : null,
            qporder: company.companyName !== "Sakshi Creation" ? orderId || null : null,
        };
        console.log("DEBUG : handleSave : complainData:", complainData);


        try {
            if (editData?._id) {
                // Update
                await dispatch(updateComplainThunk({ id: editData._id, payload : complainData }))
            } else {
                // Create
                await dispatch(createComplainThunk(complainData))
            }
            onClose();
        } catch (error) {
            console.error("Error saving complaint:", error);
        }
    };

    // Prepare order options for dropdown
    const orderOptions = (company.companyName === "Sakshi Creation" ? orders : qporders)
        ?.filter((order: any) => order.createdBy?._id === user?.id || order.createdBy === user?.id)
        ?.map((order: any) => ({
            value: order._id,
            label: order.orderNumber || `QP-${order.orderNo}` || "Order",
        })) || [];


    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{editData ? "Edit Complaint" : "Add Complaint"}</DialogTitle>

            <DialogContent dividers>
                {/* Company Dropdown */}
                <Stack direction="row" spacing={2} mb={2}>

                    <ThemeSelect
                        label="Company"
                        options={companies.map((item) => ({ value: item._id, label: item.companyName }))}
                        value={companies.map((item) => ({ value: item._id, label: item.companyName })).find(opt => opt.value === company._id) || null}
                        disabled
                        onChange={(e, newValue) => setSelectedCompany(newValue?.value || "")}
                        required
                        sx={{ mb: 2 }}
                    />
                    <ThemeSelect
                        label="Related Order"
                        options={orderOptions}
                        value={orderOptions.find(opt => opt.value === orderId) || null}
                        onChange={(e, newValue) => setOrderId(newValue?.value || "")}
                        sx={{ mb: 2 }}
                    />
                </Stack>

                <ThemeInput
                    labelName="Complaint Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                />

                <ThemeInput
                    labelName="Details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                    sx={{ mb: 2 }}
                />

                {/* Orders Dropdown */}
                {editData && (
                    <>
                        <ThemeSelect
                            label="Status"
                            options={[
                                { value: "Pending", label: "Pending" },
                                { value: "In Progress", label: "In Progress" },
                                { value: "Completed", label: "Completed" }
                            ]}
                            value={{ value: status, label: status }}
                            onChange={(e, newValue) => setStatus(newValue?.value || "Pending")}
                        />

                        <ThemeInput
                            labelName="Response"
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            multiline
                            minRows={2}
                            fullWidth
                        />
                    </>
                )}

            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                <Button onClick={handleSave} color="primary" variant="contained">
                    {editData ? "Update" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ComplainDialogue;
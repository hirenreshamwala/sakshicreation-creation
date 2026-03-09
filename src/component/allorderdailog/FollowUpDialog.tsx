"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Avatar,
    Chip,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import { assignFollowUpThunk } from "@/store/slices/orderSlice";
import { toast } from "react-toastify";
import ThemeSelect from "../common_component/themeselect";
import ThemeInput from "../common_component/themeinput";
import ThemeButton from "../common_component/themebutton";

interface Staff {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    avatar?: string;
}

interface FollowUpData {
    staff?: Staff | null;
    status?: string;
    assignedAt?: string;
    remarks?: string;
}

interface Order {
    _id: string;
    orderNumber: string;
    followUp?: FollowUpData;
}

interface FollowUpDialogProps {
    open: boolean;
    onClose: () => void;
    order: Order | null;
    onSuccess?: () => void;
}

const FollowUpDialog: React.FC<FollowUpDialogProps> = ({
    open,
    onClose,
    order,
    onSuccess,
}: any) => {
    const dispatch = useAppDispatch();
    const { staffList = [] } = useAppSelector((state) => state.staff || {});
    const [selectedStaff, setSelectedStaff] = useState<string>("");
    const [remarks, setRemarks] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            dispatch(getAllStaffThunk());
            if (order?.followUp?.staff) {
                setSelectedStaff(order.followUp.staff._id);
                setRemarks(order.followUp.remarks || "");
            } else {
                setSelectedStaff("");
                setRemarks("");
            }
        }
    }, [open, order, dispatch]);

    const handleStaffChange = (event: any) => {
        setSelectedStaff(event.target.value as string);
    };

    const handleRemarksChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRemarks(event.target.value);
    };

    const handleSubmit = async () => {
        if (!order?._id) {
            toast.error("Order not found");
            return;
        }

        if (!selectedStaff) {
            toast.error("Please select a staff member");
            return;
        }

        setLoading(true);
        try {
            const result = await dispatch(
                assignFollowUpThunk({
                    orderId: order._id,
                    staffId: selectedStaff,
                    remarks: remarks || undefined,
                })
            ).unwrap();

            if (result) {
                toast.success("Follow-up assigned successfully");
                onSuccess?.();
                onClose();
            }
        } catch (error: any) {
            toast.error(error || "Failed to assign follow-up");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "Pending":
                return "warning";
            case "In Progress":
                return "info";
            case "Completed":
                return "success";
            case "Cancelled":
                return "error";
            default:
                return "default";
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Typography variant="h6" fontWeight="bold">
                    Assign Follow Up
                </Typography>
                {order && (
                    <Typography variant="body2" color="text.secondary">
                        Order: {order.orderNumber}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {/* Current Follow Up Status */}
                    {order?.followUp?.staff && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Current Assignment
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <Avatar
                                    src={order?.followUp?.staff?.avatar}
                                    alt={`${order?.followUp?.staff?.firstName} ${order?.followUp?.staff?.lastName}`}
                                    sx={{ width: 32, height: 32 }}
                                />
                                <Typography variant="body1">
                                    {order?.followUp?.staff?.firstName} {order?.followUp?.staff?.lastName}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Chip
                                    label={order?.followUp?.taskId?.status || ""}
                                    color={getStatusColor(order?.followUp?.taskId?.status) as any}
                                    size="small"
                                />
                                {order?.followUp?.assignedAt && (
                                    <Typography variant="caption" color="text.secondary">
                                        Assigned on:{" "}
                                        {new Date(order?.followUp?.assignedAt).toLocaleDateString()}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Staff Selection */}
                    <ThemeSelect
                        label="Select Staff"
                        value={staffList.find((item: any) => item._id === selectedStaff) as any}
                        options={staffList.map((item: any) => ({
                            value: item._id,
                            label: item.firstName + " " + item.lastName
                        }))}
                        onChange={handleStaffChange}
                        disabled={loading}
                        sx={{ mb: 2 }}
                    />

                    <ThemeInput
                        fullWidth
                        labelName="Remarks (Optional)"
                        multiline
                        rows={3}
                        value={remarks}
                        onChange={handleRemarksChange}
                        disabled={loading}
                        placeholder="Enter any additional notes or remarks..."
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <ThemeButton onClick={onClose} disabled={loading} variant="outlined">
                    Cancel
                </ThemeButton>
                <ThemeButton
                    onClick={handleSubmit}
                    disabled={loading || !selectedStaff}
                    variant="contained"
                >
                    {loading
                        ? "Saving..."
                        : order?.followUp?.staff
                            ? "Reassign Follow Up"
                            : "Assign Follow Up"}
                </ThemeButton>
            </DialogActions>
        </Dialog>
    );
};

export default FollowUpDialog;

import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    IconButton,
    TableCell,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useSelector } from "react-redux";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Button from "@/component/common_component/themebutton";
import CustomDialog from "@/component/customdialog";
import { RootState, useAppDispatch } from "@/store";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {   createPackagingOptionThunk,
    getAllPackagingOptionsThunk,
    updatePackagingOptionThunk,
    deletePackagingOptionThunk, } from "@/store/slices/packagingOptionSlice";


interface PackagingOption {
    _id: string;
    ply: string;
    size: string;
    gsm: string;
    deckal: string;
    createdAt: string;
    updatedAt: string;
}

const columns = [
    { id: "id", label: "ID" },
    { id: "ply", label: "Ply" },
    { id: "size", label: "Size" },
    { id: "gsm", label: "GSM" },
    { id: "deckal", label: "Deckal" },
    { id: "options", label: "Options" },
];

const PackagingOptionsPage = () => {
    const dispatch = useAppDispatch();
    const { packagingOptions, loading, operationLoading, error, operationError } = useSelector(
        (state: RootState) => state.packagingOptions
    );

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({
        ply: "",
        size: "",
        gsm: "",
        deckal: "",
    });

    useEffect(() => {
        if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk());
    }, []);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
        if (operationError) {
            toast.error(operationError);
        }
    }, [error, operationError]);

    const handleOpenDialog = (option?: PackagingOption) => {
        if (option) {
            setEditId(option._id);
            setForm({
                ply: option.ply,
                size: option.size,
                gsm: option.gsm,
                deckal: option.deckal,
            });
        } else {
            setEditId(null);
            setForm({
                ply: "",
                size: "",
                gsm: "",
                deckal: "",
            });
        }
        setDialogOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = () => {
        if (!form.ply.trim() || !form.size.trim() || !form.gsm.trim() || !form.deckal.trim()) {
            toast.error("All fields are required");
            return;
        }

        const packagingData = {
            ply: form.ply,
            size: form.size,
            gsm: form.gsm,
            deckal: form.deckal,
        };

        if (editId) {
            dispatch(updatePackagingOptionThunk({ id: editId, updateData: packagingData }));
        } else {
            dispatch(createPackagingOptionThunk(packagingData));
        }

        setDialogOpen(false);
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#7F56D9",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        });

        if (result.isConfirmed) {
            try {
                await dispatch(deletePackagingOptionThunk(id)).unwrap();
                Swal.fire({
                    title: "Deleted!",
                    text: "Packaging option deleted successfully",
                    icon: "success",
                    confirmButtonColor: "#7F56D9",
                });
            } catch (err: any) {
                Swal.fire({
                    title: "Error!",
                    text: err?.message || "Failed to delete packaging option",
                    icon: "error",
                    confirmButtonColor: "#7F56D9",
                });
            }
        }
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight={600}>
                    Packaging Options
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    disabled={loading || operationLoading}
                    sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        background: "#A409F8",
                        "&:hover": { background: "#7B06C2" },
                    }}
                >
                    New Packaging Option
                </Button>
            </Box>

            {/* Packaging Options Table */}
            <BasicTable
                tableHeader={columns}
                rowData={packagingOptions as any}
                showDatePicker={false}
                renderRow={(row: PackagingOption, idx: number) => (
                    <>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{row.ply}</TableCell>
                        <TableCell>{row.size}</TableCell>
                        <TableCell>{row.gsm}</TableCell>
                        <TableCell>{row.deckal}</TableCell>
                        <TableCell>
                            <IconButton
                                color="primary"
                                onClick={() => handleOpenDialog(row)}
                                disabled={operationLoading}
                            >
                                <Edit />
                            </IconButton>
                            <IconButton
                                color="error"
                                onClick={() => handleDelete(row._id)}
                                disabled={operationLoading}
                            >
                                <Delete />
                            </IconButton>
                        </TableCell>
                    </>
                )}
            />

            {/* Add/Edit Dialog */}
            <CustomDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editId ? "Edit Packaging Option" : "New Packaging Option"}
                maxWidth="sm"
                fullWidth
            >
                <Box display="grid" gap={2}>
                    <Input
                        label="Ply"
                        name="ply"
                        value={form.ply}
                        onChange={handleFormChange}
                        fullWidth
                        required
                    />
                    <Input
                        label="Size"
                        name="size"
                        value={form.size}
                        onChange={handleFormChange}
                        fullWidth
                        required
                    />
                    <Input
                        label="GSM"
                        name="gsm"
                        value={form.gsm}
                        onChange={handleFormChange}
                        fullWidth
                        required
                    />
                    <Input
                        label="Deckal"
                        name="deckal"
                        value={form.deckal}
                        onChange={handleFormChange}
                        fullWidth
                        required
                    />
                </Box>
                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                    <Button
                        onClick={() => setDialogOpen(false)}
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            borderColor: "#A409F8",
                            color: "#A409F8",
                            "&:hover": { borderColor: "#7B06C2", color: "#7B06C2" },
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={operationLoading}
                        sx={{
                            borderRadius: 2,
                            background: "#A409F8",
                            "&:hover": { background: "#7B06C2" },
                        }}
                    >
                        {operationLoading ? "Saving..." : "Save"}
                    </Button>
                </Box>
            </CustomDialog>
        </Box>
    );
};

export default PackagingOptionsPage;
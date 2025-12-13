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
import AddNewProductBulkDialog from "@/component/AddNewProductBulkDialog";
import {
    createBinderTypeThunk,
    getAllBinderTypesThunk,
    updateBinderTypeThunk,
    deleteBinderTypeThunk,
    clearBinderTypeError,
    clearBinderTypeSuccessMessage,
} from "@/store/slices/binderTypeSlice";
import { RootState, useAppDispatch } from "@/store";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

interface BinderType {
    _id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

const columns = [
    { id: "id", label: "ID" },
    { id: "name", label: "Binder Name" },
    { id: "options", label: "Options" },
];

const BinderTypesPage = () => {
    const dispatch = useAppDispatch();
    const { binderTypes, loading, error, successMessage } = useSelector((state: RootState) => state.binderType);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "" });

    useEffect(() => {
        if (!binderTypes.length) dispatch(getAllBinderTypesThunk());
    }, []);

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
            dispatch(clearBinderTypeSuccessMessage());
        }
        if (error) {
            toast.error(error);
            dispatch(clearBinderTypeError());
        }
    }, [successMessage, error, dispatch]);

    const handleOpenDialog = (binder?: BinderType) => {
        if (binder) {
            setEditId(binder._id);
            setForm({ name: binder.name });
        } else {
            setEditId(null);
            setForm({ name: "" });
        }
        setDialogOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ name: e.target.value });

    const handleSave = () => {
        if (!form.name.trim()) {
            toast.error("Binder name is required");
            return;
        }

        const binderData = { name: form.name };

        if (editId) dispatch(updateBinderTypeThunk({ id: editId, data: binderData } as any));
        else dispatch(createBinderTypeThunk(binderData));

        setDialogOpen(false);
        setForm({ name: "" });
        setEditId(null);
    };



    // ...

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
                await dispatch(deleteBinderTypeThunk(id)).unwrap();
                Swal.fire({
                    title: "Deleted!",
                    text: "Binder deleted successfully",
                    icon: "success",
                    confirmButtonColor: "#7F56D9",
                });
            } catch (err: any) {
                Swal.fire({
                    title: "Error!",
                    text: err?.message || "Failed to delete binder",
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
                    Binder Types
                </Typography>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        disabled={loading}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            mr: 2,
                            background: "#A409F8",
                            "&:hover": { background: "#7B06C2" },
                        }}
                    >
                        New Binder
                    </Button>
                    {/* <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setBulkDialogOpen(true)}
                        disabled={loading}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            background: "#A409F8",
                            "&:hover": { background: "#7B06C2" },
                        }}
                    >
                        Bulk Upload
                    </Button> */}
                </Box>
            </Box>

            {/* Binder Types Table */}
            <BasicTable
                tableHeader={columns}
                rowData={binderTypes as any}
                showDatePicker={false}
                renderRow={(row: BinderType, idx: number) => (
                    <>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>
                            <IconButton
                                color="primary"
                                onClick={() => handleOpenDialog(row)}
                                disabled={loading}
                            >
                                <Edit />
                            </IconButton>
                            <IconButton
                                color="error"
                                onClick={() => handleDelete(row._id)}
                                disabled={loading}
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
                title={editId ? "Edit Binder" : "New Binder"}
                maxWidth="xs"
                fullWidth
            >
                <Input
                    label="Binder Name"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    fullWidth
                    required
                    sx={{ mb: 2, mt: 1 }}
                />
                <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
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
                        disabled={loading}
                        sx={{
                            borderRadius: 2,
                            background: "#A409F8",
                            "&:hover": { background: "#7B06C2" },
                        }}
                    >
                        Save
                    </Button>
                </Box>
            </CustomDialog>

            {/* <AddNewProductBulkDialog
                open={bulkDialogOpen}
                onClose={() => setBulkDialogOpen(false)}
                refreshData={() => dispatch(getAllBinderTypesThunk())}
            /> */}
        </Box>
    );
};

export default BinderTypesPage;

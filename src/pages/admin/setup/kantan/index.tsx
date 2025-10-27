"use client";
import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    IconButton,
    TableCell,
} from "@mui/material";
import { Add, Edit, Delete, CloudUpload } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Button from "@/component/common_component/themebutton";
import CustomDialog from "@/component/customdialog";
import { RootState, useAppDispatch } from "@/store";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
    createKantanThunk,
    getAllKantansThunk,
    updateKantanThunk,
    deleteKantanThunk,
    bulkCreateKantansThunk,
} from "@/store/slices/kantanSlice";
import { Kantan } from "@/services/kantan.service";

const columns = [
    { id: "id", label: "ID" },
    { id: "name", label: "Kantan Name" },
    { id: "options", label: "Options" },
];

const KantanPage = () => {
    const dispatch = useAppDispatch();
    const { kantans, loading, operationLoading, error, operationError } =
        useSelector((state: RootState) => state.kantans);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (!kantans.length) dispatch(getAllKantansThunk());
    }, []);

    useEffect(() => {
        if (error) toast.error(error);
        if (operationError) toast.error(operationError);
    }, [error, operationError]);

    // ✅ Yup validation schema
    const validationSchema = Yup.object({
        kantanName: Yup.string().required("Kantan Name is required"),
    });

    // ✅ Formik hook
    const formik = useFormik({
        initialValues: {
            kantanName: "",
        },
        validationSchema,
        onSubmit: (values) => {
            if (editId) {
                dispatch(updateKantanThunk({ id: editId, updateData: values }));
            } else {
                dispatch(createKantanThunk(values));
            }
            setDialogOpen(false);
        },
        enableReinitialize: true,
    });

    const handleOpenDialog = (kantan?: any) => {
        if (kantan) {
            setEditId(kantan._id);
            formik.setValues({
                kantanName: kantan.kantanName,
            });
        } else {
            setEditId(null);
            formik.resetForm();
        }
        setDialogOpen(true);
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
                await dispatch(deleteKantanThunk(id)).unwrap();
                Swal.fire({
                    title: "Deleted!",
                    text: "Kantan deleted successfully",
                    icon: "success",
                    confirmButtonColor: "#7F56D9",
                });
            } catch (err: any) {
                Swal.fire({
                    title: "Error!",
                    text: err?.message || "Failed to delete kantan",
                    icon: "error",
                    confirmButtonColor: "#7F56D9",
                });
            }
        }
    };

    const handleFileUpload = async () => {
        if (!file) {
            toast.error("Please select a file");
            return;
        }
        const formData = new FormData();
        formData.append("file", file);

        try {
            dispatch(bulkCreateKantansThunk(formData));
            toast.success("Bulk upload successful");
            setBulkDialogOpen(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Bulk upload failed");
        }
    };

    const handleDownloadSample = () => {
        const csvContent = "kantanName\nSample Kantan\n";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "sample_kantans.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box p={3}>
            {/* Top Bar */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight={600}>
                    Kantans
                </Typography>
                <Box display="flex" gap={2}>
                    <Button variant="outlined" onClick={handleDownloadSample}>
                        Download Sample CSV
                    </Button>
                    <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setBulkDialogOpen(true)}>
                        Bulk Upload
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        disabled={loading || operationLoading}
                    >
                        New Kantan
                    </Button>
                </Box>
            </Box>

            {/* Table */}
            <BasicTable
                tableHeader={columns}
                rowData={kantans as any}
                showDatePicker={false}
                renderRow={(row: Kantan, idx: number) => (
                    <>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{row?.kantanName}</TableCell>
                        <TableCell>
                            <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                                <Edit />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDelete(row._id)}>
                                <Delete />
                            </IconButton>
                        </TableCell>
                    </>
                )}
            />

            <CustomDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={editId ? "Edit Kantan" : "New Kantan"}
                maxWidth="sm"
                fullWidth
            >
                <form onSubmit={formik.handleSubmit}>
                    <Box display="grid" gap={2}>
                        <Box>
                            <Input
                                label="KANTAN NAME"
                                name="kantanName"
                                value={formik.values.kantanName}
                                onChange={formik.handleChange}
                                fullWidth
                                error={formik.touched.kantanName && Boolean(formik.errors.kantanName)}
                                helperText={formik.touched.kantanName && formik.errors.kantanName}
                            />
                        </Box>
                    </Box>
                    <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                        <Button variant="outlined" onClick={() => setDialogOpen(false)}>
                            Close
                        </Button>
                        <Button type="submit" variant="contained">
                            {operationLoading ? "Saving..." : "Save"}
                        </Button>
                    </Box>
                </form>
            </CustomDialog>

            {/* Bulk Upload Dialog */}
            <CustomDialog
                open={bulkDialogOpen}
                onClose={() => setBulkDialogOpen(false)}
                title="Bulk Upload Kantans"
                maxWidth="sm"
                fullWidth
            >
                <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
                    <Box
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files.length > 0) {
                                setFile(e.dataTransfer.files[0]);
                            }
                        }}
                        sx={{
                            border: "2px dashed #7f56d9",
                            borderRadius: 3,
                            p: 4,
                            textAlign: "center",
                            width: "100%",
                            cursor: "pointer",
                            background: "#FAF5FF",
                            "&:hover": { background: "#F3E8FF" },
                        }}
                        onClick={() => document.getElementById("fileInput")?.click()}
                    >
                        <Typography variant="body1" color="textSecondary">
                            Drag & Drop CSV/Excel file here or click to select
                        </Typography>
                        <input
                            type="file"
                            id="fileInput"
                            style={{ display: "none" }}
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </Box>

                    {file && (
                        <Typography variant="body2" color="primary">
                            Selected File: {file.name}
                        </Typography>
                    )}

                    <Button variant="outlined" onClick={handleDownloadSample}>
                        Download Sample CSV
                    </Button>
                </Box>

                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                    <Button variant="outlined" onClick={() => setBulkDialogOpen(false)}>
                        Close
                    </Button>
                    <Button variant="contained" onClick={handleFileUpload} disabled={!file}>
                        Upload
                    </Button>
                </Box>
            </CustomDialog>
        </Box>
    );
};

export default KantanPage;
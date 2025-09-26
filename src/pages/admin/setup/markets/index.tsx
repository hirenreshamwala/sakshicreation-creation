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
    createMarketThunk,
    getAllMarketsThunk,
    updateMarketThunk,
    deleteMarketThunk,
    bulkCreateMarketsThunk,
} from "@/store/slices/marketDataSlice";
import { Market } from "@/services/marketData.service";

const columns = [
    { id: "id", label: "ID" },
    { id: "name", label: "Market Name" },
    { id: "area", label: "Area" },
    { id: "landmark", label: "Landmark" },
    { id: "pincode", label: "Pincode" },
    { id: "options", label: "Options" },
];

const MarketPage = () => {
    const dispatch = useAppDispatch();
    const { markets, loading, operationLoading, error, operationError } =
        useSelector((state: RootState) => state.markets);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (!markets.length) dispatch(getAllMarketsThunk());
    }, []);

    useEffect(() => {
        if (error) toast.error(error);
        if (operationError) toast.error(operationError);
    }, [error, operationError]);

    // ✅ Yup validation schema
    const validationSchema = Yup.object({
        marketName: Yup.string().required("Market Name is required"),
        area: Yup.string().required("Area is required"),
        landmark: Yup.string().nullable(),
        pincode: Yup.string()
            .matches(/^\d{6}$/, "Pincode must be 6 digits")
            .required("Pincode is required"),
    });

    // ✅ Formik hook
    const formik = useFormik({
        initialValues: {
            marketName: "",
            area: "",
            landmark: "",
            pincode: "",
        },
        validationSchema,
        onSubmit: (values) => {
            if (editId) {
                dispatch(updateMarketThunk({ id: editId, updateData: values }));
            } else {
                dispatch(createMarketThunk(values));
            }
            setDialogOpen(false);
        },
        enableReinitialize: true, // ✅ important for edit mode
    });

    const handleOpenDialog = (market?: any) => {
        if (market) {
            setEditId(market._id);
            formik.setValues({
                marketName: market.marketName,
                area: market.area,
                landmark: market.landmark,
                pincode: market.pincode,
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
                await dispatch(deleteMarketThunk(id)).unwrap();
                Swal.fire({
                    title: "Deleted!",
                    text: "Market deleted successfully",
                    icon: "success",
                    confirmButtonColor: "#7F56D9",
                });
            } catch (err: any) {
                Swal.fire({
                    title: "Error!",
                    text: err?.message || "Failed to delete market",
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
            dispatch(bulkCreateMarketsThunk(formData));
            toast.success("Bulk upload successful");
            setBulkDialogOpen(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Bulk upload failed");
        }
    };

    const handleDownloadSample = () => {
        const csvContent =
            "marketName,area,landmark,pincode\nMain Market,Downtown,Near Temple,400001\n";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "sample_markets.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box p={3}>
            {/* Top Bar */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" fontWeight={600}>
                    Markets
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
                        New Market
                    </Button>
                </Box>
            </Box>

            {/* Table */}
            <BasicTable
                showDatePicker={false}
                tableHeader={columns}
                rowData={markets as any}
                renderRow={(row: Market, idx: number) => (
                    <>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{row?.marketName}</TableCell>
                        <TableCell>{row?.area}</TableCell>
                        <TableCell>{row?.landmark}</TableCell>
                        <TableCell>{row?.pincode}</TableCell>
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
                title={editId ? "Edit Market" : "New Market"}
                maxWidth="sm"
                fullWidth
            >
                <form onSubmit={formik.handleSubmit}>
                    <Box display="grid" gap={2}>
                        {["marketName", "area", "landmark", "pincode"].map((field) => (
                            <Box key={field}>
                                <Input
                                    label={field.toUpperCase()}
                                    name={field}
                                    value={formik.values[field as keyof typeof formik.values]}
                                    onChange={(e) => {
                                        if (field === 'pincode') {
                                            const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                                            formik.setFieldValue("pincode", numericValue);
                                        }
                                        else formik.handleChange(e)
                                    }}
                                    fullWidth
                                    error={formik.touched[field as keyof typeof formik.touched] && Boolean(formik.errors[field as keyof typeof formik.errors])}
                                    helperText={formik.touched[field as keyof typeof formik.touched] && formik.errors[field as keyof typeof formik.errors]}
                                />
                            </Box>
                        ))}
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
                title="Bulk Upload Markets"
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
                            Drag & Drop CSV file here or click to select
                        </Typography>
                        <input
                            type="file"
                            id="fileInput"
                            style={{ display: "none" }}
                            accept=".csv"
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

export default MarketPage;
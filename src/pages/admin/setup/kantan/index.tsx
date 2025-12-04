"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TableCell,
  Chip,
} from "@mui/material";
import { Add, Edit, Delete, CloudUpload } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import CustomDialog from "@/component/customdialog";

import { RootState, useAppDispatch } from "@/store";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import {
  getAllKantansThunk,
  getKantanFiltersThunk,
  createKantanThunk,
  updateKantanThunk,
  deleteKantanThunk,
  bulkCreateKantansThunk,
  setKantanFilters,
} from "@/store/slices/kantanSlice";

const columns = [
  { id: "id", label: "ID" },
  { id: "kantanName", label: "Kantan Name" },
  { id: "actions", label: "Actions" },
];

const KantanPage = () => {
  const dispatch = useAppDispatch();

  const {
    kantans = [],
    loading,
    operationLoading,
    pagination,
    filters,
    availableFilters = { kantanNames: [] },
  } = useSelector((state: RootState) => state.kantans);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});

  // Fetch data with filters, search, pagination
  const fetchData = useCallback(() => {
    const apiFilters: any = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      search: filters.search || "",
    };

    if (activeFilters["Kantan Name"]?.length) {
      apiFilters.kantanNames = activeFilters["Kantan Name"];
    }

    dispatch(getAllKantansThunk(apiFilters));
  }, [dispatch, filters, activeFilters]);

  // Initial load + fetch filters
  useEffect(() => {
    fetchData();
    dispatch(getKantanFiltersThunk());
  }, []);

  // Re-fetch when page/search/filters change
  useEffect(() => {
    fetchData();
  }, [filters.page, filters.search, activeFilters]);

  // Formik
  const validationSchema = Yup.object({
    kantanName: Yup.string().trim().required("Kantan Name is required"),
  });

  const formik = useFormik({
    initialValues: { kantanName: "" },
    validationSchema,
    onSubmit: (values) => {
      const payload = { kantanName: values.kantanName.trim() };
      if (editId) {
        dispatch(updateKantanThunk({ id: editId, updateData: payload }));
      } else {
        dispatch(createKantanThunk(payload));
      }
      setDialogOpen(false);
    },
    enableReinitialize: true,
  });

  const handleOpenDialog = (kantan?: any) => {
    if (kantan) {
      setEditId(kantan._id);
      formik.setValues({ kantanName: kantan.kantanName });
    } else {
      setEditId(null);
      formik.resetForm();
    }
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete Kantan?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete",
    });

    if (result.isConfirmed) {
      await dispatch(deleteKantanThunk(id)).unwrap();
      toast.success("Kantan deleted successfully");
      fetchData();
    }
  };

  const handleFileUpload = async () => {
    if (!file) return toast.error("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    await dispatch(bulkCreateKantansThunk(formData)).unwrap();
    toast.success("Bulk upload successful");
    setBulkDialogOpen(false);
    setFile(null);
    fetchData();
  };

  const handleDownloadSample = () => {
    const csv = "kantanName\nSample Kantan 1\nAnother Kantan\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_kantans.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFilterChange = (newFilters: { [key: string]: string[] }) => {
    setActiveFilters(newFilters);
    dispatch(setKantanFilters({ page: 1 })); // reset to first page
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    dispatch(setKantanFilters({ page: 1, search: "" }));
  };

  const activeFilterCount = Object.values(activeFilters).flat().length;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Kantans</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={handleDownloadSample}>
            Download Sample CSV
          </Button>
          <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setBulkDialogOpen(true)}>
            Bulk Upload
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            New Kantan
          </Button>
        </Box>
      </Box>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <Box mb={2} display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="body2" color="textSecondary">Filters:</Typography>
          {Object.entries(activeFilters).map(([field, values]) =>
            values.map((val) => (
              <Chip
                key={`${field}-${val}`}
                label={`${field}: ${val}`}
                onDelete={() => {
                  const updated = activeFilters[field].filter((v) => v !== val);
                  setActiveFilters((prev) => ({
                    ...prev,
                    [field]: updated.length ? updated : [],
                  }));
                }}
                size="small"
                color="primary"
              />
            ))
          )}
          <Button size="small" onClick={clearAllFilters}>Clear All</Button>
        </Box>
      )}

      {/* Table with Server-side Pagination + Filtering */}
      <BasicTable
        serverSide={true}
        tableHeader={columns}
        rowData={kantans}
        loading={loading}
        totalCount={pagination?.totalItems || 0}
        pagination={pagination}
        onPageChange={(page) => dispatch(setKantanFilters({ page }))}
        onSearchChange={(search) => dispatch(setKantanFilters({ search, page: 1 }))}
        onFilterChange={handleFilterChange}
        availableFilters={{
          "Kantan Name": availableFilters.kantanNames || [], // Maps to "Kantan Name" filter
        }}
        showExcelDownload={true}
        excelHeaders={["Kantan Name"]}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{(filters.page - 1) * filters.limit + idx + 1}</TableCell>
            <TableCell>{row.kantanName}</TableCell>
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

      {/* Add/Edit Dialog */}
      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Kantan" : "New Kantan"}>
        <form onSubmit={formik.handleSubmit}>
          <Input
            label="Kantan Name"
            name="kantanName"
            value={formik.values.kantanName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.kantanName && Boolean(formik.errors.kantanName)}
            helperText={formik.touched.kantanName && formik.errors.kantanName}
            fullWidth
          />
          <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={operationLoading}>
              {operationLoading ? "Saving..." : "Save"}
            </Button>
          </Box>
        </form>
      </CustomDialog>

      {/* Bulk Upload Dialog */}
      <CustomDialog open={bulkDialogOpen} onClose={() => { setBulkDialogOpen(false); setFile(null); }} title="Bulk Upload Kantans">
        <Box textAlign="center" p={4}>
          <Box
            onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            sx={{ border: "2px dashed #7f56d9", borderRadius: 3, p: 6, background: "#f8f5ff", cursor: "pointer" }}
            onClick={() => document.getElementById("kantanBulkFile")?.click()}
          >
            <Typography>Drop CSV here or click to browse</Typography>
            <input
              id="kantanBulkFile"
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Box>
          {file && <Typography mt={2} color="primary">Selected: {file.name}</Typography>}
          <Button variant="outlined" sx={{ mt: 2 }} onClick={handleDownloadSample}>
            Download Sample
          </Button>
        </Box>
        <Box display="flex" justifyContent="flex-end" gap={2} p={2}>
          <Button variant="outlined" onClick={() => { setBulkDialogOpen(false); setFile(null); }}>Cancel</Button>
          <Button variant="contained" onClick={handleFileUpload} disabled={!file || operationLoading}>
            Upload
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default KantanPage;
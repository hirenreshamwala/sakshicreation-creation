"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  Chip,
  Button,
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
  getAllMarketsThunk,
  getMarketFiltersThunk,
  createMarketThunk,
  updateMarketThunk,
  deleteMarketThunk,
  bulkCreateMarketsThunk,
  setMarketFilters,
} from "@/store/slices/marketDataSlice";

const columns = [
  { id: "id", label: "ID" },
  { id: "marketName", label: "Market Name" },
  { id: "area", label: "Area" },
  { id: "landmark", label: "Landmark" },
  { id: "pincode", label: "Pincode" },
  { id: "actions", label: "Actions" },
];

const MarketPage = () => {
  const dispatch = useAppDispatch();
  const {
    markets = [],
    loading,
    operationLoading,
    pagination,
    filters,
    availableFilters = { marketNames: [], areas: [], landmarks: [], pincodes: [] },
  } = useSelector((state: RootState) => state.markets);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});

  // Fetch data on mount + when filters change
  const fetchData = useCallback(() => {
    const apiFilters: any = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      search: filters.search || "",
    };

    if (activeFilters["Market Name"]?.length) apiFilters.marketNames = activeFilters["Market Name"];
    if (activeFilters["Area"]?.length) apiFilters.areas = activeFilters["Area"];
    if (activeFilters["Landmark"]?.length) apiFilters.landmarks = activeFilters["Landmark"];
    if (activeFilters["Pincode"]?.length) apiFilters.pincodes = activeFilters["Pincode"];

    dispatch(getAllMarketsThunk(apiFilters));
  }, [dispatch, filters, activeFilters]);


  
  useEffect(() => {
    fetchData();
    dispatch(getMarketFiltersThunk());
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters.page, filters.search, activeFilters]);

  // Formik
  const validationSchema = Yup.object({
    marketName: Yup.string().required("Required"),
    area: Yup.string().required("Required"),
    landmark: Yup.string().nullable(),
    pincode: Yup.string().matches(/^\d{6}$/, "Must be 6 digits").required("Required"),
  });

  const formik = useFormik({
    initialValues: { marketName: "", area: "", landmark: "", pincode: "" },
    validationSchema,
    onSubmit: (values) => {
      if (editId) {
        dispatch(updateMarketThunk({ id: editId, updateData: values }));
      } else {
        dispatch(createMarketThunk(values));
      }
      setDialogOpen(false);
    },
    enableReinitialize: true,
  });

  const handleOpenDialog = (market?: any) => {
    if (market) {
      setEditId(market._id);
      formik.setValues({
        marketName: market.marketName,
        area: market.area,
        landmark: market.landmark || "",
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
      title: "Delete Market?",
      text: "This cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete",
    });
    if (result.isConfirmed) {
      await dispatch(deleteMarketThunk(id)).unwrap();
      toast.success("Market deleted");
      fetchData();
    }
  };

  const handleFileUpload = async () => {
    if (!file) return toast.error("Select a file");
    const formData = new FormData();
    formData.append("file", file);
    await dispatch(bulkCreateMarketsThunk(formData)).unwrap();
    toast.success("Bulk upload successful");
    setBulkDialogOpen(false);
    setFile(null);
    fetchData();
  };

  const handleDownloadSample = () => {
    const csv = "marketName,area,landmark,pincode\nMain Market,Central,Near Station,400001\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_markets.csv";
    a.click();
  };

  const handleFilterChange = (newFilters: { [key: string]: string[] }) => {
    setActiveFilters(newFilters);
    dispatch(setMarketFilters({ page: 1 }));
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    dispatch(setMarketFilters({ page: 1, search: "" }));
  };

  const activeFilterCount = Object.values(activeFilters).flat().length;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Markets</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={handleDownloadSample}>
            Download Sample CSV
          </Button>
          <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setBulkDialogOpen(true)}>
            Bulk Upload
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            New Market
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
                  if (!updated.length) delete activeFilters[field];
                }}
                size="small"
                color="primary"
              />
            ))
          )}
          <Button size="small" onClick={clearAllFilters}>Clear All</Button>
        </Box>
      )}

      {/* Table */}
      <BasicTable
        serverSide={true}
        tableHeader={columns}
        rowData={markets}
        loading={loading}
        totalCount={pagination?.totalItems || 0}
        pagination={pagination}
        onPageChange={(page) => dispatch(setMarketFilters({ page }))}
        onSearchChange={(search) => dispatch(setMarketFilters({ search, page: 1 }))}
        onFilterChange={handleFilterChange}
      availableFilters={{
    "Market Name": availableFilters.marketNames || [],
    "Area":        availableFilters.areas || [],
    "Landmark":    availableFilters.landmarks || [],
    "Pincode":     availableFilters.pincodes || [],
  }}
        showExcelDownload={true}
        excelHeaders={["Market Name", "Area", "Landmark", "Pincode"]}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{(filters.page - 1) * filters.limit + idx + 1}</TableCell>
            <TableCell>{row.marketName}</TableCell>
            <TableCell>{row.area}</TableCell>
            <TableCell>{row.landmark || "-"}</TableCell>
            <TableCell>{row.pincode}</TableCell>
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
      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Market" : "New Market"}>
        <form onSubmit={formik.handleSubmit}>
          <Box display="grid" gap={2}>
            {["marketName", "area", "landmark", "pincode"].map((field) => (
              <Input
                key={field}
                label={field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                name={field}
                value={formik.values[field as keyof typeof formik.values]}
                onChange={(e) => {
                  if (field === "pincode") {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    formik.setFieldValue(field, val);
                  } else {
                    formik.setFieldValue(field, e.target.value.toUpperCase());
                  }
                }}
                error={formik.touched[field as keyof typeof formik.touched] && Boolean(formik.errors[field as keyof typeof formik.errors])}
                helperText={formik.touched[field as keyof typeof formik.touched] && formik.errors[field as keyof typeof formik.errors]}
              />
            ))}
          </Box>
          <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={operationLoading}>
              {operationLoading ? "Saving..." : "Save"}
            </Button>
          </Box>
        </form>
      </CustomDialog>

      {/* Bulk Upload Dialog */}
      <CustomDialog open={bulkDialogOpen} onClose={() => { setBulkDialogOpen(false); setFile(null); }} title="Bulk Upload">
        <Box textAlign="center" p={4}>
          <Box
            onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            sx={{ border: "2px dashed #7f56d9", borderRadius: 3, p: 6, background: "#f8f5ff", cursor: "pointer" }}
            onClick={() => document.getElementById("bulkFile")?.click()}
          >
            <Typography>Drop CSV here or click to browse</Typography>
            <input id="bulkFile" type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </Box>
          {file && <Typography mt={2} color="primary">Selected: {file.name}</Typography>}
          <Button variant="outlined" sx={{ mt: 2 }} onClick={handleDownloadSample}>
            Download Sample
          </Button>
        </Box>
        <Box display="flex" justifyContent="flex-end" gap={2} p={2}>
          <Button variant="outlined" onClick={() => { setBulkDialogOpen(false); setFile(null); }}>Cancel</Button>
          <Button variant="contained" onClick={handleFileUpload} disabled={!file}>Upload</Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default MarketPage;
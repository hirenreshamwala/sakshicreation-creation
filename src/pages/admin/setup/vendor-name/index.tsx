"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
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
  getAllVendorsThunk,
  getVendorFiltersThunk,
  createVendorThunk,
  updateVendorThunk,
  deleteVendorThunk,
  bulkCreateVendorsThunk,
  setVendorFilters,
} from "@/store/slices/vendorSlice";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";

const columns = [
  { id: "id", label: "ID" },
  { id: "companyName", label: "Company Name" },
  { id: "name", label: "Vendor Name" },
  { id: "contactNumber", label: "Contact" },
  { id: "whatsappNumber", label: "WhatsApp" },
  { id: "gst", label: "GST" },
  { id: "address", label: "Address" },
  { id: "actions", label: "Actions" },
];

const VendorPage = () => {
  const dispatch = useAppDispatch();

  const {
    vendors = [],
    loading,
    operationLoading,
    pagination,
    filters,
    availableFilters = { companyNames: [], vendorNames: [], contactNumbers: [], whatsappNumbers: [], gstNumbers: [], address: [] },
  } = useSelector((state: RootState) => state.vendors);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [bulkCompanyName, setBulkCompanyName] = useState<string>("");
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});
  const searchTimeoutRef = useRef<number | null>(null);
  
 const fetchData = useCallback(() => {
    const apiFilters: any = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      search: filters.search || "",
    };
    console.log("🚀 ~ VendorPage ~ apiFilters:", apiFilters)

    if (activeFilters["Company Name"]?.length) {
      apiFilters.companyNames = activeFilters["Company Name"];
    }
    if (activeFilters["Vendor Name"]?.length) {
      apiFilters.vendorNames = activeFilters["Vendor Name"];
    }
    if (activeFilters["Contact"]?.length) {
      apiFilters.contactNumbers = activeFilters["Contact"];
    }
    if (activeFilters["WhatsApp"]?.length) {
      apiFilters.whatsappNumbers = activeFilters["WhatsApp"];
    }
    if (activeFilters["GST"]?.length) {
      apiFilters.gstNumbers = activeFilters["GST"];
    }
if (activeFilters["Address"]?.length) apiFilters.address = activeFilters["Address"];


    dispatch(getAllVendorsThunk(apiFilters));
  }, [dispatch, filters, activeFilters]);
  const handleSearchDebounced = useCallback(
    (search: string) => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = window.setTimeout(() => {
        dispatch(setVendorFilters({ search: search.trim(), page: 1 }));
      }, 500);
    },
    [dispatch]
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

 

  useEffect(() => {
    fetchData();
    dispatch(getVendorFiltersThunk());
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters.page, filters.search, activeFilters]);

  const validationSchema = Yup.object({
    companyName: Yup.string().required("Company Name is required"),
    name: Yup.string().trim().required("Vendor Name is required"),
    contactNumber: Yup.string().matches(/^[0-9]{10}$/, "Contact Number must be 10 digits").required("Contact Number is required"),
    whatsappNumber: Yup.string().matches(/^[0-9]{10}$/, "WhatsApp Number must be 10 digits").required("WhatsApp Number is required"),
    gst: Yup.string().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST format").notRequired(),
    address: Yup.string().trim().required("Address is required"),
  });

  const formik = useFormik({
    initialValues: { companyName: "", name: "", contactNumber: "", whatsappNumber: "", gst: "", address: "" },
    validationSchema,
    onSubmit: (values) => {
      if (editId) {
        dispatch(updateVendorThunk({ id: editId, updateData: values }));
      } else {
        dispatch(createVendorThunk(values));
      }
      setDialogOpen(false);
    },
    enableReinitialize: true,
  });

  const handleOpenDialog = (vendor?: any) => {
    if (vendor) {
      setEditId(vendor._id);
      formik.setValues({
        companyName: vendor.companyName?._id || "",
        name: vendor.name,
        contactNumber: vendor.contactNumber,
        whatsappNumber: vendor.whatsappNumber,
        gst: vendor.gst,
        address: vendor.address,
      });
    } else {
      setEditId(null);
      formik.resetForm();
    }
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete Vendor?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete",
    });

    if (result.isConfirmed) {
      await dispatch(deleteVendorThunk(id)).unwrap();
      toast.success("Vendor deleted successfully");
      fetchData();
    }
  };

  const handleFileUpload = async () => {
    if (!file) return toast.error("Please select a file");
    if (!bulkCompanyName) return toast.error("Please select Company Name");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyName", bulkCompanyName);

    await dispatch(bulkCreateVendorsThunk(formData)).unwrap();
    toast.success("Bulk upload successful");
    setBulkDialogOpen(false);
    setFile(null);
    setBulkCompanyName("");
    fetchData();
  };

  const handleDownloadSample = () => {
    const csv = "name,contactNumber,whatsappNumber,gst,address\nSample Vendor,1234567890,1234567890,27AAAAA0000A1Z5,Sample Address\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_vendors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFilterChange = (newFilters: { [key: string]: string[] }) => {
    setActiveFilters(newFilters);
    dispatch(setVendorFilters({ page: 1 }));
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    dispatch(setVendorFilters({ page: 1, search: "" }));
  };

  const activeFilterCount = Object.values(activeFilters).flat().length;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Vendors</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={handleDownloadSample}>
            Download Sample CSV
          </Button>
          <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setBulkDialogOpen(true)}>
            Bulk Upload
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            New Vendor
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
        rowData={vendors}
        loading={loading}
        totalCount={pagination?.totalItems || 0}
        pagination={pagination}
        onPageChange={(page) => dispatch(setVendorFilters({ page }))}
        onSearchChange={handleSearchDebounced}
        onFilterChange={handleFilterChange}
        availableFilters={{
          "Company Name": availableFilters.companyNames || [],
          "Vendor Name": availableFilters.vendorNames || [],
          "Contact": availableFilters.contactNumbers || [],
          "WhatsApp": availableFilters.whatsappNumbers || [],
          "GST": availableFilters.gstNumbers || [],
          "Address": availableFilters.address || [],
        }}
        showExcelDownload={true}
        excelHeaders={["Company Name", "Vendor Name", "Contact", "WhatsApp", "GST", "Address"]}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{(filters.page - 1) * filters.limit + idx + 1}</TableCell>
            <TableCell>{row.companyName?.companyName || row.companyName}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.contactNumber}</TableCell>
            <TableCell>{row.whatsappNumber}</TableCell>
            <TableCell>{row.gst || "—"}</TableCell>
            <TableCell>{row.address}</TableCell>
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
      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Vendor" : "New Vendor"}>
        <form onSubmit={formik.handleSubmit}>
          <Input
            label="Company Name"
            name="companyName"
            value={formik.values.companyName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.companyName && Boolean(formik.errors.companyName)}
            helperText={formik.touched.companyName && formik.errors.companyName}
            fullWidth
          />
          <Input
            label="Vendor Name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            fullWidth
          />
          <Input
            label="Contact Number"
            name="contactNumber"
            value={formik.values.contactNumber}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.contactNumber && Boolean(formik.errors.contactNumber)}
            helperText={formik.touched.contactNumber && formik.errors.contactNumber}
            fullWidth
          />
          <Input
            label="WhatsApp Number"
            name="whatsappNumber"
            value={formik.values.whatsappNumber}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.whatsappNumber && Boolean(formik.errors.whatsappNumber)}
            helperText={formik.touched.whatsappNumber && formik.errors.whatsappNumber}
            fullWidth
          />
          <Input
            label="GST"
            name="gst"
            value={formik.values.gst}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.gst && Boolean(formik.errors.gst)}
            helperText={formik.touched.gst && formik.errors.gst}
            fullWidth
          />
          <Input
            label="Address"
            name="address"
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.address && Boolean(formik.errors.address)}
            helperText={formik.touched.address && formik.errors.address}
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
      <CustomDialog open={bulkDialogOpen} onClose={() => { setBulkDialogOpen(false); setFile(null); setBulkCompanyName(""); }} title="Bulk Upload Vendors">
        <Box textAlign="center" p={4}>
          <CompanySelect
            value={bulkCompanyName}
            onChange={(_, newValue) => setBulkCompanyName(newValue?.value || "")}
            required
            sx={{ mb: 2 }}
          />
          <Box
            onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            sx={{ border: "2px dashed #7f56d9", borderRadius: 3, p: 6, background: "#f8f5ff", cursor: "pointer" }}
            onClick={() => document.getElementById("vendorBulkFile")?.click()}
          >
            <Typography>Drop CSV here or click to browse</Typography>
            <input
              id="vendorBulkFile"
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
          <Button variant="outlined" onClick={() => { setBulkDialogOpen(false); setFile(null); setBulkCompanyName(""); }}>Cancel</Button>
          <Button variant="contained" onClick={handleFileUpload} disabled={!file || !bulkCompanyName || operationLoading}>
            Upload
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default VendorPage;
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  Grid,
} from "@mui/material";
import { Add, Edit, Delete, CloudUpload } from "@mui/icons-material";
import { useSelector } from "react-redux";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Button from "@/component/common_component/themebutton";
import CustomDialog from "@/component/customdialog";
import { RootState, useAppDispatch } from "@/store";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  createPackagingOptionThunk,
  getAllPackagingOptionsThunk,
  updatePackagingOptionThunk,
  deletePackagingOptionThunk,
  bulkCreatePackagingOptionThunk,
} from "@/store/slices/packagingOptionSlice";
import { PackagingOption } from "@/services/packagingOption.service";

const columns = [
  { id: "id", label: "ID" },
  { id: "name", label: "Name" },
  { id: "ply", label: "Ply" },
  { id: "length", label: "Length" },
  { id: "width", label: "Width" },
  { id: "height", label: "Height" },
  { id: "options", label: "Options" },
];

const PackagingOptionsPage = () => {
  const dispatch = useAppDispatch();
  const { packagingOptions, loading, operationLoading, error, operationError } = useSelector(
    (state: RootState) => state.packagingOptions
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    ply: "",
    length: "",
    width: "",
    height: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk());
  }, []);

  useEffect(() => {
    if (error) toast.error(error);
    if (operationError) toast.error(operationError);
  }, [error, operationError]);

  const handleOpenDialog = (option?: any) => {
    if (option) {
      setEditId(option._id);
      setForm({
        name: option.name || "",
        ply: option.ply || "",
        length: option.length || "",
        width: option.width || "",
        height: option.height || "",
      });
    } else {
      setEditId(null);
      setForm({ name: "", ply: "", length: "", width: "", height: "" });
    }
    setDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.ply.trim() || !form.length.trim() || !form.width.trim() || !form.height.trim()) {
      toast.error("All fields are required");
      return;
    }
    const packagingData = { ...form };
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

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      await dispatch(bulkCreatePackagingOptionThunk(formData)).unwrap();
      toast.success("Bulk upload successful");
      setBulkDialogOpen(false);
      setFile(null);
      dispatch(getAllPackagingOptionsThunk());
    } catch (error: any) {
      toast.error(error?.message || "Bulk upload failed");
    }
  };

  const handleDownloadSample = () => {
    const csvContent = "name,ply,length,width,height\nSample Packaging,3,10,20,30\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "sample_packaging_options.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openBulkDialog = () => {
    setFile(null);
    setBulkDialogOpen(true);
  };

  const closeBulkDialog = () => {
    setFile(null);
    setBulkDialogOpen(false);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Cartoon
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={handleDownloadSample}
            sx={{ borderRadius: 2 }}
          >
            Download Sample CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={openBulkDialog}
          >
            Bulk Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={loading || operationLoading}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            New Cartoon
          </Button>
        </Box>
      </Box>

      <BasicTable
        tableHeader={columns}
        rowData={packagingOptions as any}
        showDatePicker={false}
        renderRow={(row: PackagingOption, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.name || ""}</TableCell>
            <TableCell>{row.ply || ""}</TableCell>
            <TableCell>{row.length || ""}</TableCell>
            <TableCell>{row.width || ""}</TableCell>
            <TableCell>{row.height || ""}</TableCell>
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
      {/* Add/Edit Dialog */}
      <CustomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editId ? "Edit Cartoon" : "New Cartoon"}
        maxWidth="sm"
        fullWidth
      >
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Row for Name + Ply */}
          <Box display="flex" gap={2}>
            <Input
              label="NAME"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <Input
              label="PLY"
              name="ply"
              value={form.ply}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Box>

          {/* Row for Length + Width + Height */}
          <Box display="flex" gap={2}>
            <Input
              label="LENGTH"
              name="length"
              value={form.length}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <Input
              label="WIDTH"
              name="width"
              value={form.width}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <Input
              label="HEIGHT"
              name="height"
              value={form.height}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Box>
        </Box>

        {/* Footer Buttons */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)}>
            Close
          </Button>
          <Button variant="contained" onClick={handleSave}>
            {operationLoading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </CustomDialog>



      {/* Bulk Upload Dialog */}
      <CustomDialog
        open={bulkDialogOpen}
        onClose={closeBulkDialog}
        title="Bulk Upload Packaging Options"
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

          <Button
            variant="outlined"
            onClick={handleDownloadSample}
          >
            Download Sample CSV
          </Button>
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button
            variant="outlined"
            onClick={closeBulkDialog}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleFileUpload}
            disabled={!file}
            sx={{ background: "primary", "&:hover": { background: "primary" } }}
          >
            Upload
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default PackagingOptionsPage;
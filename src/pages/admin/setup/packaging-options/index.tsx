import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TableCell,
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
import axios from "axios"; // <-- Add axios
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
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false); // Bulk dialog
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    ply: "",
    size: "",
    gsm: "",
    deckal: "",
  });
  const [file, setFile] = useState<File | null>(null); // File state

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
        ply: option.ply,
        size: option.size,
        gsm: option.gsm,
        deckal: option.deckal,
      });
    } else {
      setEditId(null);
      setForm({ ply: "", size: "", gsm: "", deckal: "" });
    }
    setDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!form.ply.trim() || !form.size.trim() || !form.gsm.trim() || !form.deckal.trim()) {
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
      dispatch(bulkCreatePackagingOptionThunk(formData))
      toast.success("Bulk upload successful");
      setBulkDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Bulk upload failed");
    }
  };

  const handleDownloadSample = () => {
    const csvContent = "ply,size,gsm,deckal\n3,10x20,200,40\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "sample_packaging_options.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Bulk Upload Modal
const openBulkDialog = () => {
  setFile(null); // Clear previously selected file
  setBulkDialogOpen(true);
};

// Close Bulk Upload Modal
const closeBulkDialog = () => {
  setFile(null); // Clear file on close
  setBulkDialogOpen(false);
};


  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Packaging Options
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
            New Packaging Option
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
            <TableCell>{row.ply}</TableCell>
            <TableCell>{row.size}</TableCell>
            <TableCell>{row.gsm}</TableCell>
            <TableCell>{row.deckal}</TableCell>
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
      <CustomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editId ? "Edit Packaging Option" : "New Packaging Option"}
        maxWidth="sm"
        fullWidth
      >
        <Box display="grid" gap={2}>
          {["ply", "size", "gsm", "deckal"].map((field) => (
            <Input
              key={field}
              label={field.toUpperCase()}
              name={field}
              value={(form as any)[field]}
              onChange={handleFormChange}
              fullWidth
              required
            />
          ))}
        </Box>
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleSave}>
            {operationLoading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </CustomDialog>

      {/* Bulk Upload Dialog */}
      {/* Bulk Upload Dialog */}
<CustomDialog
  open={bulkDialogOpen}
  onClose={() => setBulkDialogOpen(false)}
  title="Bulk Upload Packaging Options"
  maxWidth="sm"
  fullWidth
>
  <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
    {/* Drag & Drop Upload Area */}
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

    {/* Show Selected File */}
    {file && (
      <Typography variant="body2" color="primary">
        Selected File: {file.name}
      </Typography>
    )}

    {/* Download Sample CSV */}
    <Button
      variant="outlined"
      onClick={handleDownloadSample}
    >
      Download Sample CSV
    </Button>
  </Box>

  {/* Modal Actions */}
  <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
    <Button
      variant="outlined"
      onClose={closeBulkDialog}
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

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
import { bulkCreatePaperGSMThunk, createPaperGSMThunk, deletePaperGSMThunk, getAllPaperGSMThunk, updatePaperGSMThunk } from "@/store/slices/paperGSMSlice";
import { PaperGSM } from "@/services/paperGSM.service";


const columns = [
  { id: "id", label: "ID" },
  // { id: "name", label: "Name" },
  { id: "deckal", label: "Deckal" },
  { id: "gsm", label: "GSM" },
  { id: "options", label: "Options" },
];

const PaperGSMPage = () => {
  const dispatch = useAppDispatch();
  const { paperGSM, loading, operationLoading, error, operationError } = useSelector(
    (state: RootState) => state.paperGSMs
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    deckal: "",
    gsm: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!paperGSM.length) dispatch(getAllPaperGSMThunk());
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
        deckal: option.deckal || "",
        gsm:  option.gsm || "",
      });
    } else {
      setEditId(null);
      setForm({ name: "", deckal: "", gsm: "" });
    }
    setDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!form.deckal.trim() || !form.gsm.trim()) {
      toast.error("All fields are required");
      return;
    }
    const paperData = { ...form };
    if (editId) {
      dispatch(updatePaperGSMThunk({ id: editId, updateData: paperData }));
    } else {
      dispatch(createPaperGSMThunk(paperData));
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
        await dispatch(deletePaperGSMThunk(id)).unwrap();
        Swal.fire({
          title: "Deleted!",
          text: "Paper GSM deleted successfully",
          icon: "success",
          confirmButtonColor: "#7F56D9",
        });
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err?.message || "Failed to delete Paper GSM",
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
      await dispatch(bulkCreatePaperGSMThunk(formData)).unwrap();
      toast.success("Bulk upload successful");
      setBulkDialogOpen(false);
      setFile(null);
      dispatch(getAllPaperGSMThunk());
    } catch (error: any) {
      toast.error(error?.message || "Bulk upload failed");
    }
  };

  const handleDownloadSample = () => {
    const csvContent = "deckal,gsm\n24,100\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "sample_paper_GSM.csv");
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
          Paper GSM
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
            New Paper GSM
          </Button>
        </Box>
      </Box>

      <BasicTable
        tableHeader={columns}
        rowData={paperGSM as any}
        showDatePicker={false}
        renderRow={(row: PaperGSM, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            {/* <TableCell>{row?.name || ""}</TableCell> */}
            <TableCell>{row?.deckal || ""}</TableCell>
            <TableCell>{row?.gsm || ""}</TableCell>
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
        title={editId ? "Edit Paper GSM" : "New Paper GSM"}
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
            />
          </Box>

          {/* Row for Length + Width + Height */}
          <Box display="flex" gap={2}>
            <Input
              label="Deckal"
              name="deckal"
              value={form.deckal}
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
        title="Bulk Upload Paper GSM"
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

export default PaperGSMPage;
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
import { getQualityPackingPartiesThunk } from "@/store/slices/partySlice";
import { downloadSkippedRecordsAsCSV } from "@/utills/utills";

const columns = [
  { id: "id", label: "ID" },
  { id: "party", label: "Party" },
  { id: "ply", label: "Ply" },
  { id: "length", label: "Length" },
  { id: "width", label: "Width" },
  { id: "height", label: "Height" },
  { id: "deckal", label: "Deckal" },
  { id: "paper1GSM", label: "Paper 1 GSM" },
  { id: "paper2GSM", label: "Paper 2 GSM" },
  { id: "paper3GSM", label: "Paper 3 GSM" },
  { id: "options", label: "Options" },
];

const PackagingOptionsPage = () => {
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState)=> state.auth)
  const { packagingOptions, loading, operationLoading, error, operationError } = useSelector(
    (state: RootState) => state.packagingOptions
  );
  const companyId = user?.company?._id
  console.log("DEBUG : PackagingOptionsPage : companyId:", companyId);

  const { qpParties } = useSelector((state: RootState) => state.party);
  console.log("DEBUG : PackagingOptionsPage : qpParties:", qpParties);

  useEffect(() => {
    dispatch(getQualityPackingPartiesThunk(companyId));
    if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk());
  }, [dispatch]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    party: "",
    ply: "",
    length: "",
    width: "",
    height: "",
    deckal: "",
    paper1GSM: "",
    paper2GSM: "",
    paper3GSM: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [skippedRecords, setSkippedRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (error) toast.error(error);
    if (operationError) toast.error(operationError);
  }, [error, operationError]);

  const handleOpenDialog = (option?: any) => {
    if (option) {
      setEditId(option._id);
      setForm({
        party: option.party?._id || "",
        ply: option.ply || "",
        length: option.length || "",
        width: option.width || "",
        height: option.height || "",
        deckal: option.deckal || "",
        paper1GSM: option.paper1GSM || "",
        paper2GSM: option.paper2GSM || "",
        paper3GSM: option.paper3GSM || "",
      });
    } else {
      setEditId(null);
      setForm({
        party: "",
        ply: "",
        length: "",
        width: "",
        height: "",
        deckal: "",
        paper1GSM: "",
        paper2GSM: "",
        paper3GSM: "",
      });
    }
    setDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleSave = () => {
    if (
      !form.party ||
      !form.ply.trim() ||
      !form.length.trim() ||
      !form.width.trim() ||
      !form.height.trim() ||
      !form.deckal.trim() ||
      !form.paper1GSM.trim() ||
      !form.paper2GSM.trim() ||
      !form.paper3GSM.trim()
    ) {
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

    setIsLoading(true);
    try {
      const res = await dispatch(bulkCreatePackagingOptionThunk(formData)).unwrap();
      console.log("DEBUG : handleFileUpload : res:", res);

      if (res.skippedCount > 0) {
        setSkippedRecords(res.skippedRecords);
        setFile(null);
        const input = document.getElementById("fileInput") as HTMLInputElement;
        if (input) input.value = "";
        toast.success("Bulk upload completed with some skipped records");
        dispatch(getAllPackagingOptionsThunk());
        return; // Keep dialog open to show skipped records
      }
      toast.success("Bulk upload completed successfully");
      setBulkDialogOpen(false);
      setFile(null);
      setSkippedRecords([]);
      dispatch(getAllPackagingOptionsThunk());
    } catch (error: any) {
      toast.error(error?.message || "Bulk upload failed");
      setSkippedRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      "party,ply,length,width,height,deckal,paper1GSM,paper2GSM,paper3GSM\n" +
      `${qpParties[0]?._id || "68cbd2df0973310763a2c45b"},5,22,22,27,46,150,120,150\n`;
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
    setSkippedRecords([]);
    setBulkDialogOpen(true);
  };

  const closeBulkDialog = () => {
    setFile(null);
    setSkippedRecords([]);
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
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.party?.partyName || ""}</TableCell>
            <TableCell>{row.ply || ""}</TableCell>
            <TableCell>{row.length || ""}</TableCell>
            <TableCell>{row.width || ""}</TableCell>
            <TableCell>{row.height || ""}</TableCell>
            <TableCell>{row.deckal || ""}</TableCell>
            <TableCell>{row.paper1GSM || ""}</TableCell>
            <TableCell>{row.paper2GSM || ""}</TableCell>
            <TableCell>{row.paper3GSM || ""}</TableCell>
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
        title={editId ? "Edit Cartoon" : "New Cartoon"}
        maxWidth="sm"
        fullWidth
      >
        <Box display="flex" flexDirection="column" gap={2}>
          {/* Row for Party + Ply */}
          <Box display="flex" gap={2}>
            <FormControl fullWidth required>
              <InputLabel>PARTY</InputLabel>
              <Select
                name="party"
                value={form.party}
                onChange={handleFormChange}
                label="PARTY"
              >
                {qpParties.map((party) => (
                  <MenuItem key={party._id} value={party._id}>
                    {party.partyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <Input
              label="DECKAL"
              name="deckal"
              value={form.deckal}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Box>

          {/* Row for Paper GSM */}
          <Box display="flex" gap={2}>
            <Input
              label="PAPER 1 GSM"
              name="paper1GSM"
              value={form.paper1GSM}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <Input
              label="PAPER 2 GSM"
              name="paper2GSM"
              value={form.paper2GSM}
              onChange={handleFormChange}
              fullWidth
              required
            />
            <Input
              label="PAPER 3 GSM"
              name="paper3GSM"
              value={form.paper3GSM}
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
              ...(file && {
                borderColor: "#4caf50",
                backgroundColor: "#f1f8e9",
              }),
            }}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <Typography variant="body1" color="textSecondary">
              {file ? (
                <>
                  <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                    ✅ File Selected
                  </Typography>
                  <Typography variant="body2" color="textPrimary" fontWeight={500}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                    Size: {(file.size / 1024).toFixed(2)} KB
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                    📁 Choose File to Upload
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Drag & Drop CSV file here or click to select
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                    Supported formats: .csv
                  </Typography>
                </>
              )}
            </Typography>
            <input
              type="file"
              id="fileInput"
              style={{ display: "none" }}
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Box>

          {skippedRecords.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                pt: 2,
                textAlign: "center",
              }}
            >
              <Typography color="error" mb={1}>
                Note: Some records were not uploaded. Click the button below to download skipped records.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  downloadSkippedRecordsAsCSV(skippedRecords);
                  setSkippedRecords([]);
                  closeBulkDialog();
                }}
              >
                Download Skipped Records
              </Button>
            </Box>
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
            disabled={!file || isLoading}
            sx={{ background: "primary", "&:hover": { background: "primary" } }}
          >
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
          {file && (
            <Button
              variant="outlined"
              onClick={() => {
                setFile(null);
                const input = document.getElementById("fileInput") as HTMLInputElement;
                if (input) input.value = "";
              }}
            >
              Clear File
            </Button>
          )}
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default PackagingOptionsPage;
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  Chip,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
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
  getAllPackagingOptionsThunk,
  getPackagingFiltersThunk,
  createPackagingOptionThunk,
  updatePackagingOptionThunk,
  deletePackagingOptionThunk,
  bulkCreatePackagingOptionThunk,
  setPackagingFilters,
} from "@/store/slices/packagingOptionSlice";
import { getQualityPackingPartiesThunk } from "@/store/slices/partySlice";
import { downloadSkippedRecordsAsCSV } from "@/utills/utills";
import moment from "moment";
import { getAllKantansThunk } from "@/store/slices/kantanSlice";

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
  { id: "noOfPieces", label: "No of Pieces" },
  { id: "ratePerPiece", label: "Rate Per Piece" },
  { id: "isKantan", label: "Include Kantan" },
  { id: "kantan", label: "Kantan" },
  { id: "date", label: "Date" },
  { id: "actions", label: "Actions" },
];

const PackagingOptionsPage = () => {
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth)
  const { kantans } = useSelector((state: RootState) => state.kantans);

  const {
    packagingOptions = [],
    loading,
    operationLoading,
    pagination,
    filters,
    availableFilters = {
      parties: [],
      plys: [],
      lengths: [],
      widths: [],
      heights: [],
      deckals: [],
      paper1GSMs: [],
      paper2GSMs: [],
      paper3GSMs: [],
      noOfPiecesOptions: [],
      ratePerPieceOptions: [],
      dates: [],
    },
  } = useSelector((state: RootState) => state.packagingOptions);
  console.log("🚀 ~ PackagingOptionsPage ~ availableFilters:", availableFilters)

  const companyId = user?.company?._id;
  const { qpParties = [] } = useSelector((state: RootState) => state.party);

  useEffect(() => {
    if (companyId) dispatch(getQualityPackingPartiesThunk(companyId));
    if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk());
    if (!kantans.length) dispatch(getAllKantansThunk());
    dispatch(getPackagingFiltersThunk());
  }, [dispatch, companyId]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [skippedRecords, setSkippedRecords] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});
  console.log("🚀 ~ PackagingOptionsPage ~ activeFilters:", activeFilters)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const handleSearchDebounced = useCallback(
    (search: string) => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        dispatch(setPackagingFilters({ search: search.trim(), page: 1 }));
      }, 600);
    },
    [dispatch]
  );

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    const apiFilters: any = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      search: filters.search || "",
    };
    console.log("🚀 ~ PackagingOptionsPage ~ apiFilters:", apiFilters)

    if (activeFilters["Party"]?.length) apiFilters.parties = activeFilters["Party"];
    if (activeFilters["Ply"]?.length) apiFilters.plys = activeFilters["Ply"];
    if (activeFilters["Length"]?.length) apiFilters.lengths = activeFilters["Length"];
    if (activeFilters["Width"]?.length) apiFilters.widths = activeFilters["Width"];
    if (activeFilters["Height"]?.length) apiFilters.heights = activeFilters["Height"];
    if (activeFilters["Deckal"]?.length) apiFilters.deckals = activeFilters["Deckal"];
    if (activeFilters["Paper 1 GSM"]?.length) apiFilters.paper1GSMs = activeFilters["Paper 1 GSM"];
    if (activeFilters["Paper 2 GSM"]?.length) apiFilters.paper2GSMs = activeFilters["Paper 2 GSM"];
    if (activeFilters["Paper 3 GSM"]?.length) apiFilters.paper3GSMs = activeFilters["Paper 3 GSM"];
    if (activeFilters["No of Pieces"]?.length) apiFilters.noOfPieces = activeFilters["No of Pieces"];
    if (activeFilters["Rate Per Piece"]?.length) apiFilters.ratePerPiece = activeFilters["Rate Per Piece"];
// NEW - Perfect & Clean
if (activeFilters["Date"]?.length > 0) {
  apiFilters.dates = activeFilters["Date"]; // Send exactly as "06/12/2025"
}
   console.log("Final API Payload →", apiFilters);
    dispatch(getAllPackagingOptionsThunk(apiFilters));
  }, [filters.page, filters.search, activeFilters, dispatch]);

  // Form state
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
    noOfPieces: "",
    ratePerPiece: "",
    isKantan: false,
    kantan: "",
  });


  // const handleSave = () => {
  //   const required = ["party", "ply", "length", "width", "height", "deckal", "paper1GSM", "paper2GSM", "paper3GSM"];
  //   if (required.some((key) => !form[key as keyof typeof form]?.toString().trim())) {
  //     toast.error("All required fields are mandatory");
  //     return;
  //   }

  //   const payload = { ...form };
  //   if (editId) {
  //     dispatch(updatePackagingOptionThunk({ id: editId, updateData: payload }));
  //   } else {
  //     dispatch(createPackagingOptionThunk(payload));
  //   }
  //   setDialogOpen(false);
  // };

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
        noOfPieces: option.noOfPieces || "",
        ratePerPiece: option.ratePerPiece || "",
        isKantan: option.isKantan || false, // नया
        kantan: option.kantan?._id || option.kantan || "", // नया
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
        noOfPieces: "",
        ratePerPiece: "",
        isKantan: false, // डिफ़ॉल्ट false
        kantan: "", // डिफ़ॉल्ट खाली
      });
    }
    setDialogOpen(true);
  };

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      toast.error("All required fields are required");
      return;
    }

    // अगर isKantan true है और kantan empty है, तो error दें
    if (form.isKantan && !form.kantan.trim()) {
      toast.error("Please select Kantan when Include Kantan is checked");
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return moment(date).format('DD/MM/YY')
    } catch {
      return dateString
    }
  }

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

  const handleBulkUpload = async () => {
    if (!file) return toast.error("Please select a file");

    const fd = new FormData();
    fd.append("file", file);
    setIsUploading(true);

    try {
      const res: any = await dispatch(bulkCreatePackagingOptionThunk(fd)).unwrap();

      if (res.skippedCount > 0) {
        setSkippedRecords(res.skippedRecords || []);
        toast.warn(`${res.skippedCount} records were skipped`);
      } else {
        toast.success("Bulk upload successful!");
        setBulkDialogOpen(false);
      }
    } catch (err: any) {
      toast.error(err || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const { kantans } = useSelector((state: RootState) => state.kantans);

    // Get kantans if not already loaded
    useEffect(() => {
      if (kantans.length === 0) {
        dispatch(getAllKantansThunk());
      }
    }, [dispatch, kantans.length]);

    // Wait for kantans to load or use default
    const firstKantanName = kantans.length > 0 ? kantans[0].kantanName : "KANTAN_NAME_HERE";
    const firstPartyName = qpParties.length > 0 ? qpParties[0].partyName : "PARTY_NAME_HERE";

    const csvContent = [
      "party,ply,length,width,height,deckal,paper1GSM,paper2GSM,paper3GSM,noOfPieces,ratePerPiece,isKantan,kantan",
      `${firstPartyName},5,22,22,27,46,150,120,150,1000,25,false,`,
      `${firstPartyName},3,20,20,25,40,120,100,120,500,30,true,${firstKantanName}`,
      `${firstPartyName},7,24,24,30,50,180,150,180,2000,35,false,`,
      `${firstPartyName},5,18,18,22,38,130,110,130,800,22,true,${firstKantanName}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_packaging_options.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFilterCount = Object.values(activeFilters).flat().length;
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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Cartoon (Packaging)</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={handleDownloadSample}>
            Download Sample CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setBulkDialogOpen(true)}
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

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <Box mb={2} display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <Typography variant="body2" color="textSecondary">Active filters:</Typography>
          {Object.entries(activeFilters).map(([key, values]) =>
            values.map((val) => (
              <Chip
                key={`${key}-${val}`}
               label={key === "Date" ? `Date: ${val}` : `${key}: ${val}`}
                onDelete={() => {
                  setActiveFilters((prev) => ({
                    ...prev,
                    [key]: prev[key].filter((v) => v !== val),
                  }));
                  dispatch(setPackagingFilters({ page: 1 }));
                }}
                size="small"
                color="primary"
              />
            ))
          )}
          <Button
            size="small"
            onClick={() => {
              setActiveFilters({});
              dispatch(setPackagingFilters({ page: 1, search: "" }));
            }}
          >
            Clear all
          </Button>
        </Box>
      )}

      {/* Server-Side Table */}
      <BasicTable
        serverSide={true}
        tableHeader={columns}
        rowData={packagingOptions}
        loading={loading}
        totalCount={pagination?.totalItems || 0}
        pagination={pagination}
        onPageChange={(page) => dispatch(setPackagingFilters({ page }))}
        onSearchChange={handleSearchDebounced}
        onFilterChange={(newFilters) => {
          setActiveFilters(newFilters);
          dispatch(setPackagingFilters({ page: 1 }));
        }}
        availableFilters={{
          Party: availableFilters.parties || [],
          Ply: availableFilters.plys || [],
          Length: availableFilters.lengths || [],
          Width: availableFilters.widths || [],
          Height: availableFilters.heights || [],
          Deckal: availableFilters.deckals || [],
          "Paper 1 GSM": availableFilters.paper1GSMs || [],
          "Paper 2 GSM": availableFilters.paper2GSMs || [],
          "Paper 3 GSM": availableFilters.paper3GSMs || [],
          "No of Pieces": availableFilters.noOfPiecesOptions || [],
          "Rate Per Piece": availableFilters.ratePerPieceOptions || [],
          Date: availableFilters.dates || [],
        }}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{(filters.page - 1) * filters.limit + idx + 1}</TableCell>
            <TableCell>{row.party?.partyName || "-"}</TableCell>
            <TableCell>{row.ply}</TableCell>
            <TableCell>{row.length}</TableCell>
            <TableCell>{row.width}</TableCell>
            <TableCell>{row.height}</TableCell>
            <TableCell>{row.deckal}</TableCell>
            <TableCell>{row.paper1GSM}</TableCell>
            <TableCell>{row.paper2GSM}</TableCell>
            <TableCell>{row.paper3GSM}</TableCell>
            <TableCell>{row.noOfPieces || "-"}</TableCell>
            <TableCell>{row.ratePerPiece || "-"}</TableCell>
            <TableCell>{row.isKantan ? "Yes" : "No"}</TableCell> {/* नया */}
            <TableCell>
              {row.kantan?.kantanName}
            </TableCell>
            <TableCell>{moment(row.updatedAt).format("DD/MM/YY")}</TableCell>
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
        maxWidth="md"
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
          <Box display="flex" gap={2}>
            <Input
              label="NO OF PIECES"
              name="noOfPieces"
              value={form.noOfPieces}
              onChange={handleFormChange}
              fullWidth
              type="number"
            />
            <Input
              label="RATE PER PIECE"
              name="ratePerPiece"
              value={form.ratePerPiece}
              onChange={handleFormChange}
              fullWidth
              type="number"
            />
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <FormControlLabel
              control={
                <Checkbox
                  name="isKantan"
                  checked={form.isKantan}
                  onChange={(e) =>
                    setForm(prev => ({ ...prev, isKantan: e.target.checked }))
                  }
                  color="primary"
                />
              }
              label="Include Kantan"
            />

            {form.isKantan && (
              <FormControl fullWidth>
                <InputLabel>KANTAN</InputLabel>
                <Select
                  name="kantan"
                  value={form.kantan}
                  onChange={handleFormChange}
                  label="KANTAN"
                >
                  {kantans.map((kantan) => (
                    <MenuItem key={kantan._id} value={kantan._id}>
                      {kantan.kantanName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>

        {/* Footer Buttons */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={operationLoading}>
            {operationLoading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </CustomDialog>

      {/* Bulk Upload Dialog */}
      <CustomDialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} title="Bulk Upload Cartoon" maxWidth="sm" fullWidth>
        <Box display="flex" flexDirection="column" alignItems="center" gap={3} p={3}>
          <Box
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
            }}
            sx={{
              border: "2px dashed #7f56d9",
              borderRadius: 3,
              p: 6,
              width: "100%",
              textAlign: "center",
              background: "#f8f5ff",
              cursor: "pointer",
              "&:hover": { background: "#f3e8ff" },
            }}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <Typography>
              {file ? `Selected: ${file.name}` : "Drop CSV file here or click to browse"}
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
                  setBulkDialogOpen(false);
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

        <Box display="flex" justifyContent="flex-end" gap={2} p={2}>
          <Button variant="outlined" onClick={() => setBulkDialogOpen(false)}>
            Close
          </Button>
          <Button variant="contained" onClick={handleBulkUpload} disabled={!file || isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default PackagingOptionsPage;
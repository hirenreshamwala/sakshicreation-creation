import {
  Box,
  MenuItem,
  Typography,
  Card,
  CardContent,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useState, useEffect } from "react";
import { Delete, CloudUpload, Visibility, Close } from "@mui/icons-material";
import { useAppDispatch } from "@/store";
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice";
import { fileUploadService } from "@/services/fileUpload.service";
import DesignerFilesDialog from "./DesignerFilesDialog";

function PaperSelection({
  isCompleted,
  printers,
  binders,
  designers,
  staffLoading,
  formData,
  handleFormChange,
  setFormData,
  data,
  onUpdateOrder,
}: any) {
  const dispatch = useAppDispatch()
  const [isPrinterAdded, setIsPrinterAdded] = useState(false);
  const [isLaminationAdded, setIsLaminationAdded] = useState(false);
  const [isDesignerAdded, setIsDesignerAdded] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reworkFiles, setReworkFiles] = useState<File[]>([]);
  const [viewFilesDialogOpen, setViewFilesDialogOpen] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState<string>("");
  const [approveDesignDialogOpen, setApproveDesignDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const printTypes = [
    { value: "offset", label: "Offset" },
    { value: "sterio", label: "Sterio" },
    { value: "screen_printing", label: "Screen Printing" }
  ];

  useEffect(() => {
    if (approveDesignDialogOpen) {
      // Get all available files
      const allFiles = getAllAvailableFiles();

      if (allFiles.length > 0) {
        let defaultFileUrl = '';

        // Check if reworkDesignFiles exist
        if (data?.reworkDesignFiles?.length > 0) {
          // Get the last file from reworkDesignFiles
          defaultFileUrl = data.reworkDesignFiles[data.reworkDesignFiles.length - 1];
        }
        // If no reworkDesignFiles, check for designerFiles
        else if (data?.designerFiles?.length > 0) {
          // Get the last file from designerFiles
          defaultFileUrl = data.designerFiles[data.designerFiles.length - 1];
        }

        // Set the selected files to include only the default file
        if (defaultFileUrl) {
          setSelectedFiles([defaultFileUrl]);
        }
      }
    }
  }, [approveDesignDialogOpen, data?.reworkDesignFiles, data?.designerFiles]);

  useEffect(() => {
    if (data?.printer) {
      setIsPrinterAdded(true);
      handleFormChange("printer", data.printer._id);
    }
    if (data?.binder) {
      setIsLaminationAdded(true);
      handleFormChange("binder", data.binder._id);
    }
    if (data?.designer) {
      setIsDesignerAdded(true);
      handleFormChange("designer", data.designer._id);
    }
    if (data?.printType) {
      handleFormChange("printType", data.printType);
    }
    // Initialize printer details if they exist
    if (data?.printerPaperSize) {
      handleFormChange("printerPaperSize", data.printerPaperSize);
    }
    if (data?.paperQuality) {
      handleFormChange("paperQuality", data.paperQuality);
    }
    if (data?.paperGsm) {
      handleFormChange("paperGsm", data.paperGsm);
    }
    if (data?.printerPaperQty) {
      handleFormChange("printerPaperQty", data.printerPaperQty);
    }
  }, [data]);

  // Handle printer change
  const handlePrinterChange = (value: string) => {
    handleFormChange("printer", value);
    // Reset print type and printer details when printer changes
    if (!value) {
      handleFormChange("printType", "");
      handleFormChange("printerPaperSize", "");
      handleFormChange("paperQuality", "");
      handleFormChange("paperGsm", "");
      handleFormChange("printerPaperQty", "");
    }
  };

  // Handle printer details change
  const handlePrinterDetailChange = (field: string, value: string) => {
    handleFormChange(field, value);
  };

  // File upload handlers
  const handleDesignerFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setFormData((prev: any) => ({
        ...prev,
        designFiles: [...(prev.designFiles || []), ...Array.from(files)],
      }));
    }
  };

  // File delete handlers
  const handleDeleteDesignerFile = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      designFiles: prev.designFiles.filter((_, i) => i !== index),
    }));
  };

  // Rework file upload handlers
  const handleReworkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setReworkFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  // Rework file delete handlers
  const handleDeleteReworkFile = (index: number) => {
    setReworkFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle approve design button click
  const handleApproveDesignClick = () => {
    setApproveDesignDialogOpen(true);
    setSelectedFiles([]);
  };

  // Handle final design approval with file selection
  const handleFinalApproveDesign = async () => {
    try {
      const updateData = {
        _id: data._id,
        approveDesign: true,
        printerFiles: selectedFiles,
      };

      await dispatch(updateQPOrderThunk({
        id: data._id,
        data: updateData
      })).unwrap();

      setApproveDesignDialogOpen(false);
      console.log("Design approved successfully with printer files");
    } catch (error) {
      console.error("Failed to approve design:", error);
    }
  };

  // Handle reject design
  const handleRejectDesign = () => setRejectDialogOpen(true);

  // Handle submit rework files
  const handleSubmitRework = async () => {
    try {
      let reworkFileUrls: string[] = [];

      if (reworkFiles.length > 0) {
        const uploadRes = await fileUploadService.uploadMultipleFiles(reworkFiles);
        reworkFileUrls = uploadRes.data.map((file: any) => file.path);
      }

      const updateData = {
        _id: data._id,
        approveDesign: false,
        reworkDesignFiles: reworkFileUrls,
      };

      await dispatch(updateQPOrderThunk({
        id: data._id,
        data: updateData
      })).unwrap();

      setReworkFiles([]);
      setRejectDialogOpen(false);
      console.log("Design rejected with rework files");
    } catch (error) {
      console.error("Failed to reject design:", error);
    }
  };

  // File view and download handlers
  const handleViewFile = (fileUrl: string) => {
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${process.env.NEXT_PUBLIC_API_URL}${fileUrl}`;
    setCurrentFileUrl(fullUrl);
    setViewFilesDialogOpen(true);
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${process.env.NEXT_PUBLIC_API_URL}${fileUrl}`;
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Handle file selection for printer files
  const handleFileSelect = (fileUrl: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileUrl)
        ? prev.filter(url => url !== fileUrl)
        : [...prev, fileUrl]
    );
  };

  // Select all files
  const handleSelectAll = () => {
    const allFiles = [
      ...(data?.designerFiles || []),
      ...(data?.reworkDesignFiles || [])
    ];

    if (selectedFiles.length === allFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(allFiles);
    }
  };

  // Check if designer files exist and approveDesign is not set
  const showApproveRejectButtons = formData.designerFiles?.length > 0 && !data?.approveDesign;

  // Get file name from URL or File object
  const getFileName = (file: any) => {
    if (typeof file === 'string') {
      return file.split('/').pop() || 'file';
    }
    return file.name;
  };

  // Get all available files for selection
  const getAllAvailableFiles = () => {
    return [
      ...(data?.designFiles || []),  // ✅ designFiles
      ...(data?.reworkDesignFiles || [])  // ✅ reworkDesignFiles
    ];
  };

  return (
    <>
      <Card sx={{ mt: 2, border: "1px solid #e0e0e0" }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2" }}>
            🧾 Designing, Printing & Lamination
          </Typography>

          {/* Step 1: Designer Selection */}
          <Box sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isDesignerAdded}
                  onChange={(e) => {
                    const value = e.target.checked;
                    setIsDesignerAdded(value);
                    if (!value) {
                      handleFormChange("designer", null);
                      setIsPrinterAdded(false);
                      setIsLaminationAdded(false);
                      handleFormChange("printer", null);
                      handleFormChange("binder", null);
                      handleFormChange("printType", "");
                      handleFormChange("designFiles", []);
                      handleFormChange("designerRemark", "");
                      // Reset printer details
                      handleFormChange("printerPaperSize", "");
                      handleFormChange("paperQuality", "");
                      handleFormChange("paperGsm", "");
                      handleFormChange("printerPaperQty", "");
                    }
                  }}
                  disabled={isCompleted}
                />
              }
              label="Add Designer"
            />
          </Box>

          {isDesignerAdded && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <TextField
                  select
                  label="Select Designer"
                  value={formData.designer}
                  onChange={(e) => handleFormChange("designer", e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 200 }}
                  disabled={isCompleted || staffLoading}
                >
                  {staffLoading ? (
                    <MenuItem value="" disabled>
                      Loading designers...
                    </MenuItem>
                  ) : designers?.length === 0 ? (
                    <MenuItem value="" disabled>
                      No designers available
                    </MenuItem>
                  ) : (
                    designers?.map((designer: any) => (
                      <MenuItem key={designer.id} value={designer.id}>
                        {designer.name}
                      </MenuItem>
                    ))
                  )}
                </TextField>

              </Box>

              {/* Designer File Upload */}
              <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
                {/* Upload Button */}
                <div>
                  <input
                    type="file"
                    multiple
                    onChange={handleDesignerFileUpload}
                    style={{ display: "none" }}
                    id="designer-file-upload"
                    disabled={isCompleted}
                  />
                  <label htmlFor="designer-file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      disabled={isCompleted}
                    >
                      Upload Design Files
                    </Button>
                  </label>
                </div>

                {/* View All Button */}
                {(data?.designFiles?.length > 0 || data?.reworkDesignFiles?.length > 0) && (
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => setViewFilesDialogOpen(true)}
                    disabled={isCompleted}
                  >
                    View All Files
                  </Button>
                )}
              </Box>

              {/* Error message if no files */}
              {formData.designFiles?.length === 0 && (
                <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                  At least 1 file is required
                </Typography>
              )}

              {showApproveRejectButtons && (
                <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleApproveDesignClick}
                    disabled={isCompleted}
                  >
                    Approve Design
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleRejectDesign}
                    disabled={isCompleted}
                  >
                    Rework design
                  </Button>
                </Box>
              )}

              <TextField
                label="Designer Remark"
                value={formData.designerRemark || ""}
                onChange={(e) => handleFormChange("designerRemark", e.target.value)}
                variant="outlined"
                size="small"
                multiline
                rows={2}
                fullWidth
                disabled={isCompleted}
              />
            </Box>
          )}

          {isDesignerAdded && (
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPrinterAdded}
                    onChange={(e) => {
                      const value = e.target.checked;
                      setIsPrinterAdded(value);

                      if (!value) {
                        setIsLaminationAdded(false);
                        handleFormChange("printer", null);
                        handleFormChange("binder", null);
                        handleFormChange("printType", "");
                        handleFormChange("printerRemark", "");
                        // Reset printer details
                        handleFormChange("printerPaperSize", "");
                        handleFormChange("paperQuality", "");
                        handleFormChange("paperGsm", "");
                        handleFormChange("printerPaperQty", "");
                      }
                    }}
                    disabled={isCompleted}
                  />
                }
                label="Add Printer"
              />
            </Box>
          )}

          {isDesignerAdded && isPrinterAdded && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <TextField
                  select
                  label="Select Printer"
                  value={formData.printer}
                  onChange={(e) => handlePrinterChange(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 200 }}
                  disabled={isCompleted || staffLoading}
                >
                  {staffLoading ? (
                    <MenuItem value="" disabled>
                      Loading printers...
                    </MenuItem>
                  ) : printers?.length === 0 ? (
                    <MenuItem value="" disabled>
                      No printers available
                    </MenuItem>
                  ) : (
                    printers?.map((printer: any) => (
                      <MenuItem key={printer.id} value={printer.id}>
                        {printer.name}
                      </MenuItem>
                    ))
                  )}
                </TextField>

                {formData.printer && (
                  <FormControl sx={{ minWidth: 150 }} size="small">
                    <InputLabel>Print Type</InputLabel>
                    <Select
                      value={formData.printType}
                      label="Print Type"
                      onChange={(e) => handleFormChange("printType", e.target.value)}
                      disabled={isCompleted}
                    >
                      {printTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>

              {/* Printer Details - Show only when printer is selected */}
              {formData.printer && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
                    Printer Details
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                    <TextField
                      label="Paper Size"
                      value={formData.printerPaperSize || ""}
                      onChange={(e) => handlePrinterDetailChange("printerPaperSize", e.target.value)}
                      variant="outlined"
                      size="small"
                      fullWidth
                      placeholder="e.g., A4, A3, Custom Size"
                      disabled={isCompleted}
                    />
                    <TextField
                      label="Paper Quality"
                      value={formData.paperQuality || ""}
                      onChange={(e) => handlePrinterDetailChange("paperQuality", e.target.value)}
                      variant="outlined"
                      size="small"
                      fullWidth
                      placeholder="e.g., Art Paper, Glossy, Matte"
                      disabled={isCompleted}
                    />
                    <TextField
                      label="Paper GSM"
                      type="number"
                      value={formData.paperGsm || ""}
                      onChange={(e) => handlePrinterDetailChange("paperGsm", e.target.value)}
                      variant="outlined"
                      size="small"
                      fullWidth
                      placeholder="e.g., 100, 120, 150"
                      InputProps={{ inputProps: { min: 0 } }}
                      disabled={isCompleted}
                    />
                    <TextField
                      label="Paper Quantity"
                      type="number"
                      value={formData.printerPaperQty || ""}
                      onChange={(e) => handlePrinterDetailChange("printerPaperQty", e.target.value)}
                      variant="outlined"
                      size="small"
                      fullWidth
                      placeholder="e.g., 1000 sheets"
                      InputProps={{ inputProps: { min: 0 } }}
                      disabled={isCompleted}
                    />
                  </Stack>
                </Box>
              )}

              <TextField
                label="Printer Remark"
                value={formData.printerRemark || ""}
                onChange={(e) => handleFormChange("printerRemark", e.target.value)}
                variant="outlined"
                size="small"
                multiline
                rows={2}
                fullWidth
                disabled={isCompleted}
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {isDesignerAdded && isPrinterAdded && (
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isLaminationAdded}
                    onChange={(e) => {
                      const value = e.target.checked;
                      setIsLaminationAdded(value);
                      if (!value) {
                        handleFormChange("binder", null);
                        handleFormChange("laminationRemark", "");
                      }
                    }}
                    disabled={isCompleted}
                  />
                }
                label="Add Lamination"
              />
            </Box>
          )}

          {isDesignerAdded && isPrinterAdded && isLaminationAdded && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <TextField
                  select
                  label="Select Binder"
                  value={formData.binder}
                  onChange={(e) => handleFormChange("binder", e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 200 }}
                  disabled={isCompleted || staffLoading}
                >
                  {staffLoading ? (
                    <MenuItem value="" disabled>
                      Loading binders...
                    </MenuItem>
                  ) : binders?.length === 0 ? (
                    <MenuItem value="" disabled>
                      No binders available
                    </MenuItem>
                  ) : (
                    binders.map((binder: any) => (
                      <MenuItem key={binder.id} value={binder.id}>
                        {binder.name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
                <TextField
                  label="Lamination Remark"
                  value={formData.laminationRemark || ""}
                  onChange={(e) => handleFormChange("laminationRemark", e.target.value)}
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                  fullWidth
                  disabled={isCompleted}
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Rest of the dialogs remain same */}
      <Dialog open={approveDesignDialogOpen} onClose={() => setApproveDesignDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Select Files for Printer
          <IconButton
            aria-label="close"
            onClick={() => setApproveDesignDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select the files you want to send to the printer. These files will be added to the printerFiles array.
          </Typography>

          {/* Select All Checkbox */}
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={getAllAvailableFiles().length > 0 && selectedFiles.length === getAllAvailableFiles().length}
                  indeterminate={selectedFiles.length > 0 && selectedFiles.length < getAllAvailableFiles().length}
                  onChange={handleSelectAll}
                />
              }
              label={`Select All (${selectedFiles.length}/${getAllAvailableFiles().length} selected)`}
            />
          </Box>

          {/* Designer Files Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
              Designer Files
            </Typography>
            {data?.designerFiles?.length > 0 ? (
              <List dense>
                {data.designerFiles.map((fileUrl: string, index: number) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon>
                      <Checkbox
                        checked={selectedFiles.includes(fileUrl)}
                        onChange={() => handleFileSelect(fileUrl)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={getFileName(fileUrl)}
                      secondary="Designer File"
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewFile(fileUrl)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No designer files available
              </Typography>
            )}
          </Box>

          {/* Rework Designer Files Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
              Rework Designer Files
            </Typography>
            {data?.reworkDesignFiles?.length > 0 ? (
              <List dense>
                {data.reworkDesignFiles.map((fileUrl: string, index: number) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon>
                      <Checkbox
                        checked={selectedFiles.includes(fileUrl)}
                        onChange={() => handleFileSelect(fileUrl)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={getFileName(fileUrl)}
                      secondary="Rework Designer File"
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewFile(fileUrl)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No rework designer files available
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDesignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleFinalApproveDesign}
            variant="contained"
            color="success"
            disabled={selectedFiles.length === 0}
          >
            Approve Design & Send to Printer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Existing Reject Design Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Reject Design & Upload Rework Files</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please upload files that show what needs to be reworked in the design.
          </Typography>

          {/* Rework File Upload */}
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              multiple
              onChange={handleReworkFileUpload}
              style={{ display: "none" }}
              id="rework-file-upload"
            />
            <label htmlFor="rework-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
              >
                Upload Rework Files
              </Button>
            </label>

            {/* Display rework files */}
            <Box sx={{ mt: 1 }}>
              {reworkFiles.length > 0 && (
                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    maxHeight: 100,
                    overflowY: "auto",
                    borderRadius: 1,
                    p: 1,
                  }}
                >
                  {reworkFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => handleDeleteReworkFile(index)}
                      deleteIcon={<Delete />}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitRework}
            variant="contained"
            color="error"
            disabled={reworkFiles.length === 0}
          >
            Submit Rejection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rest of the dialogs remain same */}
      <DesignerFilesDialog
        viewFilesDialogOpen={viewFilesDialogOpen}
        setViewFilesDialogOpen={setViewFilesDialogOpen}
        data={data}
        getFileName={getFileName}
        handleDownloadFile={handleDownloadFile}
        handleViewFile={handleViewFile}
      />

      <Dialog
        open={!!currentFileUrl}
        onClose={() => setCurrentFileUrl("")}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh'
          }
        }}
      >
        <DialogTitle>
          File Preview
          <IconButton
            aria-label="close"
            onClick={() => setCurrentFileUrl("")}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <iframe
              src={currentFileUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px'
              }}
              title="File Preview"
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", mt: 2 }}>
        <TextField
          label="Dye Remark"
          value={formData.dyeRemark}
          onChange={(e) => handleFormChange("dyeRemark", e.target.value)}
          variant="outlined"
          size="small"
          multiline
          rows={2}
          sx={{ flex: 1, minWidth: 150, maxWidth: 350 }}
          disabled={isCompleted}
        />
        <TextField
          label="Godown Remark"
          value={formData.godownRemark}
          onChange={(e) => handleFormChange("godownRemark", e.target.value)}
          variant="outlined"
          size="small"
          multiline
          rows={2}
          sx={{ flex: 1, minWidth: 150, maxWidth: 350 }}
          disabled={isCompleted}
        />
        <TextField
          label="Factory Remark"
          value={formData.factoryRemark}
          onChange={(e) => handleFormChange("factoryRemark", e.target.value)}
          variant="outlined"
          size="small"
          multiline
          rows={2}
          sx={{ flex: 1, minWidth: 150, maxWidth: 350 }}
          disabled={isCompleted}
        />
      </Stack>
    </>
  );
}

export default PaperSelection;
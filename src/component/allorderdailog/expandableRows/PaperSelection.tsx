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
} from "@mui/material";
import { useState, useEffect } from "react";
import { Delete, CloudUpload } from "@mui/icons-material";

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
}: any) {
  const [isPrinterAdded, setIsPrinterAdded] = useState(false);
  const [isLaminationAdded, setIsLaminationAdded] = useState(false);
  const [isDesignerAdded, setIsDesignerAdded] = useState(false);

  // Print type options
  const printTypes = [
    { value: "offset", label: "Offset" },
    { value: "sterio", label: "Sterio" },
    { value: "screen_printing", label: "Screen Printing" }
  ];

  // 🟢 Auto set states if printer/binder already assigned
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
  }, [data]);

  // Handle print type change
  const handlePrintTypeChange = (value: string) => {
    handleFormChange("printType", value);
  };

  // Handle printer change
  const handlePrinterChange = (value: string) => {
    handleFormChange("printer", value);
    // Reset print type when printer changes
    if (!value) {
      handleFormChange("printType", "");
    }
  };

  // File upload handlers
  const handleDesignerFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setFormData((prev: any) => ({
        ...prev,
        designerFiles: [...(prev.designerFiles || []), ...Array.from(files)],
      }));
    }
  };

  // File delete handlers
  const handleDeleteDesignerFile = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      designerFiles: prev.designerFiles.filter((_, i) => i !== index),
    }));
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
                      handleFormChange("printType", "");
                      handleFormChange("designerFiles", []);
                      handleFormChange("designerRemark", "");
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
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                  Design Files {formData.designerFiles?.length === 0 && "*"}
                </Typography>

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

                {formData.designerFiles?.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                    At least 1 file is required
                  </Typography>
                )}

                {/* Display uploaded files */}
                <Box sx={{ mt: 1 }}>
                  {formData.designerFiles?.length > 0 && (
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
                      {formData.designerFiles.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          onDelete={() => handleDeleteDesignerFile(index)}
                          deleteIcon={<Delete />}
                          variant="outlined"
                          size="small"
                          disabled={isCompleted}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Designer Remark */}
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

          {/* Step 2: Printer Selection (only if designer is selected) */}
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
                        handleFormChange("printType", "");
                        handleFormChange("printerRemark", "");
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

                {/* Print Type Dropdown - Only show when printer is selected */}
                {formData.printer && (
                  <FormControl sx={{ minWidth: 150 }} size="small">
                    <InputLabel>Print Type</InputLabel>
                    <Select
                      value={formData.printType}
                      label="Print Type"
                      onChange={(e) => handlePrintTypeChange(e.target.value)}
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
                />
              </Box>
            </Box>
          )}

          {/* Step 3: Lamination Selection (only if printer is selected) */}
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
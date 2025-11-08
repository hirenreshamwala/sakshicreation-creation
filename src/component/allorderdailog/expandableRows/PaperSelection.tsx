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
} from "@mui/material";
import { useState, useEffect } from "react";

function PaperSelection({
  isCompleted,
  printers,
  binders,
  designers,
  staffLoading,
  selectedPrinter,
  selectedBinder,
  selectedDesigner,
  setSelectedPrinter,
  setSelectedBinder,
  setSelectedDesigner,
  formData,
  handleFormChange,
  data,
}: any) {
  const [isPrinterAdded, setIsPrinterAdded] = useState(false);
  const [isLaminationAdded, setIsLaminationAdded] = useState(false);
  const [isDesignerAdded, setIsDesignerAdded] = useState(false);
  const [printType, setPrintType] = useState(formData.printType || "");

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
      setSelectedPrinter(data.printer._id);
    }
    if (data?.binder) {
      setIsLaminationAdded(true);
      setSelectedBinder(data.binder._id);
    }
    if (data?.designer) {
      setIsDesignerAdded(true);
      setSelectedDesigner(data.designer._id);
    }
    if (data?.printType) {
      setPrintType(data.printType);
    }
  }, [data]);

  // Handle print type change
  const handlePrintTypeChange = (value: string) => {
    setPrintType(value);
    handleFormChange("printType", value);
  };

  // Handle printer change
  const handlePrinterChange = (value: string) => {
    setSelectedPrinter(value);
    // Reset print type when printer changes
    if (!value) {
      setPrintType("");
      handleFormChange("printType", "");
    }
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
                      setSelectedDesigner(null);
                      // Reset printer and binder if designer is removed
                      setIsPrinterAdded(false);
                      setIsLaminationAdded(false);
                      setSelectedPrinter(null);
                      setSelectedBinder(null);
                      // Reset print type
                      setPrintType("");
                      handleFormChange("printType", "");
                    }
                  }}
                  disabled={isCompleted}
                />
              }
              label="Add Designer"
            />
          </Box>

        {isDesignerAdded && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
              <TextField
                select
                label="Select Designer"
                value={selectedDesigner}
                onChange={(e) => setSelectedDesigner(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ minWidth: 200 }}
                disabled={isCompleted || staffLoading}
              >
                {staffLoading ? (
                  <MenuItem value="" disabled>
                    Loading designers...
                  </MenuItem>
                ) : designers.length === 0 ? (
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
          )}

          {/* Step 2: Printer Selection (only if designer is selected) */}
          {isDesignerAdded && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPrinterAdded}
                    onChange={(e) => {
                      const value = e.target.checked;
                      setIsPrinterAdded(value);

                      if (!value) {
                        setIsLaminationAdded(false);
                        setSelectedPrinter(null);
                        setSelectedBinder(null);
                        // Reset print type
                        setPrintType("");
                        handleFormChange("printType", "");
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1, flexWrap: "wrap" }}>
              <TextField
                select
                label="Select Printer"
                value={selectedPrinter}
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
                ) : printers.length === 0 ? (
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
              {selectedPrinter && (
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel>Print Type</InputLabel>
                  <Select
                    value={printType}
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
            </Box>
          )}

          {/* Step 3: Lamination Selection (only if printer is selected) */}
          {isDesignerAdded && isPrinterAdded && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isLaminationAdded}
                    onChange={(e) => {
                      const value = e.target.checked;
                      setIsLaminationAdded(value);
                      if (!value) setSelectedBinder(null);
                    }}
                    disabled={isCompleted}
                  />
                }
                label="Add Lamination"
              />
            </Box>
          )}

          {isDesignerAdded && isPrinterAdded && isLaminationAdded && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
              <TextField
                select
                label="Select Binder"
                value={selectedBinder}
                onChange={(e) => setSelectedBinder(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ minWidth: 200 }}
                disabled={isCompleted || staffLoading}
              >
                {staffLoading ? (
                  <MenuItem value="" disabled>
                    Loading binders...
                  </MenuItem>
                ) : binders.length === 0 ? (
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
            </Box>
          )}
        </CardContent>
      </Card>
      
      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
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
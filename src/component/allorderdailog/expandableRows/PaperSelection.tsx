import ThemeButton from "@/component/common_component/themebutton";
import {
  Box,
  MenuItem,
  Typography,
  Card,
  CardContent,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
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
  data, // 🟢 your order data (contains printer and binder info)
}: any) {
  const [isPrinterAdded, setIsPrinterAdded] = useState(false);
  const [isLaminationAdded, setIsLaminationAdded] = useState(false);
  const [isDesignerAdded, setIsDesignerAdded] = useState(false);

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
    if (data?.designer) { // 🆕 Auto-set designer if assigned
      setIsDesignerAdded(true);
      setSelectedDesigner(data.designer._id);
    }
  }, []);

  return (
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
            <TextField
              select
              label="Select Printer"
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
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
  );
}

export default PaperSelection;
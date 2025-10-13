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
  staffLoading,
  selectedPrinter,
  selectedBinder,
  setSelectedPrinter,
  setSelectedBinder,
  data, // 🟢 your order data (contains printer and binder info)
}: any) {
  const [isPrinterAdded, setIsPrinterAdded] = useState(false);
  const [isLaminationAdded, setIsLaminationAdded] = useState(false);

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
  }, []);

  return (
    <Card sx={{ mt: 2, border: "1px solid #e0e0e0" }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2" }}>
          🧾 Printing & Lamination
        </Typography>

        <Box sx={{ mt: 1 }}>
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

        {isPrinterAdded && (
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
                printers?.map((printer:any) => (
                  <MenuItem key={printer.id} value={printer.id}>
                    {printer.name}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Box>
        )}

        {/* --- Step 2: Add Lamination --- */}
        {isPrinterAdded && (
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

        {isPrinterAdded && isLaminationAdded && (
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
                binders.map((binder:any) => (
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

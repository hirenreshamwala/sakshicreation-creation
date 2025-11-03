import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";

function DriverSelection({ row }: any) {
  const dispatch = useAppDispatch();
  const { staffList } = useAppSelector((state) => state.staff || {});
  const [deliveryOption, setDeliveryOption] = useState("client");
  const [selectedDriver, setSelectedDriver] = useState("");

  useEffect(() => {
    if (!staffList.length) dispatch(getAllStaffThunk());
  }, [dispatch, staffList.length]);

  const driverStaff = staffList.filter((s: any) => s.role.roleName === "Driver");

  const handleChange = (e: any) => {
    setDeliveryOption(e.target.value);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* ✅ Step === 4 & status === 'completed' OR step === 3 */}
      {( (row.step === 4 && row.status === "completed") || row.step === 3 ) && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Choose Delivery Option
          </Typography>

          <FormControl component="fieldset">
            <RadioGroup
              row
              value={deliveryOption}
              onChange={handleChange}
              name="deliveryOption"
            >
              <FormControlLabel
                value="client"
                control={<Radio />}
                label="Deliver to Client"
              />
              <FormControlLabel
                value="godown"
                control={<Radio />}
                label="Deliver to Godown"
              />
            </RadioGroup>
          </FormControl>

          {deliveryOption === "client" && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Driver</InputLabel>
                <Select
                       sx={{maxWidth:200}}
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  label="Select Driver"
                >
                  {driverStaff.map((driver: any) => (
                    <MenuItem key={driver._id} value={driver._id}>
                      {driver.firstName} {driver.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>
      )}

      {/* ✅ Step === 2 */}
      {row.step === 2 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Deliver to Client
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Select Driver</InputLabel>
            <Select
            sx={{maxWidth:200}}
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              label="Select Driver"
            >
              {driverStaff.map((driver: any) => (
                <MenuItem key={driver._id} value={driver._id}>
                  {driver.firstName} {driver.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
    </Box>
  );
}

export default DriverSelection;

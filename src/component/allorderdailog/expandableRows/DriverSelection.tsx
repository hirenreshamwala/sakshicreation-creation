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
  Button,
} from "@mui/material";
import { driverSelectAndManageInventoryThunk } from "@/store/slices/qpOrderSlice";
import { toast } from "react-toastify";

function DriverSelection({ row }: any) {
  const dispatch = useAppDispatch();
  const { staffList } = useAppSelector((state) => state.staff || {});
  const [deliveryOption, setDeliveryOption] = useState("client");
  const [selectedDriver, setSelectedDriver] = useState("");

  useEffect(() => {
    if (!staffList.length) dispatch(getAllStaffThunk());
  }, [dispatch, staffList.length]);

  const driverStaff = staffList.filter((s: any) => s.role.roleName === "Driver");

  const handleDeliveryOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => setDeliveryOption(e.target.value);

  const handleDriverChange = (e: any) => setSelectedDriver(e.target.value);

  const handleSubmit = async () => {
    try {
      const payload = {
        step: row.step,
        deliverTo: deliveryOption,
        driverId: selectedDriver,
        noOfPieces: row.noOfPieces,
        inventory:row.inventory
      };

      dispatch(driverSelectAndManageInventoryThunk({ id: row._id, data: payload }))
      toast.success("Driver Assigned Successfully")
    } catch (error) {
      console.error("Error submitting driver assignment:", error);
    }
  };

  const showStep4Or3WithCompleted = (row.step === 4 && row.status === "completed") || row.step === 3;
  const showStep2 = row.step === 2;

  return (
    <Box sx={{ mt: 2 }}>
      {showStep4Or3WithCompleted && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Choose Delivery Option
          </Typography>

          <FormControl component="fieldset">
            <RadioGroup
              row
              value={deliveryOption}
              onChange={handleDeliveryOptionChange}
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

          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Driver</InputLabel>
              <Select
                sx={{ maxWidth: 200 }}
                value={selectedDriver}
                onChange={handleDriverChange}
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

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!selectedDriver}
            >
              Submit
            </Button>
          </Box>
        </Box>
      )}

      {showStep2 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Deliver to Client
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>Select Driver</InputLabel>
            <Select
              sx={{ maxWidth: 200 }}
              value={selectedDriver}
              onChange={handleDriverChange}
              label="Select Driver"
            >
              {driverStaff.map((driver: any) => (
                <MenuItem key={driver._id} value={driver._id}>
                  {driver.firstName} {driver.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!selectedDriver}
            >
              Assign Driver
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default DriverSelection;

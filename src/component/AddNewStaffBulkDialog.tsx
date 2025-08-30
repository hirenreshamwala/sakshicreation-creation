"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { toast } from "react-toastify";
import CustomDialog from "@/component/customdialog";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeSelect from "@/component/common_component/themeselect";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";
import { useAppDispatch, useAppSelector } from "@/store";
import { bulkCreateStaffThunk, clearError } from "@/store/slices/staffSlice";
import { getAllRolesThunk } from "@/store/slices/roleSlice";

interface AddNewStaffBulkDialogProps {
  open: boolean;
  onClose: () => void;
  refreshData?: () => void;
}

interface RoleOption {
  label: string;
  value: string;
}

const AddNewStaffBulkDialog: React.FC<AddNewStaffBulkDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.staff);
  const { roles, loading: rolesLoading } = useAppSelector((state) => state.roles);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);

  useEffect(() => {
    dispatch(getAllRolesThunk());
  }, [dispatch]);

  useEffect(() => {
    if (roles.length > 0) {
      const options = roles.map((role) => ({
        label: role.roleName,
        value: role._id,
      }));
      setRoleOptions(options);
    }
  }, [roles]);

  useEffect(() => {
    if (open) {
      dispatch(clearError());
      setFile(null);
      setSelectedRole(null);
      setCompanyName("");
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a CSV file to upload");
      return;
    }
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }
    if (!companyName) {
      toast.error("Please select a company");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", selectedRole.value);
    formData.append("companyName", companyName);

    // Log FormData for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      await dispatch(bulkCreateStaffThunk(formData)).unwrap();
      toast.success("Bulk staff upload completed successfully");
      if (refreshData) refreshData();
      setFile(null);
      setSelectedRole(null);
      setCompanyName("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Bulk upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = `# Instructions: Ensure aadharNo is exactly 12 digits (no scientific notation, e.g., 123456789012). Dates must be in YYYY-MM-DD format (e.g., 2025-08-22). Save as CSV without formatting changes.\nfirstName,lastName,email,mobileNo,whatsappNo,address,aadharNo,joiningDate,birthDay,password\n"John","Doe","john@example.com","9876543210","9876543210","123 Street","123456789012","2025-08-22","1990-01-01","password123"\n"Jane","Doe","","8765432109","8765432109","456 Road","987654321098","2025-02-01","","password456"`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_staff_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <CustomDialog open={open} maxWidth="md" onClose={onClose} title="Bulk Upload Staff">
      <Box sx={{ background: "#fff", borderRadius: 2, p: 3 }}>
        {/* Role and Company Selection */}
        <Stack direction="row" spacing={2} mb={3}>
          <Box sx={{ flex: 1 }}>
            <ThemeSelect
              label="Role"
              options={roleOptions}
              value={selectedRole}
              onChange={(event, newValue) => setSelectedRole(newValue)}
              error={!selectedRole && isLoading}
              helperText={!selectedRole && isLoading ? "Role is required" : ""}
              fullWidth
              required
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <CompanySelect
              name="companyName"
              value={companyName}
              onChange={(event, newValue) => {
                setCompanyName(newValue ? newValue.value : "");
              }}
              error={!companyName && isLoading}
              helperText={!companyName && isLoading ? "Company is required" : ""}
              required
            />
          </Box>
        </Stack>

        {/* CSV File Upload */}
        <Box mb={3}>
          <Typography fontWeight={500} fontSize={14} mb={1}>
            Upload CSV File
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
            Ensure aadharNo is exactly 12 digits (e.g., 123456789012) and dates are in YYYY-MM-DD format (e.g., 2025-08-22). Download the sample CSV for reference.
          </Typography>
          <Box
            sx={{
              border: "2px dashed #e0e0e0",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              backgroundColor: "#fafafa",
              transition: "all 0.3s ease",
              cursor: "pointer",
              "&:hover": {
                borderColor: "#7F56D9",
                backgroundColor: "#f5f5f5",
              },
              ...(file && {
                borderColor: "#4caf50",
                backgroundColor: "#f1f8e9",
              }),
            }}
            onClick={() => document.getElementById("bulk-staff-file-input")?.click()}
          >
            <input
              id="bulk-staff-file-input"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile && selectedFile.type === "text/csv") {
                  setFile(selectedFile);
                  console.log("Selected CSV file:", selectedFile.name);
                } else {
                  toast.error("Please select a valid CSV file");
                }
              }}
              style={{ display: "none" }}
            />
            {!file ? (
              <>
                <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                  📁 Select CSV File
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Click here to upload a CSV file
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  Supported format: .csv
                </Typography>
              </>
            ) : (
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
            )}
          </Box>
        </Box>

        {/* Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <ThemeButton
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: "#7F56D9",
              color: "#7F56D9",
              "&:hover": { borderColor: "#5B3FB4", color: "#5B3FB4" },
            }}
          >
            Cancel
          </ThemeButton>
          <ThemeButton
            disabled={!file || !selectedRole || !companyName || isLoading}
            onClick={handleSubmit}
            sx={{
              background: "#7F56D9",
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              "&:hover": { background: "#5B3FB4" },
            }}
          >
            {isLoading ? "Uploading..." : "Upload Bulk File"}
          </ThemeButton>
          <ThemeButton
            variant="outlined"
            onClick={handleDownloadSample}
            sx={{
              borderColor: "#7F56D9",
              color: "#7F56D9",
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              "&:hover": { borderColor: "#5B3FB4", color: "#5B3FB4" },
            }}
          >
            Download Sample CSV
          </ThemeButton>
        </Stack>
      </Box>
    </CustomDialog>
  );
};

export default AddNewStaffBulkDialog;
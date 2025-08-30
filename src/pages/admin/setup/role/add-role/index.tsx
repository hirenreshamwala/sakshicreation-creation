import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Autocomplete,
  TextField,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  createRoleThunk,
  getRoleByIdThunk,
  updateRoleThunk,
  getAllRolesThunk,
  clearError,
  clearSuccessMessage,
} from "@/store/slices/roleSlice";
import { Permission, Role } from "@/services/role.service";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import Loader from "@/component/common_component/loader";
import { features } from "process";
import { permissionsArray } from "@/constants";
import { toTitleCase } from "@/utills/utills";
import ThemeButton from "@/component/common_component/themebutton";
import { ArrowBack } from "@mui/icons-material";

interface PermissionData {
  feature: string;
  capabilities: { type: string; label: string }[];
}
interface iniroles {
  features: string;
}

interface AddRoleFormProps {
  isEditMode?: boolean;
  roleId?: string;
}
const iniroles: iniroles[] = [{ features: "Admin" },{ features: "Manager" }, { features: "Sales Staff" }, { features: "Designer" }, { features: "Printer" }, { features: "Binder" }, { features: "Booklet & Folder Binder" }, { features: "Delivery" },]

const AddRoleForm: React.FC<AddRoleFormProps> = ({ isEditMode = false, roleId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const rolesState = useSelector((state: RootState) => state.roles || {
    singleRole: null,
    roles: [],
    loading: false,
    error: null,
    successMessage: null,
  });
  const { singleRole, roles, loading, error, successMessage } = rolesState;

  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<{ [key: string]: string[] }>(permissionsArray);
  const [isSaving, setIsSaving] = useState(false);

  const prevErrorRef = useRef<string | null>(null);
  const prevSuccessRef = useRef<string | null>(null);


  // Fetch all roles and role data for edit mode
  useEffect(() => {
    dispatch(getAllRolesThunk());
    if (isEditMode && roleId) {
      console.log("Fetching role with ID:", roleId);
      dispatch(clearSuccessMessage());
      dispatch(getRoleByIdThunk(roleId));
    }
  }, [isEditMode, roleId, dispatch]);

  // Initialize form with role data in edit mode
  useEffect(() => {
    if (isEditMode && singleRole) {
      console.log("Role data loaded:", singleRole);
      setRoleName(singleRole.roleName);

      setPermissions(singleRole?.permissions);
    }
  }, [isEditMode, singleRole]);

  // Handle toast notifications and redirects
  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      console.log("Error occurred:", error);
      toast.error(error);
      prevErrorRef.current = error;
      dispatch(clearError());
    }
    if (isSaving && successMessage && successMessage !== prevSuccessRef.current) {
      console.log("Success message:", successMessage);
      toast.success(successMessage);
      prevSuccessRef.current = successMessage;
      dispatch(clearSuccessMessage());
      router.push("/admin/setup/role");
    }
  }, [error, successMessage, isSaving, dispatch, router]);

  // Capitalize first character of input
  const handleRoleNameChange = (value: string) => {
    if (value) {
      setRoleName(value.charAt(0).toUpperCase() + value.slice(1));
    } else {
      setRoleName("");
    }
  };

  // Filter available role names for autocomplete
  const availableRoles = iniroles
    .map((perm) => perm.features)
    .filter((feature) => !roles.some((role: Role) => role.roleName === feature))
    .map((feature) => feature.charAt(0).toUpperCase() + feature.slice(1));

  const handleCheckboxChange = (module: string, action: string) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module][action],
      },
    }));
  };


  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      roleName,
      permissions: permissions,
    };

    console.log(isEditMode ? "Updating role with payload:" : "Creating role with payload:", payload);
    try {
      if (isEditMode && roleId) {
        await dispatch(updateRoleThunk({ id: roleId, data: payload })).unwrap();
      } else {
        await dispatch(createRoleThunk(payload)).unwrap();
      }
      setRoleName("");
      setPermissions({});
    } catch (err) {
      // Error handled via Redux state and toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    console.log("Cancel action, navigating to role list");
    router.push("/admin/setup/role");
  };

  return (
    <Box p={3} mx="auto">
        <Box sx={{ mb: 3 }}>
        <ThemeButton
           sx={{ backgroundColor: "#6366F1", borderRadius: "8px", color: "#fff" }}

          onClick={handleCancel}
          // disabled={formik.isSubmitting}
          startIcon={<ArrowBack />}
        >
          Back
        </ThemeButton>
      </Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        {isEditMode ? "Edit Role" : "Add New Role"}
      </Typography>

      {isEditMode && loading && <Loader />}

      {isEditMode && !loading && !singleRole && (
        <Typography sx={{ mb: 2 }} color="error">
          Role not found
        </Typography>
      )}

      {(!isEditMode || (isEditMode && singleRole)) && (
        <>
          <Box
            sx={{
              borderRadius: "16px",
              background: "#f0f0fa",
              boxShadow: "0 2px 8px 0 rgba(155,126,226,0.10)",
              p: 2,
              mb: 3,
            }}
          >
            <Box mb={3}>
              <Autocomplete
                freeSolo
                options={isEditMode ? [] : availableRoles}
                value={roleName}
                onChange={(event, newValue) => {
                  handleRoleNameChange(newValue || "");
                }}
                onInputChange={(event, newInputValue) => {
                  handleRoleNameChange(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Role Name"
                    placeholder="Enter or select Role Name"
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      style: { backgroundColor: "#fff" },
                    }}
                  />
                )}
              />
            </Box>

            <Box>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Assign Capabilities
              </Typography>

              <Box
                sx={{
                  border: "1px solid #E0E0E0",
                  borderRadius: 2,
                  maxHeight: 360,
                  overflowY: "auto",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                      <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Capabilities</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(permissions).map(([module, actions]) => (
                      <TableRow key={module}>
                        <TableCell sx={{ verticalAlign: 'top', fontWeight: 500 }}>
                          {toTitleCase(module)}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            {Object.entries(actions).map(([action, value]) => {
                              const isViewOwn = action === "view_own";
                              const isViewGlobal = action === "view_global";

                              const isDisabled =
                                (isViewOwn && actions.view_global) ||
                                (isViewGlobal && actions.view_own);

                              return (
                                <FormControlLabel
                                  key={action}
                                  control={
                                    <Checkbox
                                      checked={value}
                                      onChange={() => handleCheckboxChange(module, action)}
                                      disabled={isDisabled}
                                      size="small"
                                    />
                                  }
                                  label={toTitleCase(action.replace(/_/g, " "))}
                                />
                              );
                            })}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}

                  </TableBody>

                </Table>
              </Box>
            </Box>
          </Box>

          <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#6366F1", borderRadius: "8px", color: "#fff" }}
              onClick={handleSave}
              disabled={loading || isSaving || !roleName.trim()}
            >
              {isSaving ? "Saving..." : isEditMode ? "Save Role" : "Add Role"}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default AddRoleForm;
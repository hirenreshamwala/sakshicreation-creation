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
  TextField,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState, useAppSelector } from "@/store";
import {
  createRoleThunk,
  getRoleByIdThunk,
  updateRoleThunk,
  getAllRolesThunk,
  clearError,
  clearSuccessMessage,
} from "@/store/slices/roleSlice";
import { useRouter } from "next/router";
import Loader from "@/component/common_component/loader";
import ThemeButton from "@/component/common_component/themebutton";
import { ArrowBack } from "@mui/icons-material";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import ThemeSelect from "@/component/common_component/themeselect";
import { toTitleCase } from "@/utills/utills";
import { toast } from "react-toastify";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { permissionsArray, QualityPermissionsArray } from "@/constants";

// 🔹 Define two separate permission arrays
const sakshiPermissions = {
  orders: { view: false, create: false, edit: false, delete: false },
  invoices: { view: false, create: false, edit: false, delete: false },
};

const qualityPermissions = {
  packaging: { view: false, create: false, edit: false, delete: false },
  dispatch: { view: false, create: false, edit: false, delete: false },
};

interface AddRoleFormProps {
  isEditMode?: boolean;
  roleId?: string;
}

const AddRoleForm: React.FC<AddRoleFormProps> = ({ isEditMode = false, roleId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { companies } = useAppSelector((state) => state.company);
  const rolesState = useSelector((state: RootState) => state.roles || {});
  const { singleRole, roles, loading, error, successMessage } = rolesState;

  const [permissions, setPermissions] = useState(permissionsArray); // Default

  const prevErrorRef = useRef<string | null>(null);
  const prevSuccessRef = useRef<string | null>(null);

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk());
  }, []);

  useEffect(() => {
    dispatch(getAllRolesThunk());
    if (isEditMode && roleId) {
      dispatch(clearSuccessMessage());
      dispatch(getRoleByIdThunk(roleId));
    }
  }, [isEditMode, roleId, dispatch]);

  useEffect(() => {
    if (isEditMode && singleRole) {
      setPermissions(singleRole.permissions);
    }
  }, [isEditMode, singleRole]);

  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      toast.error(error);
      prevErrorRef.current = error;
      dispatch(clearError());
    }
    if (successMessage && successMessage !== prevSuccessRef.current) {
      toast.success(successMessage);
      prevSuccessRef.current = successMessage;
      dispatch(clearSuccessMessage());
      router.push("/admin/setup/role");
    }
  }, [error, successMessage, dispatch, router]);

  // 🔹 Yup Validation Schema
  const validationSchema = Yup.object().shape({
    roleName: Yup.string().required("Role name is required"),
    company: Yup.string().required("Company is required"),
  });

  // 🔹 Handle checkbox changes
  // 🔹 Handle checkbox changes with mutual exclusivity
  const handleCheckboxChange = (module: string, action: string) => {
    setPermissions((prev) => {
      const updatedModule = { ...prev[module] };

      // Toggle selected action
      updatedModule[action] = !updatedModule[action];

      // If selecting "view_global", uncheck "view_own"
      if (action === "view_global" && updatedModule[action]) {
        updatedModule["view_own"] = false;
      }

      // If selecting "view_own", uncheck "view_global"
      if (action === "view_own" && updatedModule[action]) {
        updatedModule["view_global"] = false;
      }

      return {
        ...prev,
        [module]: updatedModule,
      };
    });
  };


  return (
    <Formik
      enableReinitialize
      initialValues={{
        roleName: isEditMode ? singleRole?.roleName : "",
        company: isEditMode ? singleRole?.company : "",
      }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          const payload = {
            roleName: values.roleName,
            company: values.company,
            permissions,
          };

          if (isEditMode && roleId) {
            await dispatch(updateRoleThunk({ id: roleId, data: payload })).unwrap();
          } else {
            await dispatch(createRoleThunk(payload)).unwrap();
          }
          router.push("/admin/setup/role");
        } catch (err) {
          console.error(err);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, handleChange, setFieldValue, errors, touched, isSubmitting, resetForm }) => {
        // 🔹 Switch permission array based on company
        useEffect(() => {
          if (!values.company) return;
          const selectedCompany = companies.find((c: any) => c._id === values.company);
          if (selectedCompany?.companyName === "Sakshi Creation") {
            setPermissions(permissionsArray);
          } else if (selectedCompany?.companyName === "Quality Packaging") {
            setPermissions(QualityPermissionsArray);
          }
        }, [values.company, companies]);

        return (
          <Form>
            <Box p={3} mx="auto">
              <Box sx={{ mb: 3 }}>
                <ThemeButton
                  sx={{ backgroundColor: "#6366F1", borderRadius: "8px", color: "#fff" }}
                  onClick={() => router.push("/admin/setup/role")}
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
                      <TextField
                        name="roleName"
                        label="Role Name"
                        value={values.roleName}
                        onChange={handleChange}
                        error={touched.roleName && Boolean(errors.roleName)}
                        helperText={touched.roleName && errors.roleName}
                        fullWidth
                        size="small"
                      />
                    </Box>

                    <ThemeSelect
                      label="Company"
                      options={companies.map((c: any) => ({
                        value: c._id,
                        label: c.companyName,
                      }))}
                      value={companies
                        .map((c: any) => ({ value: c._id, label: c.companyName }))
                        .find((o) => o.value === values.company) || null}
                      onChange={(e, val: any) => setFieldValue("company", val?.value || "")}
                      error={touched.company && Boolean(errors.company)}
                      helperText={touched.company && errors.company}
                    />

                    <Box mt={3}>
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
                                <TableCell sx={{ verticalAlign: "top", fontWeight: 500 }}>
                                  {toTitleCase(module)}
                                </TableCell>
                                <TableCell>
                                  <Box display="flex" flexDirection="column" gap={0.5}>
                                    {Object.entries(actions).map(([action, value]) => {
                                      const label = toTitleCase(action.replace(/_/g, " "));

                                      // 🔹 Disable logic
                                      const isDisabled =
                                        (action === "view_own" && actions.view_global) ||
                                        (action === "view_global" && actions.view_own);

                                      return (
                                        <FormControlLabel
                                          key={action}
                                          disabled={isDisabled}
                                          control={
                                            <Checkbox
                                              checked={value}
                                              onChange={() => handleCheckboxChange(module, action)}
                                              size="small"
                                            />
                                          }
                                          label={label}
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
                    <Button variant="outlined" onClick={() => {
                      router.push("/admin/setup/role")
                      resetForm()
                    }}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      sx={{ backgroundColor: "#6366F1", borderRadius: "8px", color: "#fff" }}
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : isEditMode ? "Save Role" : "Add Role"}
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Form>
        );
      }}
    </Formik>
  );
};

export default AddRoleForm;

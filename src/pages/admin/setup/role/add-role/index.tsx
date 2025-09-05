// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Button,
//   Checkbox,
//   FormControlLabel,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   Typography,
//   TextField,
// } from "@mui/material";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState, useAppSelector } from "@/store";
// import {
//   createRoleThunk,
//   getRoleByIdThunk,
//   updateRoleThunk,
//   getAllRolesThunk,
// } from "@/store/slices/roleSlice";
// import { useRouter } from "next/router";
// import Loader from "@/component/common_component/loader";
// import ThemeButton from "@/component/common_component/themebutton";
// import { ArrowBack } from "@mui/icons-material";
// import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
// import ThemeSelect from "@/component/common_component/themeselect";
// import { toTitleCase } from "@/utills/utills";
// import { Formik, Form } from "formik";
// import * as Yup from "yup";
// import { permissionsArray } from "@/constants";

// interface AddRoleFormProps {
//   isEditMode?: boolean;
//   roleId?: string;
// }

// const AddRoleForm: React.FC<AddRoleFormProps> = ({ isEditMode = false, roleId }) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const router = useRouter();
//   const { companies } = useAppSelector((state) => state.company);
//   const { singleRole, loading } = useSelector((state: RootState) => state.roles);
//   const [permissions, setPermissions] = useState(permissionsArray);

//   useEffect(() => {
//     if (!companies.length) dispatch(getAllCompaniesThunk());
//     dispatch(getAllRolesThunk());
//     if (isEditMode && roleId) dispatch(getRoleByIdThunk(roleId));

//   }, [dispatch, companies.length, isEditMode, roleId]);

//   useEffect(() => {
//     if (isEditMode && singleRole) setPermissions(singleRole.permissions);

//   }, [isEditMode, singleRole]);

//   // 🔹 Validation
//   const validationSchema = Yup.object().shape({
//     roleName: Yup.string().required("Role name is required"),
//     company: Yup.string().required("Company is required"),
//   });

//   // 🔹 Handle checkbox changes
//   const handleCheckboxChange = (module: string, action: string) => {
//     setPermissions((prev) => {
//       const updatedModule = { ...prev[module] };
//       updatedModule[action] = !updatedModule[action];

//       if (action === "view_global" && updatedModule[action]) {
//         updatedModule["view_own"] = false;
//       }
//       if (action === "view_own" && updatedModule[action]) {
//         updatedModule["view_global"] = false;
//       }

//       return {
//         ...prev,
//         [module]: updatedModule,
//       };
//     });
//   };

//   return (
//     <Formik
//       enableReinitialize
//       initialValues={{
//         roleName: isEditMode ? singleRole?.roleName || "" : "",
//         company: isEditMode ? singleRole?.company?._id || "" : "",
//       }}
//       validationSchema={validationSchema}
//       onSubmit={async (values, { setSubmitting }) => {
//         try {
//           const payload = {
//             roleName: values.roleName,
//             company: values.company,
//             permissions,
//           };

//           if (isEditMode && roleId) {
//             await dispatch(updateRoleThunk({ id: roleId, data: payload })).unwrap();
//           } else {
//             await dispatch(createRoleThunk(payload)).unwrap();
//           }
//           router.push("/admin/setup/role");
//         } catch (err) {
//           console.error(err);
//         } finally {
//           setSubmitting(false);
//         }
//       }}
//     >
//       {({ values, handleChange, setFieldValue, errors, touched, isSubmitting, resetForm }) => {

//         return (
//           <Form>
//             <Box p={3} mx="auto">
//               <Box sx={{ mb: 3 }}>
//                 <ThemeButton
//                   onClick={() => router.push("/admin/setup/role")}
//                   startIcon={<ArrowBack />}
//                 >
//                   Back
//                 </ThemeButton>
//               </Box>
//               <Typography variant="h5" fontWeight={600} mb={3}>
//                 {isEditMode ? "Edit Role" : "Add New Role"}
//               </Typography>

//               {isEditMode && loading && <Loader />}
//               {isEditMode && !loading && !singleRole && (
//                 <Typography sx={{ mb: 2 }} color="error">
//                   Role not found
//                 </Typography>
//               )}

//               {(!isEditMode || (isEditMode && singleRole)) && (
//                 <>
//                   <Box
//                     sx={{
//                       borderRadius: "16px",
//                       background: "#f0f0fa",
//                       boxShadow: "0 2px 8px 0 rgba(155,126,226,0.10)",
//                       p: 2,
//                       mb: 3,
//                     }}
//                   >
//                     <Box mb={3}>
//                       <TextField
//                         name="roleName"
//                         label="Role Name"
//                         value={values.roleName}
//                         onChange={handleChange}
//                         error={touched.roleName && Boolean(errors.roleName)}
//                         helperText={touched.roleName && errors.roleName}
//                         fullWidth
//                         size="small"
//                       />
//                     </Box>

//                     <ThemeSelect
//                       label="Company"
//                       options={companies.map((c: any) => ({
//                         value: c._id,
//                         label: c.companyName,
//                       }))}
//                       value={companies
//                         .map((c: any) => ({ value: c._id, label: c.companyName }))
//                         .find((o) => o.value === values.company) || null}
//                       onChange={(e, val: any) => setFieldValue("company", val?.value || "")}
//                       error={touched.company && Boolean(errors.company)}
//                       helperText={touched.company && errors.company}
//                     />

//                     <Box mt={3}>
//                       <Typography variant="h6" fontWeight={600} mb={2}>
//                         Assign Capabilities
//                       </Typography>
//                       <Box
//                         sx={{
//                           border: "1px solid #E0E0E0",
//                           borderRadius: 2,
//                           maxHeight: 360,
//                           overflowY: "auto",
//                         }}
//                       >
//                         <Table size="small">
//                           <TableHead>
//                             <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
//                               <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
//                               <TableCell sx={{ fontWeight: 600 }}>Capabilities</TableCell>
//                             </TableRow>
//                           </TableHead>
//                           <TableBody>
//                             {Object.entries(permissions).map(([module, actions]) => (
//                               <TableRow key={module}>
//                                 <TableCell sx={{ verticalAlign: "top", fontWeight: 500 }}>
//                                   {toTitleCase(module)}
//                                 </TableCell>
//                                 <TableCell>
//                                   <Box display="flex" flexDirection="column" gap={0.5}>
//                                     {Object.entries(actions).map(([action, value]) => {
//                                       const isDisabled =
//                                         (action === "view_own" && actions.view_global) ||
//                                         (action === "view_global" && actions.view_own);

//                                       return (
//                                         <FormControlLabel
//                                           key={action}
//                                           disabled={isDisabled}
//                                           control={
//                                             <Checkbox
//                                               checked={value}
//                                               onChange={() => handleCheckboxChange(module, action)}
//                                               size="small"
//                                             />
//                                           }
//                                           label={toTitleCase(action.replace(/_/g, " "))}
//                                         />
//                                       );
//                                     })}
//                                   </Box>
//                                 </TableCell>
//                               </TableRow>
//                             ))}
//                           </TableBody>
//                         </Table>
//                       </Box>
//                     </Box>
//                   </Box>

//                   <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
//                     <Button
//                       variant="outlined"
//                       onClick={() => {
//                         router.push("/admin/setup/role");
//                         resetForm();
//                       }}
//                     >
//                       Cancel
//                     </Button>
//                     <Button
//                       variant="contained"
//                       type="submit"
//                       disabled={isSubmitting}
//                     >
//                       {isSubmitting ? "Saving..." : isEditMode ? "Save Role" : "Add Role"}
//                     </Button>
//                   </Box>
//                 </>
//               )}
//             </Box>
//           </Form>
//         );
//       }}
//     </Formik>
//   );
// };

// export default AddRoleForm;
import React, { useState, useEffect } from "react";
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
} from "@/store/slices/roleSlice";
import { useRouter } from "next/router";
import Loader from "@/component/common_component/loader";
import ThemeButton from "@/component/common_component/themebutton";
import { ArrowBack } from "@mui/icons-material";
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice";
import ThemeSelect from "@/component/common_component/themeselect";
import { toTitleCase } from "@/utills/utills";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { permissionsArray } from "@/constants";
import { toast } from "react-toastify";

interface AddRoleFormProps {
  isEditMode?: boolean;
  roleId?: string;
}

const AddRoleForm: React.FC<AddRoleFormProps> = ({ isEditMode = false, roleId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { companies } = useAppSelector((state) => state.company);
  const { singleRole } = useSelector((state: RootState) => state.roles);

  const [permissions, setPermissions] = useState(permissionsArray);
  const [loadingRole, setLoadingRole] = useState<boolean>(false); // 🔹 Local loading

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk());
    dispatch(getAllRolesThunk());

    const fetchRole = async () => {
      if (isEditMode && roleId) {
        setLoadingRole(true);
        await dispatch(getRoleByIdThunk(roleId));
        setLoadingRole(false);
      }
    };
    fetchRole();
  }, [dispatch, companies.length, isEditMode, roleId]);

  useEffect(() => {
    if (isEditMode && singleRole) {
      setPermissions(singleRole.permissions);
    }
  }, [isEditMode, singleRole]);

  const validationSchema = Yup.object().shape({
    roleName: Yup.string().required("Role name is required"),
    company: Yup.string().required("Company is required"),
  });

  const handleCheckboxChange = (module: string, action: string) => {
    setPermissions((prev) => {
      const updatedModule = { ...prev[module] };
      updatedModule[action] = !updatedModule[action];

      if (action === "view_global" && updatedModule[action]) {
        updatedModule["view_own"] = false;
      }
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
        roleName: isEditMode ? singleRole?.roleName || "" : "",
        company: isEditMode ? singleRole?.company?._id || "" : "",
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
          toast.error(err);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, handleChange, setFieldValue, errors, touched, isSubmitting, resetForm }) => (
        <Form>
          <Box p={3} mx="auto">
            <Box sx={{ mb: 3 }}>
              <ThemeButton
                onClick={() => router.push("/admin/setup/role")}
                startIcon={<ArrowBack />}
              >
                Back
              </ThemeButton>
            </Box>
            <Typography variant="h5" fontWeight={600} mb={3}>
              {isEditMode ? "Edit Role" : "Add New Role"}
            </Typography>

            {/* 🔹 Local Loader */}
            {loadingRole ? (
              <Loader />
            ) : isEditMode && !singleRole ? (
              <Typography sx={{ mb: 2 }} color="error">
                Role not found
              </Typography>
            ) : (
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
                  <Button
                    variant="outlined"
                    onClick={() => {
                      router.push("/admin/setup/role");
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
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
      )}
    </Formik>
  );
};

export default AddRoleForm;

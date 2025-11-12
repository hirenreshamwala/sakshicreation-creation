"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Box,
  Stack,
  Typography,
  Chip,
  FormLabel,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from "@mui/material"
import { useFormik } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { useRouter } from "next/router"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import { useAppDispatch, useAppSelector } from "@/store"
import { getStaffByIdThunk, createStaffThunk, updateStaffThunk } from "@/store/slices/staffSlice"
import { getAllRolesThunk } from "@/store/slices/roleSlice"
import { deleteFileThunk } from "@/store/slices/fileUploadSlice"
import FileUpload, { type FileUploadRef } from "@/component/reusablecomponents/FileUpload"
import { ArrowBack, Delete, Close } from "@mui/icons-material"
import { decryptData } from "@/utills/utills"
import StaffService from "@/services/staff.service"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import Request from "@/services/axios"
import Endpoint from "@/API/apiConfig"

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  mobileCode: string;
  whatsappNo: string;
  whatsappCode: string;
  address: string;
  aadharNo: string;
  joiningDate: string;
  birthDay: string;
  role: string;
  companyName: string[];
  password?: string;
  aadharFiles: string[];
  addressFiles: string[];
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const validationSchema = Yup.object({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  mobileNo: Yup.string()
    .matches(/^[0-9]{10}$/, "Mobile No. must be 10 digits")
    .required("Mobile No. is required"),
  whatsappNo: Yup.string()
    .matches(/^[0-9]{10}$/, "WhatsApp No. must be 10 digits")
    .required("WhatsApp No. is required"),
  address: Yup.string().required("Address is required"),
  aadharNo: Yup.string()
    .matches(/^[0-9]{12}$/, "Aadhar No. must be 12 digits")
    .required("Aadhar No. is required"),
  joiningDate: Yup.string().required("Joining date is required"),
  birthDay: Yup.string(),
  role: Yup.string().required("Role is required"),
  companyName: Yup.array()
    .of(Yup.string())
    .min(1, "At least one company is required")
    .required("Company name is required"),
  password: Yup.string().when("mode", {
    is: "add",
    then: (schema) => schema.required("Password is required").min(8, "Password must be at least 8 characters"),
    otherwise: (schema) => schema.notRequired(),
  }),
  aadharFiles: Yup.array().of(Yup.string()).required("Aadhar files are required"),
  addressFiles: Yup.array().of(Yup.string()).optional(),
})

const StaffView = () => {
  const router = useRouter()
  const { mode, id } = router.query
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { companies } = useAppSelector((state) => state.company);
  const { roles, loading: rolesLoading } = useAppSelector((state) => state.roles)

  const aadharFileUploadRef = useRef<FileUploadRef>(null)
  const addressFileUploadRef = useRef<FileUploadRef>(null)
  const [staffData, setStaffData] = useState(null)
  const [selectedAadharFiles, setSelectedAadharFiles] = useState<File[]>([])
  const [selectedAddressFiles, setSelectedAddressFiles] = useState<File[]>([])
  const [existingAadharFiles, setExistingAadharFiles] = useState<string[]>([])
  const [existingAddressFiles, setExistingAddressFiles] = useState<string[]>([])
  const [initialLoad, setInitialLoad] = useState(true)

  const formik = useFormik<StaffFormData & { mode: string }>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobileNo: "",
      mobileCode: "91",
      whatsappNo: "",
      whatsappCode: "91",
      address: "",
      aadharNo: "",
      joiningDate: "",
      birthDay: "",
      role: "",
      companyName: [],
      password: "",
      aadharFiles: [],
      addressFiles: [],
      mode: mode as string,
    },
    validationSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      const errors = await formik.validateForm()
      if (Object.keys(errors).length > 0) {
        formik.setErrors(errors)
        return
      }
      try {
        // Upload new Aadhar files
        let uploadedAadharFilePaths: string[] = []
        if (selectedAadharFiles.length > 0 && aadharFileUploadRef.current) {
          const uploaded = await aadharFileUploadRef.current.uploadSelectedFiles()
          uploadedAadharFilePaths = uploaded.map((file) => file.path || file.url)
        }

        let uploadedAddressFilePaths: string[] = []
        if (selectedAddressFiles.length > 0 && addressFileUploadRef.current) {
          const uploaded = await addressFileUploadRef.current.uploadSelectedFiles()
          uploadedAddressFilePaths = uploaded.map((file) => file.path || file.url)
        }

        const finalAadharFiles = [...existingAadharFiles, ...uploadedAadharFilePaths]
        const finalAddressFiles = [...existingAddressFiles, ...uploadedAddressFilePaths]

        const staffData = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email || undefined,
          mobileNo: values.mobileNo,
          mobileCode: values.mobileCode,
          whatsappNo: values.whatsappNo,
          whatsappCode: values.whatsappCode,
          address: values.address,
          aadharNo: values.aadharNo || undefined,
          joiningDate: values.joiningDate,
          birthDay: values.birthDay || undefined,
          role: values.role,
          CompanyName: values.companyName,
          password: values.password,
          aadharFiles: finalAadharFiles,
          addressFiles: finalAddressFiles,
          ...(mode === "add" && { password: values.password }),
        }

        if (mode === "add") {
          await dispatch(createStaffThunk(staffData)).unwrap()
          toast.success("Staff created successfully!")
          router.push("/admin/setup/staff")
        } else if (mode === "edit" && id) {
          await dispatch(updateStaffThunk({ id: id as string, ...staffData })).unwrap()
          toast.success("Staff updated successfully!")
          router.push("/admin/setup/staff")
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to save staff")
      } finally {
        // Clear selected files after submission attempt
        setSelectedAadharFiles([])
        setSelectedAddressFiles([])
        aadharFileUploadRef.current?.clearSelectedFiles()
        addressFileUploadRef.current?.clearSelectedFiles()
      }
    },
  })

  useEffect(() => {
    if (!companies.length) dispatch(getAllCompaniesThunk(true))
    if (!roles.length) dispatch(getAllRolesThunk())
  }, [])


  const getData = async () => {

    const res = await Request.get(`${Endpoint.GET_STAFF_BY_ID}/${id}`)
    if (res.status === 200) {
      const newData = res?.data?.data
      setStaffData(res?.data?.data)

      const editData = {
        firstName: newData.firstName || "",
        lastName: newData.lastName || "",
        email: newData.email ? newData.email.toLowerCase() : "",
        mobileNo: newData.mobileNo || "",
        mobileCode: newData.mobileCode || "91",
        whatsappNo: newData.whatsappNo || "",
        whatsappCode: newData.whatsappCode || "91",
        address: newData.address || "",
        aadharNo: newData.aadharNo || "",
        joiningDate: newData.joiningDate ? new Date(newData.joiningDate).toISOString()?.split("T")[0] : "",
        birthDay: newData.birthDay ? new Date(newData.birthDay).toISOString()?.split("T")[0] : "",
        role: newData.role?._id || "",
        companyName: newData.CompanyName?.map((item) => item._id),
        password: user?.role?.roleName === 'Admin' && user?.role?.isDelete === false ? decryptData(newData?.password) : "",
        aadharFiles: newData.aadharFiles || [],
        addressFiles: newData.addressFiles || [],
        mode: "edit",
      }
      formik.setValues(editData)

      setExistingAadharFiles(newData.aadharFiles || [])
      setExistingAddressFiles(newData.addressFiles || [])
    }
  }

  useEffect(() => {
    if (mode === "edit" && id) getData()
    if (mode === "add") {
      formik.setFieldValue("mode", "add")
      setExistingAadharFiles([])
      setExistingAddressFiles([])
      setInitialLoad(false)
    }
  }, [mode, id])

  const handleCompanyChange = (event: any) => {
    const value = event.target.value;
    formik.setFieldValue("companyName", typeof value === 'string' ? value?.split(',') : value);
  };

  const handleMobileChange = (field: "mobileNo" | "whatsappNo", value: string) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 10)
    formik.setFieldValue(field, cleanValue)
    formik.setFieldError(
      field,
      cleanValue.length !== 10 ? `${field === "mobileNo" ? "Mobile" : "WhatsApp"} No. must be 10 digits` : undefined,
    )
  }

  const handleAadharChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 12)
    formik.setFieldValue("aadharNo", cleanValue)
    formik.setFieldError(
      "aadharNo",
      cleanValue && cleanValue.length !== 12 ? "Aadhar No. must be 12 digits" : undefined,
    )
  }

  const handleEmailChange = (value: string) => {
    const normalizedEmail = value.toLowerCase();
    formik.setFieldValue("email", normalizedEmail);
    formik.setFieldError(
      "email",
      normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ? "Invalid email format"
        : undefined
    );
  };

  const handleDeleteExistingFile = async (fileType: "aadhar" | "address", filePathToDelete: string) => {
    const parts = filePathToDelete?.split("/")
    const folder = parts[parts.length - 2]
    const filename = parts[parts.length - 1]

    try {
      await dispatch(deleteFileThunk({ folder, filename })).unwrap()
      await StaffService.updateStaffAttachments(id, fileType === "aadhar" ? { aadharFiles: staffData?.aadharFiles?.filter((path) => path !== filePathToDelete) } : { addressFiles: staffData?.addressFiles?.filter((path) => path !== filePathToDelete) })
      toast.success(`File ${filename} deleted successfully.`)

      if (fileType === "aadhar") {
        setExistingAadharFiles((prev) => prev.filter((path) => path !== filePathToDelete))
        formik.setFieldValue(
          "aadharFiles",
          formik.values.aadharFiles.filter((path) => path !== filePathToDelete),
        )
      } else {
        setExistingAddressFiles((prev) => prev.filter((path) => path !== filePathToDelete))
        formik.setFieldValue(
          "addressFiles",
          formik.values.addressFiles.filter((path) => path !== filePathToDelete),
        )
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete file from server.")
    }
  }

  const handleDiscard = () => {
    if (mode === "edit" && staffData) {
      const editData = {
        firstName: staffData.firstName || "",
        lastName: staffData.lastName || "",
        email: staffData.email || "",
        mobileNo: staffData.mobileNo || "",
        mobileCode: staffData.mobileCode || "91",
        whatsappNo: staffData.whatsappNo || "",
        whatsappCode: staffData.whatsappCode || "91",
        address: staffData.address || "",
        aadharNo: staffData.aadharNo || "",
        joiningDate: staffData.joiningDate ? new Date(staffData.joiningDate).toISOString()?.split("T")[0] : "",
        birthDay: staffData.birthDay ? new Date(staffData.birthDay).toISOString()?.split("T")[0] : "",
        role: staffData.role?._id || "",
        companyName: staffData.CompanyName?.map((item) => item._id),
        password: "",
        aadharFiles: staffData.aadharFiles || [],
        addressFiles: staffData.addressFiles || [],
        mode: "edit",
      }
      formik.setValues(editData)
      setExistingAadharFiles(staffData.aadharFiles || [])
      setExistingAddressFiles(staffData.addressFiles || [])
    } else {
      formik.resetForm()
      setExistingAadharFiles([])
      setExistingAddressFiles([])
    }
    aadharFileUploadRef.current?.clearSelectedFiles()
    addressFileUploadRef.current?.clearSelectedFiles()
  }

  return (
    <Box sx={{ width: "100%" }} component="form" onSubmit={formik.handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <ThemeButton
          sx={{ backgroundColor: "#6366F1", borderRadius: "8px", color: "#fff" }}
          onClick={() => {
            router.push("/admin/setup/staff")
          }}
          disabled={formik.isSubmitting}
          startIcon={<ArrowBack />}
        >
          Back
        </ThemeButton>
      </Box>

      <Stack direction="row" spacing={2} mb={2}>
        <ThemeInput
          labelName="First name"
          value={formik.values.firstName}
          onChange={(e) => formik.setFieldValue("firstName", e.target.value)}
          error={Boolean(formik.errors.firstName)}
          helperText={formik.errors.firstName}
          fullWidth
          required
        />
        <ThemeInput
          labelName="Last Name"
          value={formik.values.lastName}
          onChange={(e) => formik.setFieldValue("lastName", e.target.value)}
          error={Boolean(formik.errors.lastName)}
          helperText={formik.errors.lastName}
          fullWidth
          required
        />
        <ThemeInput
          labelName="Email"
          value={formik.values.email}
          onChange={(e) => handleEmailChange(e.target.value)}
          error={Boolean(formik.errors.email)}
          helperText={formik.errors.email}
          fullWidth
        />
      </Stack>

      <Stack direction="row" spacing={2} mb={2}>
        <ThemeInput
          labelName="Mobile No."
          value={formik.values.mobileNo}
          onChange={(e) => handleMobileChange("mobileNo", e.target.value)}
          mobile
          countryCode={formik.values.mobileCode}
          onCountryCodeChange={(code) => formik.setFieldValue("mobileCode", code)}
          error={Boolean(formik.errors.mobileNo)}
          helperText={formik.errors.mobileNo}
          fullWidth
          required
        />
        <ThemeInput
          labelName="WhatsApp No."
          value={formik.values.whatsappNo}
          onChange={(e) => handleMobileChange("whatsappNo", e.target.value)}
          mobile
          countryCode={formik.values.whatsappCode}
          onCountryCodeChange={(code) => formik.setFieldValue("whatsappCode", code)}
          error={Boolean(formik.errors.whatsappNo)}
          helperText={formik.errors.whatsappNo}
          fullWidth
          required
        />

        {/* Multi-select Company Dropdown */}
        <FormControl fullWidth error={Boolean(formik.errors.companyName)}>
          <InputLabel id="company-select-label">Company *</InputLabel>
          <Select
            labelId="company-select-label"
            id="company-select"
            multiple
            value={formik.values.companyName}
            onChange={handleCompanyChange}
            input={<OutlinedInput label="Company *" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={companies.find(comp => comp._id === value)?.companyName || value}
                    size="small"
                    onDelete={() => formik.setFieldValue(
                      "companyName",
                      formik.values.companyName.filter(company => company !== value)
                    )}
                    onMouseDown={(event) => event.stopPropagation()}
                  />
                ))}
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {companies.map((company) => (
              <MenuItem key={company._id} value={company._id}>
                {company?.companyName}
              </MenuItem>
            ))}
          </Select>
          {formik.errors.companyName && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {formik.errors.companyName}
            </Typography>
          )}
        </FormControl>

        <FormControl fullWidth error={Boolean(formik.errors.role)} required>
          <InputLabel id="role-select-label">Role *</InputLabel>
          <Select
            labelId="role-select-label"
            id="role-select"
            value={formik.values.role}
            label="Role *"
            onChange={(e) => formik.setFieldValue("role", e.target.value as string)}
          >
            {rolesLoading ? (
              <MenuItem disabled>Loading roles...</MenuItem>
            ) : (
              roles.map((role) => (
                <MenuItem key={role._id} value={role._id}>
                  {role.roleName}
                </MenuItem>
              ))
            )}
          </Select>
          {formik.errors.role && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {formik.errors.role}
            </Typography>
          )}
        </FormControl>

        <ThemeInput
          labelName="Aadhar No."
          value={formik.values.aadharNo}
          onChange={(e) => handleAadharChange(e.target.value)}
          error={Boolean(formik.errors.aadharNo)}
          helperText={formik.errors.aadharNo}
          fullWidth
          required
        />
      </Stack>

      <Box mb={2}>
        {!existingAadharFiles.length && <Box sx={{ mb: 2 }}>
          <FormLabel required sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
            Aadhar File Upload (Required)
          </FormLabel>
          <FileUpload
            ref={aadharFileUploadRef}
            folder="aadhar"
            multiple={true}
            accept="image/*,.pdf"
            onFilesSelected={setSelectedAadharFiles}
            onUploadError={(errorMsg) => toast.error(errorMsg)}
            showPreview={true}
            showUploadButton={false}
            autoUpload={false}
            helperText="Upload Aadhar card images or PDF (required)"
            required
          />
        </Box>}

        {existingAadharFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Existing Aadhar Files:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {existingAadharFiles.map((filePath, index) => {
                const fileName = filePath?.split("/").pop();
                const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/fileDownload/download?filePath=${encodeURIComponent(filePath)}&view=true`;

                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: 1,
                      borderRadius: 5,
                      borderColor: "#bdbdbd",
                      padding: '4px 8px',
                    }}
                  >
                    <Box
                      component="a"
                      href={fileUrl}
                      target="_blank"
                      sx={{
                        textDecoration: 'none',
                        cursor: 'pointer',
                        maxWidth: '200px',
                        color: "#404550",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 10,
                        marginRight: 1,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {fileName}
                    </Box>

                    <IconButton
                      size="small"
                      onClick={() => handleDeleteExistingFile("aadhar", filePath)}
                      sx={{
                        color: 'grey.500',
                        '&:hover': {
                          color: 'error.main',
                          backgroundColor: 'error.light'
                        }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      <ThemeInput
        labelName="Address"
        value={formik.values.address}
        onChange={(e) => formik.setFieldValue("address", e.target.value)}
        error={Boolean(formik.errors.address)}
        helperText={formik.errors.address}
        fullWidth
        rows={2}
        multiline
        sx={{ mb: 2 }}
        required
      />

      <Box mb={2}>
        {!existingAddressFiles.length && <FileUpload
          ref={addressFileUploadRef}
          folder="address"
          multiple={true}
          accept="image/*,.pdf"
          onFilesSelected={setSelectedAddressFiles}
          onUploadError={(errorMsg) => toast.error(errorMsg)}
          showPreview={true}
          showUploadButton={false}
          autoUpload={false}
          label="Upload Address Files"
          helperText="Upload Address proof images or PDF "
        />}

        {existingAddressFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Existing Address Files:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {existingAddressFiles.map((filePath, index) => {
                const fileName = filePath?.split("/").pop();
                const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/fileDownload/download?filePath=${encodeURIComponent(filePath)}&view=true`;

                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: 1,
                      borderRadius: 5,
                      borderColor: "#bdbdbd",
                      padding: '4px 8px',
                    }}
                  >
                    <Box
                      component="a"
                      href={fileUrl}
                      target="_blank"
                      sx={{
                        textDecoration: 'none',
                        cursor: 'pointer',
                        maxWidth: '200px',
                        color: "#404550",
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 10,
                        marginRight: 1,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {fileName}
                    </Box>

                    <IconButton
                      size="small"
                      onClick={() => handleDeleteExistingFile("address", filePath)}
                      sx={{
                        color: 'grey.500',
                        '&:hover': {
                          color: 'error.main',
                          backgroundColor: 'error.light'
                        }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      <Stack direction="row" spacing={2} mb={4}>
        <ThemeInput
          labelName="Joining date"
          type="date"
          value={formik.values.joiningDate}
          onChange={(e) => formik.setFieldValue("joiningDate", e.target.value)}
          error={Boolean(formik.errors.joiningDate)}
          helperText={formik.errors.joiningDate}
          fullWidth
          InputLabelProps={{ shrink: true }}
          required
          inputProps={{
            style: {
              cursor: "pointer",
              caretColor: "transparent",
            },
          }}
          onClick={(e) => {
            if (e.currentTarget.querySelector("input")) {
              e.currentTarget.querySelector("input")?.focus()
              e.currentTarget.querySelector("input")?.showPicker()
            }
          }}
        />
        <ThemeInput
          labelName="Birth Day"
          type="date"
          value={formik.values.birthDay}
          onChange={(e) => formik.setFieldValue("birthDay", e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          inputProps={{
            style: {
              cursor: "pointer",
              caretColor: "transparent",
            },
          }}
          onClick={(e) => {
            if (e.currentTarget.querySelector("input")) {
              e.currentTarget.querySelector("input")?.focus()
              e.currentTarget.querySelector("input")?.showPicker()
            }
          }}
        />
        {mode === "add" && (
          <ThemeInput
            labelName="Password"
            type="password"
            value={formik.values.password || ""}
            onChange={(e) => formik.setFieldValue("password", e.target.value)}
            error={Boolean(formik.errors.password)}
            helperText={formik.errors.password}
            fullWidth
            InputLabelProps={{ shrink: true }}
            
            sx={{ mb: 2 }}
            required
          />
        )}
        {mode === "edit" && user?.role?.roleName === 'Admin' && (
          <ThemeInput
            labelName="Password"
            type="password"
            value={formik.values.password || ""}
            onChange={(e) => formik.setFieldValue("password", e.target.value)}
            error={Boolean(formik.errors.password)}
            helperText={formik.errors.password}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
            required
          />
        )}
      </Stack>

      <Box display="flex" justifyContent="flex-end" gap={2}>
        <ThemeButton
          type="submit"
          sx={{
            background: mode === "add" ? "#7F56D9" : "#12B76A",
            "&:hover": { background: mode === "add" ? "#5B3FB4" : "#079455" },
          }}
          loading={formik.isSubmitting}
        >
          {formik.isSubmitting
            ? mode === "add"
              ? "Adding..."
              : "Saving..."
            : mode === "add"
              ? "Add Staff"
              : "Save Changes"}
        </ThemeButton>
        <ThemeButton
          sx={{
            background: "#D92D20",
            "&:hover": { background: "#B42318" },
          }}
          onClick={handleDiscard}
          disabled={formik.isSubmitting}
        >
          Discard Changes
        </ThemeButton>
      </Box>
    </Box>
  )
}

export default StaffView
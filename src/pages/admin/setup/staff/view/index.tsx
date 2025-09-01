"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Box, Stack, Typography, Chip, FormLabel, IconButton } from "@mui/material"
import { useFormik } from "formik"
import * as Yup from "yup"
import { toast } from "react-toastify"
import { useRouter } from "next/router"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import ThemeSelect from "@/component/common_component/themeselect"
import { useAppDispatch, useAppSelector } from "@/store"
import { getStaffByIdThunk, createStaffThunk, updateStaffThunk } from "@/store/slices/staffSlice"
import { getAllRolesThunk } from "@/store/slices/roleSlice"
import { deleteFileThunk } from "@/store/slices/fileUploadSlice" // Import deleteFileThunk
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName"
import FileUpload, { type FileUploadRef } from "@/component/reusablecomponents/FileUpload" // Adjust path if necessary
import { ArrowBack, Delete } from "@mui/icons-material" // Import Delete icon for chips
import { decryptData } from "@/utills/utills"
import StaffService from "@/services/staff.service"

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
  companyName: string;
  password?: string;
  aadharFiles: string[] // Array of file paths/URLs
  addressFiles: string[] // Array of file paths/URLs
}

interface RoleOption {
  label: string;
  value: string;
}

const validationSchema = Yup.object({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  // email: Yup.string().email("Invalid email").required("Email is required"),
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
  companyName: Yup.string().required("Company name is required"),
  password: Yup.string().when("mode", {
    is: "add",
    then: (schema) => schema.required("Password is required").min(8, "Password must be at least 8 characters"),
    otherwise: (schema) => schema.notRequired(),
  }),
  aadharFiles: Yup.array().of(Yup.string()).required("Aadhar files are required"), // Validation for file paths
  addressFiles: Yup.array().of(Yup.string()).optional(), // Validation for file paths
})

const StaffView = () => {
  const router = useRouter()
  const { mode, id } = router.query
  const dispatch = useAppDispatch()

  const { user } = useAppSelector((state) => state.auth)
  const { roles, loading: rolesLoading } = useAppSelector((state) => state.roles)
  const { staffList,currentStaff, loading: staffLoading } = useAppSelector((state) => state.staff)

  const aadharFileUploadRef = useRef<FileUploadRef>(null)
  const addressFileUploadRef = useRef<FileUploadRef>(null)
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([])
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null)
  const [selectedAadharFiles, setSelectedAadharFiles] = useState<File[]>([])
  const [selectedAddressFiles, setSelectedAddressFiles] = useState<File[]>([])
  const [existingAadharFiles, setExistingAadharFiles] = useState<string[]>([])
  const [existingAddressFiles, setExistingAddressFiles] = useState<string[]>([])

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
      companyName: "",
      password: "",
      aadharFiles: [], // Initialize empty
      addressFiles: [], // Initialize empty
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

        // Upload new Address files
        let uploadedAddressFilePaths: string[] = []
        if (selectedAddressFiles.length > 0 && addressFileUploadRef.current) {
          const uploaded = await addressFileUploadRef.current.uploadSelectedFiles()
          uploadedAddressFilePaths = uploaded.map((file) => file.path || file.url)
        }

        // Combine existing files with newly uploaded files
        const finalAadharFiles = [...existingAadharFiles, ...uploadedAadharFilePaths]
        const finalAddressFiles = [...existingAddressFiles, ...uploadedAddressFilePaths]

        const staffData = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email  || undefined,
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
          aadharFiles: finalAadharFiles, // Include file paths
          addressFiles: finalAddressFiles, // Include file paths
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

  console.log(staffList,'staffList')

  useEffect(() => {
    if (!roles.length) dispatch(getAllRolesThunk())
    if (mode === "edit" && id) dispatch(getStaffByIdThunk(id as string))
  }, [mode, id])

  useEffect(() => {
    if (roles.length > 0) {
      const options = roles.map((role) => ({
        label: role.roleName,
        value: role._id,
      }))
      setRoleOptions(options)
    }
  }, [roles])

  useEffect(() => {
    if (mode === "edit" && currentStaff) {
      const editData = {
        firstName: currentStaff.firstName || "",
        lastName: currentStaff.lastName || "",
        email: currentStaff.email ? currentStaff.email.toLowerCase() : "",
        mobileNo: currentStaff.mobileNo || "",
        mobileCode: currentStaff.mobileCode || "91",
        whatsappNo: currentStaff.whatsappNo || "",
        whatsappCode: currentStaff.whatsappCode || "91",
        address: currentStaff.address || "",
        aadharNo: currentStaff.aadharNo || "",
        joiningDate: currentStaff.joiningDate ? new Date(currentStaff.joiningDate).toISOString().split("T")[0] : "",
        birthDay: currentStaff.birthDay ? new Date(currentStaff.birthDay).toISOString().split("T")[0] : "",
        role: currentStaff.role?._id || "",
        companyName: currentStaff.companyName?._id || currentStaff.companyName?.companyName,
        password: user?.role?.roleName === 'Admin' && user?.role?.isDelete === false ? decryptData(currentStaff?.password) : "", // Password is not pre-filled for security
        aadharFiles: currentStaff.aadharFiles || [], // Populate existing files
        addressFiles: currentStaff.addressFiles || [], // Populate existing files
        mode: "edit",
      }
      const selected = roleOptions.find((opt) => opt.value === editData.role) || null
      formik.setValues(editData)
      setSelectedRole(selected)
      setExistingAadharFiles(currentStaff.aadharFiles || []) // Set existing files state
      setExistingAddressFiles(currentStaff.addressFiles || []) // Set existing files state
    } else if (mode === "add") {
      formik.setFieldValue("mode", "add")
      setSelectedRole(null)
      setExistingAadharFiles([]) // Clear existing files for add mode
      setExistingAddressFiles([]) // Clear existing files for add mode
    }
  }, [currentStaff, mode, roleOptions, user])

  const handleRoleChange = (event: React.SyntheticEvent, newValue: RoleOption | null) => {
    setSelectedRole(newValue)
    formik.setFieldValue("role", newValue?.value || "")
  }

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
    // Extract folder and filename from the path
    const parts = filePathToDelete.split("/")
    const folder = parts[parts.length - 2] // e.g., 'aadhar' or 'address'
    const filename = parts[parts.length - 1] // e.g., 'file-123.jpg'

    try {
      // Call backend to delete the file
      await dispatch(deleteFileThunk({ folder, filename })).unwrap()
      await StaffService.updateStaffAttachments(id, fileType === "aadhar" ? { aadharFiles: currentStaff?.aadharFiles?.filter((path) => path !== filePathToDelete) } : { addressFiles: currentStaff?.addressFiles?.filter((path) => path !== filePathToDelete) })
      toast.success(`File ${filename} deleted successfully.`)

      // Update local state and formik values
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
    if (mode === "edit" && currentStaff) {
      const editData = {
        firstName: currentStaff.firstName || "",
        lastName: currentStaff.lastName || "",
        email: currentStaff.email || "",
        mobileNo: currentStaff.mobileNo || "",
        mobileCode: currentStaff.mobileCode || "91",
        whatsappNo: currentStaff.whatsappNo || "",
        whatsappCode: currentStaff.whatsappCode || "91",
        address: currentStaff.address || "",
        aadharNo: currentStaff.aadharNo || "",
        joiningDate: currentStaff.joiningDate ? new Date(currentStaff.joiningDate).toISOString().split("T")[0] : "",
        birthDay: currentStaff.birthDay ? new Date(currentStaff.birthDay).toISOString().split("T")[0] : "",
        role: currentStaff.role?._id || "",
        companyName: currentStaff.CompanyName ? currentStaff.CompanyName._id : "",
        password: "",
        aadharFiles: currentStaff.aadharFiles || [],
        addressFiles: currentStaff.addressFiles || [],
        mode: "edit",
      }
      formik.setValues(editData)
      const selected = roleOptions.find((opt) => opt.value === editData.role) || null
      setSelectedRole(selected)
      setExistingAadharFiles(currentStaff.aadharFiles || [])
      setExistingAddressFiles(currentStaff.addressFiles || [])
    } else {
      formik.resetForm()
      setExistingAadharFiles([])
      setExistingAddressFiles([])
    }
    // Clear any newly selected files in the FileUpload components
    aadharFileUploadRef.current?.clearSelectedFiles()
    addressFileUploadRef.current?.clearSelectedFiles()
  }

  return (
    <Box sx={{ width: "100%" }} component="form" onSubmit={formik.handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <ThemeButton
          sx={{ backgroundColor: "#6366F1", borderRadius: "8px", color: "#fff" }}
          onClick={() => router.push("/admin/setup/staff")}
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
        <ThemeSelect
          label="Role"
          options={roleOptions}
          value={selectedRole}
          onChange={handleRoleChange}
          error={Boolean(formik.errors.role)}
          helperText={formik.errors.role}
          fullWidth
          required
        />

        <CompanySelect
          name="companyName"
          value={formik.values.companyName}
          onChange={(event, newValue) => {
            formik.setFieldValue("companyName", newValue ? newValue.value : "")
          }}
          error={Boolean(formik.errors.companyName)}
          helperText={formik.errors.companyName}
          required
        />
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

      {/* New: Aadhar File Upload */}
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
          label="Upload Aadhar Files" // You can remove this since we're adding our own label
          helperText="Upload Aadhar card images or PDF (required)"
          required
        />
      </Box>}
        {/* Display existing Aadhar files */}
        {existingAadharFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Existing Aadhar Files:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {existingAadharFiles.map((filePath, index) => {
                const fileName = filePath.split("/").pop();
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
                    {/* File name as clickable link */}
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

                    {/* Delete button */}
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

      {/* New: Address File Upload */}
      <Box mb={2}>
        {!existingAddressFiles.length && <FileUpload
          ref={addressFileUploadRef}
          folder="address" // Specific folder for Address files
          multiple={true}
          accept="image/*,.pdf" // Accept images and PDFs
          onFilesSelected={setSelectedAddressFiles}
          onUploadError={(errorMsg) => toast.error(errorMsg)}
          showPreview={true}
          showUploadButton={false} // Files will be uploaded on form submit
          autoUpload={false}
          label="Upload Address Files"
          helperText="Upload Address proof images or PDF "
        />}
        {/* Display existing Address files */}
        {existingAddressFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Existing Address Files:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {existingAddressFiles.map((filePath, index) => {
                const fileName = filePath.split("/").pop();
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
                    {/* File name as clickable link */}
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

                    {/* Delete button */}
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
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            width: 180,
            "&:hover": { background: mode === "add" ? "#5B3FB4" : "#079455" },
          }}
          // disabled={staffLoading || rolesLoading || formik.isSubmitting}
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
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            width: 180,
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

"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Box, Stack, CircularProgress, FormControlLabel, Checkbox, FormControl, FormLabel, RadioGroup, Radio } from "@mui/material"
import CustomDialog from "@/component/customdialog"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeSelect from "@/component/common_component/themeselect"
import ThemeButton from "@/component/common_component/themebutton"
import FileUpload, { type FileUploadRef } from "../reusablecomponents/FileUpload"
import CompanySelect from "../reusablecomponents/CompanyWithPartyName"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAccountMasterByCompanyAndPartyThunk } from "@/store/slices/accountMasterSlice"
import { getAllProductItemsThunk } from "@/store/slices/productItemSlice"
import { createOrderThunk, clearOrderError, clearOrderSuccessMessage } from "@/store/slices/orderSlice"
import { toast } from "react-toastify"

interface OptionType {
  label: string
  value: string
}

interface AddOrderDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
}

const AddOrderDialog: React.FC<AddOrderDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch()
  const fileUploadRef = useRef<FileUploadRef>(null)

  // Redux state
  const { productItems, loading: productLoading } = useAppSelector((state) => state.productItems)
  const { singleAccountMaster, loading: accountLoading } = useAppSelector((state) => state.accountMasters)
  const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders)

  const [formData, setFormData] = useState({
    companyName: "",
    partyName: "",
    personName: "",
    whatsapp: "",
    itemName: "",
    qty: "",
    gst: "",
    remarks: "",
    size: "", // New field
    rate: "", // New field
    rateType: "new", // New field: default to "new"
  })

  const [gstNotApplicable, setGstNotApplicable] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemOptions, setItemOptions] = useState<OptionType[]>([])

  // Clear messages when dialog opens
  useEffect(() => {
    if (open) {
      dispatch(clearOrderError())
      dispatch(clearOrderSuccessMessage())
      setGstNotApplicable(false)
    }
  }, [open, dispatch])

  // Handle success message
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      dispatch(clearOrderSuccessMessage())
    }
  }, [successMessage, dispatch])

  // Handle error message
  useEffect(() => {
    if (orderError) {
      toast.error(orderError)
      dispatch(clearOrderError())
    }
  }, [orderError, dispatch])

  // Fetch product items when dialog opens
  useEffect(() => {
    if (open) {
      dispatch(getAllProductItemsThunk())
    }
  }, [open, dispatch])

  // Set item options when product items are loaded
  useEffect(() => {
    if (productItems && productItems.length > 0) {
      const options = productItems.map((item) => ({
        label: item.itemName,
        value: item._id,
      }))
      setItemOptions(options)
    }
  }, [productItems])

  // Auto-fill form when account master data is loaded
  useEffect(() => {
    if (singleAccountMaster && singleAccountMaster.accountMaster) {
      const accountData = singleAccountMaster.accountMaster

      setFormData((prev) => ({
        ...prev,
        personName: accountData.party?.contactPerson || "",
        whatsapp: accountData.party?.personWhatsAppNo || "",
        gst: accountData.party?.GSTNo || "",
      }))
    }
  }, [singleAccountMaster])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGstCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGstNotApplicable(event.target.checked)
  }

  const handleCompanyChange = (event: any, newValue: any) => {
    const companyId = newValue ? newValue.value : ""
    handleChange("companyName", companyId)

    // Clear party name and auto-filled fields when company changes
    handleChange("partyName", "")
    handleChange("personName", "")
    handleChange("whatsapp", "")
    handleChange("gst", "")
    setGstNotApplicable(false)
  }

  const handlePartyChange = async (event: any, newValue: any) => {
    const partyId = newValue ? newValue.value : ""
    handleChange("partyName", partyId)

    if (formData.companyName && partyId) {
      try {
        await dispatch(
          getAccountMasterByCompanyAndPartyThunk({
            companyId: formData.companyName,
            partyId: partyId,
          })
        ).unwrap()
      } catch (error) {
        console.error("Failed to fetch account master data:", error)
        toast.error("Failed to load party details")
      }
    }
  }

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
  }

  const handleUploadError = (error: string) => {
    toast.error(error)
  }

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.partyName || !formData.itemName || !formData.qty) {
      toast.error("Please fill all required fields")
      return
    }

    if (Number.parseInt(formData.qty) <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }

    setIsSubmitting(true)

    try {
      let filePaths: string[] = []

      if (selectedFiles.length > 0 && fileUploadRef.current) {
        const uploadedFiles = await fileUploadRef.current.uploadSelectedFiles()
        filePaths = uploadedFiles.map((file) => file.path || file.url)
      }

      const orderData = {
        companyName: formData.companyName,
        party: formData.partyName,
        productItem: formData.itemName,
        qty: Number.parseInt(formData.qty),
        remarks: formData.remarks || "",
        filePaths: filePaths,
        gstStatus: gstNotApplicable ? "Not Applicable" : "Applicable",
        gstNumber: gstNotApplicable ? "" : formData.gst,
        isGst: !gstNotApplicable,
        size: formData.size || "", // Include size
        rate: formData.rate ? Number.parseFloat(formData.rate) : undefined, // Include rate (optional)
        rateType: formData.rate ? formData.rateType : undefined, // Include rateType only if rate is provided
      }

      await dispatch(createOrderThunk(orderData)).unwrap()

      if (refreshData) refreshData()
      resetForm()
      onClose()
    } catch (error: any) {
      console.error("Order creation error:", error)
      toast.error(error?.message || "Failed to create order")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      companyName: "",
      partyName: "",
      personName: "",
      whatsapp: "",
      itemName: "",
      qty: "",
      gst: "",
      remarks: "",
      size: "",
      rate: "",
      rateType: "new",
    })
    setGstNotApplicable(false)
    setSelectedFiles([])
    if (fileUploadRef.current) {
      fileUploadRef.current.clearSelectedFiles()
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const getSelectedOption = (value: string, options: OptionType[]) => {
    return options.find((option) => option.value === value) || null
  }

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="Place New Order">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Box mb={2}>
          <CompanySelect
            name="companyName"
            value={formData.companyName}
            onChange={handleCompanyChange}
            hasParties={true}
            required
            showPartyName={true}
            partyName={formData.partyName}
            onPartyChange={handlePartyChange}
          />
        </Box>

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="Person Name"
            placeholder="Person"
            fullWidth
            value={formData.personName}
            onChange={(e) => handleChange("personName", e.target.value)}
            disabled={!!singleAccountMaster}
            sx={{
              "& .MuiInputBase-input": {
                backgroundColor: singleAccountMaster ? "#f5f5f5" : "transparent",
              },
            }}
          />
          <ThemeInput
            labelName="WhatsApp no."
            placeholder="98233-12342"
            fullWidth
            value={formData.whatsapp}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
            disabled={!!singleAccountMaster}
            sx={{
              "& .MuiInputBase-input": {
                backgroundColor: singleAccountMaster ? "#f5f5f5" : "transparent",
              },
            }}
          />
        </Stack>

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="Item Name"
            value={getSelectedOption(formData.itemName, itemOptions)}
            options={itemOptions}
            onChange={(_, v) => handleChange("itemName", v ? v.value : "")}
            disabled={productLoading}
            required
          />
          <ThemeInput
            labelName="Qty"
            placeholder="200"
            fullWidth
            type="number"
            value={formData.qty}
            onChange={(e) => handleChange("qty", e.target.value)}
            required
          />
          <ThemeInput
            labelName="Size"
            placeholder="Enter size (e.g., A4)"
            fullWidth
            value={formData.size}
            onChange={(e) => handleChange("size", e.target.value)}
          />
        </Stack>

        <Stack direction="row" spacing={2} mb={2}>
          <Box sx={{ width: "100%" }}>
            <ThemeInput
              labelName="Rate"
              placeholder="Enter rate"
              fullWidth
              type="number"
              value={formData.rate}
              onChange={(e) => handleChange("rate", e.target.value)}
            />
            {formData.rate && (
              <FormControl component="fieldset" sx={{ mt: 1 }}>
                <FormLabel component="legend">Rate Type</FormLabel>
                <RadioGroup
                  row
                  value={formData.rateType}
                  onChange={(e) => handleChange("rateType", e.target.value)}
                >
                  <FormControlLabel value="old" control={<Radio />} label="Old Rate" />
                  <FormControlLabel value="new" control={<Radio />} label="New Rate" />
                </RadioGroup>
              </FormControl>
            )}
          </Box>
          <Box sx={{ width: "100%" }}>
            <ThemeInput
              labelName="GST Number"
              placeholder="Enter GST number"
              fullWidth
              value={gstNotApplicable ? "Not Applicable" : formData.gst}
              onChange={(e) => {}}
              disabled={true}
              sx={{
                "& .MuiInputBase-input": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            />
          </Box>
        </Stack>

        <ThemeInput
          labelName="Remarks"
          placeholder="Enter Remarks"
          fullWidth
          value={formData.remarks}
          onChange={(e) => handleChange("remarks", e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <FileUpload
            ref={fileUploadRef}
            folder="orders"
            multiple={true}
            accept="*/*"
            variant="dropzone"
            onFilesSelected={handleFilesSelected}
            onUploadError={handleUploadError}
            showPreview={false}
            showUploadButton={false}
            autoUpload={false}
            label="Attach Order Files"
            helperText="Select order documents, images, or any related files"
          />
        </Box>

        <ThemeButton
          onClick={handleSubmit}
          disabled={isSubmitting || accountLoading || productLoading || orderLoading}
          sx={{
            background: "#12B76A",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            width: "100%",
            mt: 1,
            "&:hover": { background: "#079455" },
            "&:disabled": {
              background: "#ccc",
              color: "#666",
            },
          }}
        >
          {isSubmitting || orderLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Creating Order...
            </Box>
          ) : accountLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Loading Party Details...
            </Box>
          ) : (
            "Place New Order"
          )}
        </ThemeButton>
      </Box>
    </CustomDialog>
  )
}

export default AddOrderDialog
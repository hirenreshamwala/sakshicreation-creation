"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Box, Stack, CircularProgress, FormControlLabel, Checkbox, FormControl, FormLabel, RadioGroup, Radio, InputLabel, MenuItem, Select, Typography, Switch } from "@mui/material"
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
import { printerTypeOption } from "@/constants"
import { getAllBinderTypesThunk } from "@/store/slices/binderTypeSlice"
import { getAllCompaniesThunk } from "@/store/slices/compnaySlice"
import { createQpOrderThunk } from "@/store/slices/qpOrderSlice"
import { getAllPackagingOptionsThunk } from "@/store/slices/packagingOptionSlice"

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
  const { packagingOptions } = useAppSelector((state) => state.packagingOptions);
  const { companies } = useAppSelector((state) => state.company)
  const { productItems, loading: productLoading } = useAppSelector((state) => state.productItems)
  const { singleAccountMaster, loading: accountLoading }:any = useAppSelector((state) => state.accountMasters)
  const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders)
  const { binderTypes } = useAppSelector((state) => state.binderType);

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gstNotApplicable, setGstNotApplicable] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [itemOptions, setItemOptions] = useState<OptionType[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>("")

  // Sakshi Creation form data
  const [sakshiFormData, setSakshiFormData] = useState({
    companyName: "",
    partyName: "",
    personName: "",
    whatsapp: "",
    binding: false,
    bindingType: "",
    itemName: "",
    qty: "",
    gst: "",
    remarks: "",
    pType: "",
    size: "",
    rate: "",
    rateType: "new",
  })

  // Quality Packaging form data
  const [qpFormData, setQpFormData] = useState({
    companyName: "",
    partyName: "",
    date: "",
    orderFrom: "",
    size: null,
    ply: null,
    gsm: null,
    deckal: "",
    rate: "",
    dyeNumber: "",
    dyeSize: "",
    dySheetSize: "",
    dyeRemark: "",
    godownRemark: "",
    factoryRemark: "",
    delivery: ""
  })

  // Determine which form to show based on selected company
  const isQualityPackaging = selectedCompany === companies?.find((item) => item?.companyName?.toLowerCase() === 'quality packaging')?._id
  const isSakshiCreation = selectedCompany === companies?.find((item) => item?.companyName?.toLowerCase() === 'sakshi creation')?._id // Replace with actual ID

  // Clear messages when dialog opens
  useEffect(() => {
    if (open) {
      dispatch(clearOrderError())
      dispatch(clearOrderSuccessMessage())
      setGstNotApplicable(false)
      setSelectedCompany("")
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

  useEffect(() => {
    if (!binderTypes.length) dispatch(getAllBinderTypesThunk());
    if (!companies.length) dispatch(getAllCompaniesThunk())
    if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk());
  }, []);

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

      if (isSakshiCreation) {
        setSakshiFormData((prev) => ({
          ...prev,
          personName: accountData.party?.contactPerson || "",
          whatsapp: accountData.party?.personWhatsAppNo || "",
          gst: accountData.party?.GSTNo || "",
        }))
      }
    }
  }, [singleAccountMaster, isSakshiCreation])

  const handleSakshiChange = (field: string, value: any) => {
    setSakshiFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleQpChange = (field: string, value: any) => {
    setQpFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGstCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGstNotApplicable(event.target.checked)
  }

  const handleCompanyChange = (event: any, newValue: any) => {
    const companyId = newValue ? newValue.value : ""
    const companyLabel = newValue ? newValue.label : ""
    console.log(companyId, 'niskjhdoihnj')

    setSelectedCompany(companyId)

    // Update both form company fields
    handleSakshiChange("companyName", companyId)
    handleQpChange("companyName", companyId)

    // Clear party name and auto-filled fields when company changes
    handleSakshiChange("partyName", "")
    handleSakshiChange("personName", "")
    handleSakshiChange("whatsapp", "")
    handleSakshiChange("gst", "")
    handleQpChange("partyName", "")
    setGstNotApplicable(false)
  }

  const handlePartyChange = async (event: any, newValue: any) => {
    const partyId = newValue ? newValue.value : ""

    // Update both form party fields
    handleSakshiChange("partyName", partyId)
    handleQpChange("partyName", partyId)

    if (selectedCompany && partyId) {
      try {
        await dispatch(
          getAccountMasterByCompanyAndPartyThunk({
            companyId: selectedCompany,
            partyId: partyId,
          })
        ).unwrap()
      } catch (error) {
        console.error("Failed to fetch account master data:", error)
        toast.error("Failed to load party details")
      }
    }
  }

  const handleFilesSelected = (files: File[]) =>  setSelectedFiles(files)

  const handleUploadError = (error: string) => toast.error(error)

  const handleSubmit = async () => {
    if (isSakshiCreation) {
      await handleSakshiSubmit()
    } else if (isQualityPackaging) {
      await handleQpSubmit()
    } else {
      toast.error("Please select a valid company")
    }
  }

  const handleSakshiSubmit = async () => {
    if (!sakshiFormData.companyName || !sakshiFormData.partyName || !sakshiFormData.itemName || !sakshiFormData.qty) {
      toast.error("Please fill all required fields")
      return
    }

    if (Number.parseInt(sakshiFormData.qty) <= 0) {
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
        companyName: sakshiFormData.companyName,
        party: sakshiFormData.partyName,
        pType: sakshiFormData.pType,
        binding: sakshiFormData.binding,
        bindingType: sakshiFormData.bindingType,
        productItem: sakshiFormData.itemName,
        qty: Number.parseInt(sakshiFormData.qty),
        remarks: sakshiFormData.remarks || "",
        filePaths: filePaths,
        gstStatus: gstNotApplicable ? "Not Applicable" : "Applicable",
        gstNumber: gstNotApplicable ? "" : sakshiFormData.gst,
        isGst: !gstNotApplicable,
        size: sakshiFormData.size || "",
        rate: sakshiFormData.rate ? Number.parseFloat(sakshiFormData.rate) : undefined,
        rateType: sakshiFormData.rate ? sakshiFormData.rateType : undefined,
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

  const handleQpSubmit = async () => {
    if (!qpFormData.companyName || !qpFormData.partyName) {
      toast.error("Please fill all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        isQp: true,
        companyName: qpFormData.companyName,
        party: qpFormData.partyName,
        date: qpFormData.date,
        orderFrom: qpFormData.orderFrom,
        size: qpFormData.size,
        ply: qpFormData.ply,
        gsm: qpFormData.gsm,
        deckal: qpFormData.deckal,
        rate: qpFormData.rate,
        dyeNumber: qpFormData.dyeNumber,
        dyeSize: qpFormData.dyeSize,
        dySheetSize: qpFormData.dySheetSize,
        dyeRemark: qpFormData.dyeRemark,
        godownRemark: qpFormData.godownRemark,
        factoryRemark: qpFormData.factoryRemark,
        delivery: qpFormData.delivery
      }

      await dispatch(createQpOrderThunk(orderData as any)).unwrap()

      if (refreshData) refreshData()
      resetForm()
      onClose()
    } catch (error: any) {
      console.error("QP Order creation error:", error)
      toast.error(error?.message || "Failed to create QP order")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSakshiFormData({
      companyName: "",
      partyName: "",
      personName: "",
      whatsapp: "",
      itemName: "",
      qty: "",
      gst: "",
      bindingType: "",
      pType: "",
      binding: false,
      remarks: "",
      size: "",
      rate: "",
      rateType: "new",
    })
    setQpFormData({
      companyName: "",
      partyName: "",
      date: "",
      orderFrom: "",
      size: null,
      ply: null,
      gsm: null,
      deckal: "",
      rate: "",
      dyeNumber: "",
      dyeSize: "",
      dySheetSize: "",
      dyeRemark: "",
      godownRemark: "",
      factoryRemark: "",
      delivery: ""
    })
    setGstNotApplicable(false)
    setSelectedFiles([])
    setSelectedCompany("")
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

  const renderSakshiForm = () => (
    <>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeInput
          labelName="Person Name"
          placeholder="Person"
          fullWidth
          value={sakshiFormData.personName}
          onChange={(e) => handleSakshiChange("personName", e.target.value)}
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
          value={sakshiFormData.whatsapp}
          onChange={(e) => handleSakshiChange("whatsapp", e.target.value)}
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
          value={getSelectedOption(sakshiFormData.itemName, itemOptions)}
          options={itemOptions}
          onChange={(_, v) => handleSakshiChange("itemName", v ? v.value : "")}
          disabled={productLoading}
          required
        />
        <ThemeInput
          labelName="Item Size"
          placeholder="Enter size (e.g., A4)"
          fullWidth
          value={sakshiFormData.size}
          onChange={(e) => handleSakshiChange("size", e.target.value)}
        />
        <ThemeInput
          labelName="Item Qty"
          placeholder="200"
          fullWidth
          type="number"
          value={sakshiFormData.qty}
          onChange={(e) => handleSakshiChange("qty", e.target.value)}
          required
        />
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <FormControlLabel
          control={
            <Switch
              checked={sakshiFormData.binding}
              onChange={(e) => handleSakshiChange("binding", e.target.checked)}
              color="primary"
            />
          }
          label="Binding"
        />
        {sakshiFormData.binding ? <ThemeSelect
          label="Binding Type"
          value={getSelectedOption(sakshiFormData.bindingType, binderTypes?.map((item) => ({ value: item?._id, label: item?.name })) || [])}
          options={binderTypes?.map((item) => ({ value: item?._id, label: item?.name })) || []}
          onChange={(_, v) => { handleSakshiChange("bindingType", v ? v.value : "") }}
          required
        /> : null}
        <ThemeSelect
          label="Printing Type"
          value={getSelectedOption(sakshiFormData.pType, printerTypeOption)}
          options={printerTypeOption}
          onChange={(_, v) => handleSakshiChange("pType", v ? v.value : "")}
          required
        />
      </Stack>

      <Stack direction="row" spacing={2} mb={2}>
        <Box sx={{ width: "100%" }}>
          <ThemeInput
            labelName="Rate"
            placeholder="Enter rate"
            fullWidth
            type="number"
            value={sakshiFormData.rate}
            onChange={(e) => handleSakshiChange("rate", e.target.value)}
          />
          {sakshiFormData.rate && (
            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <FormLabel component="legend">Rate Type</FormLabel>
              <RadioGroup
                row
                value={sakshiFormData.rateType}
                onChange={(e) => handleSakshiChange("rateType", e.target.value)}
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
            value={gstNotApplicable ? "Not Applicable" : sakshiFormData.gst}
            onChange={(e) => { }}
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
        value={sakshiFormData.remarks}
        onChange={(e) => handleSakshiChange("remarks", e.target.value)}
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
    </>
  )

  const renderQpForm = () => (
    <>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeInput
          labelName="Order From"
          placeholder="Order From"
          fullWidth
          value={qpFormData.orderFrom}
          onChange={(e) => handleQpChange("orderFrom", e.target.value)}
        />
        <ThemeInput
          labelName="Date"
          placeholder="Date"
          fullWidth
          type="date"
          value={qpFormData.date}
          onChange={(e) => handleQpChange("date", e.target.value)}
        />
        <ThemeSelect
          label="Ply"
          options={packagingOptions?.map((item: any) => ({ value: item?._id, label: item?.ply }))}
          value={packagingOptions?.map((item: any) => ({ value: item?._id, label: item?.ply }))?.find((item) => item.value === qpFormData.ply)}
          onChange={(e, val: any) => {
            handleQpChange("ply", val.value)
            handleQpChange("size", null)
            handleQpChange("gsm", null)
            handleQpChange("deckal", null)
          }}
          name="ply"
        // error={error}
        // helperText={helperText}
        // required={required}
        />
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeSelect
          label="Size"
          options={packagingOptions?.filter((item) => item._id !== qpFormData.ply)?.map((item: any) => ({ value: item?._id, label: item?.size }))}
          value={packagingOptions?.filter((item) => item._id !== qpFormData.ply)?.map((item: any) => ({ value: item?._id, label: item?.size }))?.find((item) => item.value === qpFormData.size)}
          onChange={(e, val: any) => {
            handleQpChange("size", val.value)
            handleQpChange("gsm", null)
            handleQpChange("deckal", null)
          }}
          name="size"
        // error={error}
        // helperText={helperText}
        // required={required}
        />
        <ThemeSelect
          label="GSM"
          options={packagingOptions?.filter((item) => item._id !== qpFormData.size)?.map((item: any) => ({ value: item?._id, label: item?.gsm }))}
          value={packagingOptions?.filter((item) => item._id !== qpFormData.size)?.map((item: any) => ({ value: item?._id, label: item?.gsm }))?.find((item) => item.value === qpFormData.gsm)}
          onChange={(e, val: any) => {
            handleQpChange("gsm", val.value)
            handleQpChange("deckal", null)
          }}
          name="size"
        // error={error}
        // helperText={helperText}
        // required={required}
        />

      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeSelect
          label="Deckal"
          options={packagingOptions?.filter((item) => item._id !== qpFormData.gsm)?.map((item: any) => ({ value: item?._id, label: item?.deckal }))}
          value={packagingOptions?.filter((item) => item._id !== qpFormData.gsm)?.map((item: any) => ({ value: item?._id, label: item?.deckal }))?.find((item) => item.value === qpFormData.deckal)}
          onChange={(e, val: any) => {
            handleQpChange("deckal", val.value)
          }}
          name="size"
        // error={error}
        // helperText={helperText}
        // required={required}
        />
        <ThemeInput
          labelName="Rate"
          placeholder="Rate"
          fullWidth
          value={qpFormData.rate}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
            handleQpChange("rate", numericValue)
          }}
        />
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeInput
          labelName="DYE Number"
          placeholder="Dye Number"
          fullWidth
          value={qpFormData.dyeNumber}
          onChange={(e) => handleQpChange("dyeNumber", e.target.value)}
        />
        <ThemeInput
          labelName="DYE Size"
          placeholder="Dye Size"
          fullWidth
          value={qpFormData.dyeSize}
          onChange={(e) => handleQpChange("dyeSize", e.target.value)}
        />
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeInput
          labelName="DYE Sheet Size"
          placeholder="DYE Sheet Size"
          fullWidth
          value={qpFormData.dySheetSize}
          onChange={(e) => handleQpChange("dySheetSize", e.target.value)}
        />
        <ThemeInput
          labelName="DYE Remark"
          placeholder="DYE Remark"
          fullWidth
          value={qpFormData.dyeRemark}
          onChange={(e) => handleQpChange("dyeRemark", e.target.value)}
        />
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeInput
          labelName="Godown Remark"
          placeholder="Godown Remark"
          fullWidth
          value={qpFormData.godownRemark}
          onChange={(e) => handleQpChange("godownRemark", e.target.value)}
        />
        <ThemeInput
          labelName="Factory Remark"
          placeholder="Factory Remark"
          fullWidth
          value={qpFormData.factoryRemark}
          onChange={(e) => handleQpChange("factoryRemark", e.target.value)}
        />
      </Stack>

      <ThemeInput
        labelName="Delivery"
        placeholder="Delivery"
        fullWidth
        value={qpFormData.delivery}
        onChange={(e) => handleQpChange("delivery", e.target.value)}
        sx={{ mb: 2 }}
      />
    </>
  )

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="Place New Order">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Box mb={2}>
          <CompanySelect
            name="companyName"
            value={selectedCompany}
            onChange={handleCompanyChange}
            hasParties={true}
            required
            showPartyName={true}
            partyName={isSakshiCreation ? sakshiFormData.partyName : qpFormData.partyName}
            onPartyChange={handlePartyChange}
          />
        </Box>

        {isSakshiCreation && renderSakshiForm()}
        {isQualityPackaging && renderQpForm()}

        {!selectedCompany && (
          <Typography variant="body1" color="textSecondary" textAlign="center" py={4}>
            Please select a company to show the appropriate form
          </Typography>
        )}

        <ThemeButton
          onClick={handleSubmit}
          disabled={isSubmitting || accountLoading || productLoading || orderLoading || !selectedCompany}
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
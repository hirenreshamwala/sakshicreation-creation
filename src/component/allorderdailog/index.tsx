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
import { getAllKantansThunk } from "@/store/slices/kantanSlice"

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
  const { packagingOptions } = useAppSelector((state) => state.packagingOptions)
  const { kantans } = useAppSelector((state) => state.kantans)
  const { companies } = useAppSelector((state) => state.company)
  const { productItems, loading: productLoading } = useAppSelector((state) => state.productItems)
  const { singleAccountMaster, loading: accountLoading }: any = useAppSelector((state) => state.accountMasters)
  const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders)
  const { binderTypes } = useAppSelector((state) => state.binderType)

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
    bindingType: null as string | null,
    itemName: "",
    qty: "",
    gst: "",
    remarks: "",
    pType: "",
    size: "",
    rate: "",
    rateType: "new",
    color: "",
    number: "",
    endNumber: "",
    startNumber: ""
  })

  // Quality Packaging form data
  const [qpFormData, setQpFormData] = useState({
    companyName: "",
    partyName: "",
    date: "",
    orderFrom: "",
    name: "",
    ply: "",
    length: "",
    width: "",
    height: "",
    gsm: "",
    deckal: "",
    noOfPieces: "",
    ratePerPiece: "",
    amount: "",
    kgPerUnit: "",
    totalKg: "",
    kantan: null as string | null,
    kantanDeckal: "",
    salesRemark: "",
  })

  // Determine which form to show based on selected company
  const isQualityPackaging = selectedCompany === companies?.find((item) => item?.companyName?.toLowerCase() === 'quality packaging')?._id
  const isSakshiCreation = selectedCompany === companies?.find((item) => item?.companyName?.toLowerCase() === 'sakshi creation')?._id

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
    if (!binderTypes.length) dispatch(getAllBinderTypesThunk())
    if (!companies.length) dispatch(getAllCompaniesThunk())
    if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk())
    if (!kantans.length) dispatch(getAllKantansThunk())
  }, [dispatch])

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

  const handleFilesSelected = (files: File[]) => setSelectedFiles(files)

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
        number: sakshiFormData.number,
        endNumber: sakshiFormData.endNumber,
        startNumber: sakshiFormData.startNumber,
        color: sakshiFormData.color
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
      toast.error("Please fill all required fields (Company Name and Party Name)")
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        isQp: true,
        companyName: qpFormData.companyName,
        party: qpFormData.partyName,
        date: qpFormData.date || undefined,
        orderFrom: qpFormData.orderFrom || undefined,
        name: qpFormData.name || undefined,
        ply: qpFormData.ply || undefined,
        length: qpFormData.length || undefined,
        width: qpFormData.width || undefined,
        height: qpFormData.height || undefined,
        gsm: qpFormData.gsm || undefined,
        deckal: qpFormData.deckal || undefined,
        noOfPieces: qpFormData.noOfPieces ? Number(qpFormData.noOfPieces) : undefined,
        ratePerPiece: qpFormData.ratePerPiece ? Number(qpFormData.ratePerPiece) : undefined,
        amount: qpFormData.amount ? Number(qpFormData.amount) : undefined,
        kgPerUnit: qpFormData.kgPerUnit ? Number(qpFormData.kgPerUnit) : undefined,
        totalKg: qpFormData.totalKg ? Number(qpFormData.totalKg) : undefined,
        kantan: qpFormData.kantan || undefined,
        kantanDeckal: qpFormData.kantanDeckal || undefined,
        salesRemark: qpFormData.salesRemark || undefined,
      }

      await dispatch(createQpOrderThunk(orderData)).unwrap()

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
      color: "",
      number: "",
      endNumber: "",
      startNumber: ""
    })
    setQpFormData({
      companyName: "",
      partyName: "",
      date: "",
      orderFrom: "",
      name: "",
      ply: "",
      length: "",
      width: "",
      height: "",
      gsm: "",
      deckal: "",
      noOfPieces: "",
      ratePerPiece: "",
      amount: "",
      kgPerUnit: "",
      totalKg: "",
      kantan: null,
      kantanDeckal: "",
      salesRemark: "",
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

  // Helper functions to get unique values for dropdowns with dynamic filtering
  const getUniqueNameOptions = () => {
    const uniqueNames = [...new Set(packagingOptions.map((item: any) => item.name))].sort()
    return uniqueNames.map((name) => {
      const option = packagingOptions.find((item: any) => item.name === name)
      return { value: option?._id || "", label: name }
    }).filter(option => option.value)
  }

  const getUniquePlyOptions = () => {
    const filteredOptions = packagingOptions.filter(
      (item: any) =>
        (!qpFormData.name || item.name === packagingOptions.find((opt: any) => opt._id === qpFormData.name)?.name) &&
        (!qpFormData.length || item.length === packagingOptions.find((opt: any) => opt._id === qpFormData.length)?.length) &&
        (!qpFormData.width || item.width === packagingOptions.find((opt: any) => opt._id === qpFormData.width)?.width) &&
        (!qpFormData.height || item.height === packagingOptions.find((opt: any) => opt._id === qpFormData.height)?.height)
    )
    const uniquePlies = [...new Set(filteredOptions.map((item: any) => item.ply))].sort()
    return uniquePlies.map((ply) => {
      const option = filteredOptions.find((item: any) => item.ply === ply)
      return { value: option?._id || "", label: `${ply}` }
    }).filter(option => option.value)
  }

  const getUniqueLengthOptions = () => {
    const filteredOptions = packagingOptions.filter(
      (item: any) =>
        (!qpFormData.name || item.name === packagingOptions.find((opt: any) => opt._id === qpFormData.name)?.name) &&
        (!qpFormData.ply || item.ply === packagingOptions.find((opt: any) => opt._id === qpFormData.ply)?.ply) &&
        (!qpFormData.width || item.width === packagingOptions.find((opt: any) => opt._id === qpFormData.width)?.width) &&
        (!qpFormData.height || item.height === packagingOptions.find((opt: any) => opt._id === qpFormData.height)?.height)
    )
    const uniqueLengths = [...new Set(filteredOptions.map((item: any) => item.length))].sort()
    return uniqueLengths.map((length) => {
      const option = filteredOptions.find((item: any) => item.length === length)
      return { value: option?._id || "", label: length }
    }).filter(option => option.value)
  }

  const getUniqueWidthOptions = () => {
    const filteredOptions = packagingOptions.filter(
      (item: any) =>
        (!qpFormData.name || item.name === packagingOptions.find((opt: any) => opt._id === qpFormData.name)?.name) &&
        (!qpFormData.ply || item.ply === packagingOptions.find((opt: any) => opt._id === qpFormData.ply)?.ply) &&
        (!qpFormData.length || item.length === packagingOptions.find((opt: any) => opt._id === qpFormData.length)?.length) &&
        (!qpFormData.height || item.height === packagingOptions.find((opt: any) => opt._id === qpFormData.height)?.height)
    )
    const uniqueWidths = [...new Set(filteredOptions.map((item: any) => item.width))].sort()
    return uniqueWidths.map((width) => {
      const option = filteredOptions.find((item: any) => item.width === width)
      return { value: option?._id || "", label: width }
    }).filter(option => option.value)
  }

  const getUniqueHeightOptions = () => {
    const filteredOptions = packagingOptions.filter(
      (item: any) =>
        (!qpFormData.name || item.name === packagingOptions.find((opt: any) => opt._id === qpFormData.name)?.name) &&
        (!qpFormData.ply || item.ply === packagingOptions.find((opt: any) => opt._id === qpFormData.ply)?.ply) &&
        (!qpFormData.length || item.length === packagingOptions.find((opt: any) => opt._id === qpFormData.length)?.length) &&
        (!qpFormData.width || item.width === packagingOptions.find((opt: any) => opt._id === qpFormData.width)?.width)
    )
    const uniqueHeights = [...new Set(filteredOptions.map((item: any) => item.height))].sort()
    return uniqueHeights.map((height) => {
      const option = filteredOptions.find((item: any) => item.height === height)
      return { value: option?._id || "", label: height }
    }).filter(option => option.value)
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
        {sakshiFormData.binding ? (
          <ThemeSelect
            label="Binding Type"
            value={getSelectedOption(sakshiFormData.bindingType, binderTypes?.map((item) => ({ value: item?._id, label: item?.name })) || [])}
            options={binderTypes?.map((item) => ({ value: item?._id, label: item?.name })) || []}
            onChange={(_, v) => handleSakshiChange("bindingType", v ? v.value : "")}
            required
          />
        ) : null}
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
      <Stack direction="row" spacing={2}>
        <FormControl sx={{ flex: 1, minWidth: 120 }}>
          <InputLabel id="color-label">Color</InputLabel>
          <Select
            labelId="color-label"
            name="color"
            value={sakshiFormData.color}
            onChange={(e) => handleSakshiChange("color", e.target.value)}
            label="Color"
          >
            <MenuItem value="">Select</MenuItem>
            {[1, 2, 4, 6].map((num) => (
              <MenuItem key={num} value={num.toString()}>
                color - {num}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ flex: 1, minWidth: 120 }}>
          <InputLabel id="number-label">Number</InputLabel>
          <Select
            labelId="number-label"
            name="number"
            value={sakshiFormData.number}
            onChange={(e) => handleSakshiChange("number", e.target.value)}
            label="Number"
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {sakshiFormData.number === 'Yes' ? (
        <Stack direction="row" spacing={2}>
          <ThemeInput
            labelName="Start Number"
            name="startNumber"
            value={sakshiFormData.startNumber}
            onChange={(e) => handleSakshiChange("startNumber", e.target.value)}
            sx={{ flex: 1, minWidth: 120 }}
          />
          <ThemeInput
            labelName="End Number"
            name="endNumber"
            value={sakshiFormData.endNumber}
            onChange={(e) => handleSakshiChange("endNumber", e.target.value)}
            sx={{ flex: 1, minWidth: 120 }}
          />
        </Stack>
      ) : null}

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
        <ThemeSelect
          label="Name"
          options={getUniqueNameOptions()}
          value={getSelectedOption(qpFormData.name, getUniqueNameOptions())}
          onChange={(_, val: any) => handleQpChange("name", val?.value || "")}
          name="name"
        />
        <ThemeSelect
          label="Ply"
          options={getUniquePlyOptions()}
          value={getSelectedOption(qpFormData.ply, getUniquePlyOptions())}
          onChange={(_, val: any) => handleQpChange("ply", val?.value || "")}
          name="ply"
        />
        <ThemeSelect
          label="Sheet Length"
          options={getUniqueLengthOptions()}
          value={getSelectedOption(qpFormData.length, getUniqueLengthOptions())}
          onChange={(_, val: any) => handleQpChange("length", val?.value || "")}
          name="length"
        />
        <ThemeSelect
          label="Sheet Width"
          options={getUniqueWidthOptions()}
          value={getSelectedOption(qpFormData.width, getUniqueWidthOptions())}
          onChange={(_, val: any) => handleQpChange("width", val?.value || "")}
          name="width"
        />
        <ThemeSelect
          label="Sheet Height"
          options={getUniqueHeightOptions()}
          value={getSelectedOption(qpFormData.height, getUniqueHeightOptions())}
          onChange={(_, val: any) => handleQpChange("height", val?.value || "")}
          name="height"
        />
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeInput
          labelName="GSM"
          placeholder="GSM"
          fullWidth
          value={qpFormData.gsm}
          onChange={(e) => handleQpChange("gsm", e.target.value)}
        />
        <ThemeInput
          labelName="Deckal"
          placeholder="Deckal"
          fullWidth
          value={qpFormData.deckal}
          onChange={(e) => handleQpChange("deckal", e.target.value)}
        />
        <ThemeInput
          labelName="No of Pieces"
          placeholder="No of Pieces"
          fullWidth
          value={qpFormData.noOfPieces}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
            handleQpChange("noOfPieces", numericValue)
          }}
        />
        <ThemeInput
          labelName="Rate Per Piece"
          placeholder="Rate Per Piece"
          fullWidth
          value={qpFormData.ratePerPiece}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
            handleQpChange("ratePerPiece", numericValue)
          }}
        />
        <ThemeInput
          labelName="Amount"
          placeholder="Amount"
          fullWidth
          value={qpFormData.amount}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
            handleQpChange("amount", numericValue)
          }}
        />
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeInput
          labelName="KG Per Unit"
          placeholder="KG Per Unit"
          fullWidth
          value={qpFormData.kgPerUnit}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
            handleQpChange("kgPerUnit", numericValue)
          }}
        />
        <ThemeInput
          labelName="Total KG"
          placeholder="Total KG"
          fullWidth
          value={qpFormData.totalKg}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
            handleQpChange("totalKg", numericValue)
          }}
        />
        <ThemeSelect
          label="Kantan"
          options={kantans?.map((item: any) => ({ value: item?._id, label: item?.kantanName }))}
          value={kantans?.map((item: any) => ({ value: item?._id, label: item?.kantanName }))?.find((item) => item.value === qpFormData.kantan) || null}
          onChange={(_, val: any) => handleQpChange("kantan", val?.value || null)}
          name="kantan"
        />
        <ThemeInput
          labelName="Kantan Deckal"
          placeholder="Kantan Deckal"
          fullWidth
          value={qpFormData.kantanDeckal}
          onChange={(e) => handleQpChange("kantanDeckal", e.target.value)}
        />
      </Stack>
      <ThemeInput
        labelName="Sales Remarks"
        placeholder="Sales Remarks"
        fullWidth
        value={qpFormData.salesRemark}
        onChange={(e) => handleQpChange("salesRemark", e.target.value)}
        sx={{ mb: 2 }}
        multiline
        rows={3}
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

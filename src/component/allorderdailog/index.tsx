"use client"
import type React from "react"
import { useRef, useState, useEffect, useMemo } from "react"
import { Box, Stack, CircularProgress, FormControlLabel, FormControl, FormLabel, RadioGroup, Radio, InputLabel, MenuItem, Select, Switch } from "@mui/material"
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
import { getAllStaffThunk } from "@/store/slices/staffSlice"
import { authService } from "@/services/auth.service";
interface OptionType {
  company: String
  label: string
  value: string
  id?: string
}
interface AddOrderDialogProps {
  company: string
  open: boolean
  onClose: () => void
  refreshData?: () => void
  party?: any
}
const AddSakhiOrderDialog: React.FC<AddOrderDialogProps> = ({ company, open, onClose, refreshData, party }) => {
  const dispatch = useAppDispatch()
  const fileUploadRef = useRef<FileUploadRef>(null)
  const currentUser = authService.getUser();
  const { productItems, loading: productLoading } = useAppSelector((state) => state.productItems)
  const { singleAccountMaster, loading: accountLoading }: any = useAppSelector((state) => state.accountMasters)
  const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders)
  const { binderTypes } = useAppSelector((state) => state.binderType)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gstNotApplicable, setGstNotApplicable] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>(company)
  const { staffList, loading: staffLoading } = useAppSelector((state) => state.staff)
  const isAdmin = currentUser?.role?.roleName === "Admin";
  // Sakshi Creation form data
  const [sakshiFormData, setSakshiFormData] = useState({
    companyName: company,
    partyName: "",
    jobName: "",
    personName: "",
    whatsapp: "",
    binding: false,
    bindingType: null as string | null,
    bindingPage: "",
    bookletFolder: false,
    bookletFolderType: null as string | null,
    createdBy: "",
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
    startNumber: "",
    color1: "",
    color2: "",
  })

  // Memoized item options
  const itemOptions = useMemo(() => {
    return productItems.map((item) => ({
      label: item.itemName,
      value: item._id,
    }))
  }, [productItems])

  useEffect(() => {
    if (party !== undefined && party !== null) setSakshiFormData((prev) => ({ ...prev, partyName: party }))
  }, [party])

  // Clear messages when dialog opens
  useEffect(() => {
    if (open) {
      dispatch(clearOrderError())
      dispatch(clearOrderSuccessMessage())
      setGstNotApplicable(false)
      setSelectedCompany(company)
      // setSelectedCompany("")
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

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      dispatch(getAllProductItemsThunk())
      if (!binderTypes.length) dispatch(getAllBinderTypesThunk())
        dispatch(getAllStaffThunk())
    }
  }, [open, dispatch])

  const staffOptions = useMemo(() => {
  return staffList
    .filter((staff) => staff.role?.roleName === "Sales Staff")
    .map((staff) => ({
      label: staff.name,
      value: staff._id,
    }))
}, [staffList])


  // Auto-fill form when account master data is loaded
  useEffect(() => {
    if (
      sakshiFormData.partyName &&
      singleAccountMaster &&
      singleAccountMaster.accountMaster
    ) {
      const accountData = singleAccountMaster.accountMaster
      setSakshiFormData((prev) => ({
        ...prev,
        personName: accountData.party?.ownerName || "",
        whatsapp: accountData.party?.ownerWhatsAppNo || "",
        gst: accountData.party?.GSTNo || "",
      }))
    }
  }, [singleAccountMaster, sakshiFormData.partyName])

  const handleSakshiChange = (field: string, value: any) => setSakshiFormData((prev) => ({ ...prev, [field]: value }))

  const handleCompanyChange = (event: any, newValue: any) => {
    const companyId = newValue ? newValue.value : ""
    setSelectedCompany(companyId)
    handleSakshiChange("companyName", companyId)
    handleSakshiChange("partyName", "")
    handleSakshiChange("personName", "")
    handleSakshiChange("whatsapp", "")
    handleSakshiChange("gst", "")
    setGstNotApplicable(false)
  }

  const handlePartyChange = async (event: any, newValue: any) => {
    const partyId = newValue ? newValue.value : ""
    handleSakshiChange("partyName", partyId)

    if (sakshiFormData.companyName && partyId) {
      try {
        await dispatch(
          getAccountMasterByCompanyAndPartyThunk({
            // companyId: selectedCompany,
            companyId: sakshiFormData.companyName,
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

  const handleSakshiSubmit = async () => {
    if (!sakshiFormData.partyName || !sakshiFormData.jobName.trim() || !sakshiFormData.itemName || !sakshiFormData.qty) {
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
        jobName: sakshiFormData.jobName.trim(),
        party: sakshiFormData.partyName,
        pType: sakshiFormData.pType,
        binding: sakshiFormData.binding,
        bindingType: sakshiFormData.bindingType,
        bindingPage: sakshiFormData.bindingPage,
        bookletFolder: sakshiFormData.bookletFolder,
        bookletFolderType: sakshiFormData.bookletFolderType,
        productItem: sakshiFormData.itemName,
        qty: Number.parseInt(sakshiFormData.qty),
        remarks: sakshiFormData.remarks || "",
        filePaths: filePaths,
        gstStatus: gstNotApplicable ? "Not Applicable" : "Applicable",
        gstNumber: gstNotApplicable ? "" : sakshiFormData.gst,
        createdBy: sakshiFormData.createdBy || undefined,
        isGst: !gstNotApplicable,
        size: sakshiFormData.size || "",
        rate: sakshiFormData.rate ? Number.parseFloat(sakshiFormData.rate) : undefined,
        rateType: sakshiFormData.rateType,
        number: sakshiFormData.number,
        endNumber: sakshiFormData.endNumber,
        startNumber: sakshiFormData.startNumber,
        color: sakshiFormData.color,
        color1: sakshiFormData.color1 || "",
        color2: sakshiFormData.color2 || "",
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
    setSakshiFormData({
      companyName: "",
      partyName: "",
      jobName: "",
      personName: "",
      whatsapp: "",
      itemName: "",
      qty: "",
      gst: "",
      bindingType: "",
      bindingPage: "",
      bookletFolderType: "",
      pType: "",
      createdBy: "",
      binding: false,
      bookletFolder: false,
      remarks: "",
      size: "",
      rate: "",
      rateType: "new",
      color: "",
      number: "",
      endNumber: "",
      startNumber: "",
      color1: "",
      color2: "",
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
          labelName="Job Name"
          placeholder="Enter job name"
          fullWidth
          value={sakshiFormData.jobName}
          onChange={(e) => handleSakshiChange("jobName", e.target.value)}
          required
        />
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeInput
          labelName="Person Name"
          placeholder="Person"
          fullWidth
          value={sakshiFormData.personName}
          onChange={(e) => handleSakshiChange("personName", e.target.value)}
          disabled

          sx={{
            "& .MuiInputBase-input": {
              backgroundColor: singleAccountMaster ? "#f5f5f5" : "transparent",
            },
          }}
        />
        {isAdmin && (
         <ThemeSelect
          label="Sales Staff"
          value={getSelectedOption(sakshiFormData.createdBy, staffOptions)}
          options={staffOptions}
          onChange={(_, v) => handleSakshiChange("createdBy", v ? v.value : "")}
          disabled={staffLoading}
        />
        )}
        <ThemeInput
          labelName="WhatsApp no."
          placeholder="98233-12342"
          fullWidth
          value={sakshiFormData.whatsapp}
          onChange={(e) => handleSakshiChange("whatsapp", e.target.value)}
          disabled
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
        <ThemeSelect
          label="Printing Type"
          value={getSelectedOption(sakshiFormData.pType, printerTypeOption)}
          options={printerTypeOption}
          onChange={(_, v) => handleSakshiChange("pType", v ? v.value : "")}
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
        <ThemeInput
          labelName="Binding Page"
          placeholder="Enter binding page"
          fullWidth
          type="text"
          value={sakshiFormData.bindingPage}
          onChange={(e) => handleSakshiChange("bindingPage", e.target.value)}
        />
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <FormControlLabel
          control={
            <Switch
              checked={sakshiFormData.bookletFolder}
              onChange={(e) => handleSakshiChange("bookletFolder", e.target.checked)}
              color="primary"
            />
          }
          label="Booklet/Folder"
        />
        {sakshiFormData.bookletFolder ? (
          <ThemeSelect
            label="Booklet/Folder Type"
            value={getSelectedOption(sakshiFormData?.bookletFolderType, [
              { value: "two-fold", label: "Two Fold" },
              { value: "three-fold", label: "Three Fold" },
              { value: "four-fold", label: "Four Fold" },
              { value: "five-fold", label: "Five Fold" },
            ])}
            options={[
              { value: "two-fold", label: "Two Fold" },
              { value: "three-fold", label: "Three Fold" },
              { value: "four-fold", label: "Four Fold" },
              { value: "five-fold", label: "Five Fold" },
            ]}
            onChange={(_, v) => handleSakshiChange("bookletFolderType", v ? v.value : "")}
            required
          />
        ) : null}
      </Stack>
      <Stack direction="row" mb={2} spacing={2}>
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

      {sakshiFormData.color === "1" && (
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="Color 1 Type"
            placeholder="Enter color 1 type"
            fullWidth
            value={sakshiFormData.color1}
            onChange={(e) => handleSakshiChange("color1", e.target.value)}
          />
        </Stack>
      )}

      {sakshiFormData.color === "2" && (
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="Color 1 Type"
            placeholder="Enter color 1 type"
            fullWidth
            value={sakshiFormData.color1}
            onChange={(e) => handleSakshiChange("color1", e.target.value)}
          />
          <ThemeInput
            labelName="Color 2 Type"
            placeholder="Enter color 2 type"
            fullWidth
            value={sakshiFormData.color2}
            onChange={(e) => handleSakshiChange("color2", e.target.value)}
          />
        </Stack>
      )}


      {sakshiFormData.number === 'Yes' ? (
        <Stack direction="row" spacing={2} mb={2}>
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

      <Stack direction="row" spacing={2} mb={2} >
        <Box sx={{ width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "nowrap" 
            }}
          >
            <RadioGroup
              row
              value={sakshiFormData.rateType}
              onChange={(e) => handleSakshiChange("rateType", e.target.value)}
              sx={{
                flexDirection: "row",
                alignItems: "center",
                width: "auto"  // 👈 Radio group ki width fix
              }}
            >
              <FormControlLabel value="old" control={<Radio />} label="Old Rate" />
              <FormControlLabel value="new" control={<Radio />} label="New Rate" />
            </RadioGroup>

            {/* New Rate Input (Same Row) */}
            {sakshiFormData.rateType === "new" && (
              <ThemeInput
                labelName="Rate"
                placeholder="Enter rate"
                type="number"
                sx={{ width: 150 }}   // aap chaho to badha sakte ho
                value={sakshiFormData.rate}
                onChange={(e) => handleSakshiChange("rate", e.target.value)}
              />
            )}
          </Box>
        </Box>



        {/* <Box sx={{ width: "100%" }}>
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
        </Box> */}
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

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="Place New Order">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Box mb={2}>
          <CompanySelect
            name="companyName"
            value={sakshiFormData.companyName}
            onChange={handleCompanyChange}
            hasParties={true}
            required
            showPartyName={true}
            partyName={sakshiFormData.partyName}
            onPartyChange={handlePartyChange}
            disableCompanySelect={true}
          />
        </Box>
        {renderSakshiForm()}

        <ThemeButton
          onClick={handleSakshiSubmit}
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
export default AddSakhiOrderDialog

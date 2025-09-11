"use client"

import { useState, useEffect } from "react"
import { Box, Stack, CircularProgress } from "@mui/material"
import CustomDialog from "@/component/customdialog"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeSelect from "@/component/common_component/themeselect"
import ThemeButton from "@/component/common_component/themebutton"
import { useAppDispatch, useAppSelector } from "@/store"
import { clearOrderError, clearOrderSuccessMessage } from "@/store/slices/orderSlice"
import { toast } from "react-toastify"
import { updateQPOrderThunk } from "@/store/slices/qpOrderSlice"
import { getAllPackagingOptionsThunk } from "@/store/slices/packagingOptionSlice"
import { getAllKantansThunk } from "@/store/slices/kantanSlice"
import { Height } from "@mui/icons-material"

interface AddOrderDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
  editData?: any
}

const EditOrderDialog: React.FC<AddOrderDialogProps> = ({ open, onClose, refreshData, editData }) => {
  const dispatch = useAppDispatch()

  // Redux state
  const { packagingOptions } = useAppSelector((state) => state.packagingOptions);
  const { kantans } = useAppSelector((state) => state.kantans)
  const { singleAccountMaster, loading: accountLoading } = useAppSelector((state) => state.accountMasters)
  const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Quality Packaging form data
  const [qpFormData, setQpFormData] = useState({
    date: editData?.date || "",
    orderFrom: editData?.orderFrom || "",
    name: editData?.name?._id || null,
    length: editData?.length?._id || null,
    height: editData?.height?._id || null,
    width: editData?.width?._id || null,
    ply: editData?.ply?._id || null,
    gsm: editData?.gsm || "", // Changed to string for text input
    deckal: editData?.deckal || "",
    noOfPieces: editData?.noOfPieces || "",
    ratePerPiece: editData?.ratePerPiece || "",
    amount: editData?.amount || "",
    kgPerUnit: editData?.kgPerUnit || "",
    totalKg: editData?.totalKg || "",
    kantan: editData?.kantan?._id || null,
    kantanDeckal: editData?.kantanDeckal || "",
    salesRemark: editData?.salesRemark || "",
    companyName: editData?.companyName?._id || null, // Add companyName
    party: editData?.party?._id || null,
    _id: editData?._id || ""
  })

  // Clear messages when dialog opens
  useEffect(() => {
    if (open && editData) {
      setQpFormData({
        date: editData?.date || "",
        orderFrom: editData?.orderFrom || "",
        name: editData?.name?._id || null,
        length: editData?.length?._id || null,
        height: editData?.height?._id || null,
        width: editData?.width?._id || null,
        ply: editData?.ply?._id || null,
        gsm: editData?.gsm || "",
        deckal: editData?.deckal || "",
        noOfPieces: editData?.noOfPieces?.toString() || "",
        ratePerPiece: editData?.ratePerPiece?.toString() || "",
        amount: editData?.amount || "",
        kgPerUnit: editData?.kgPerUnit || "",
        totalKg: editData?.totalKg || "",
        kantan: editData?.kantan?._id || null,
        kantanDeckal: editData?.kantanDeckal || "",
        salesRemark: editData?.salesRemark || "",
        companyName: editData?.companyName?._id || null, // Initialize companyName
        party: editData?.party?._id || null, // Initialize party
        _id: editData?._id || ""
      })
      dispatch(clearOrderError())
      dispatch(clearOrderSuccessMessage())
    }
  }, [open, editData, dispatch])

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

  useEffect(() => {
    if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk());
    if (!kantans.length) dispatch(getAllKantansThunk())
  }, []);

  const handleQpChange = (field: string, value: any) => {
    setQpFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    
    setIsSubmitting(true)

    try {
      const orderData = {
        isQp: true,
        date: qpFormData.date,
        orderFrom: qpFormData.orderFrom,
        name: qpFormData.name,
        length: qpFormData.length,
        height: qpFormData.height,
        width: qpFormData.width,
        ply: qpFormData.ply,
        gsm: qpFormData.gsm, // Send as string
        deckal: qpFormData.deckal,
        noOfPieces: Number(qpFormData.noOfPieces),
        ratePerPiece: Number(qpFormData.ratePerPiece),
        amount: qpFormData.amount,
        kgPerUnit: qpFormData.kgPerUnit,
        totalKg: qpFormData.totalKg,
        kantan: qpFormData.kantan,
        kantanDeckal: qpFormData.kantanDeckal,
        salesRemark: qpFormData.salesRemark,
        companyName: qpFormData.companyName, // Include companyName
        party: qpFormData.party // Include party
      }

      await dispatch(updateQPOrderThunk({ id: qpFormData?._id, data: orderData })).unwrap();

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
    setQpFormData({
      date: "",
      orderFrom: "",
      name: null,
      length: null,
      height: null,
      width: null,
      ply: null,
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
      companyName: null, // Reset companyName
      party: null,
      _id: ""
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }
  interface OptionType {
    label: string
    value: string
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
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="Edit Order">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        {renderQpForm()}

        <ThemeButton
          onClick={handleSubmit}
          disabled={isSubmitting}
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
              Updating Order...
            </Box>
          ) : accountLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Loading Party Details...
            </Box>
          ) : (
            "Update Order"
          )}
        </ThemeButton>
      </Box>
    </CustomDialog>
  )
}

export default EditOrderDialog
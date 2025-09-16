"use client"

import { useState, useEffect, useMemo } from "react"
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
import { getGSMByDeckalThunk } from "@/store/slices/paperGSMSlice"
import { calculateDeckal, calculateGSM, calculateKgPerPiece, calculateTotalKg, calculateTotalAmount, calculateKantan } from "@/utills/qpCalculations"
import {
  getSelectedOption,
  getUniqueNameOptions,
  getUniquePlyOptions,
  getUniqueLengthOptions,
  getUniqueWidthOptions,
  getUniqueHeightOptions,
  getPaperNameOptions,
  getPaperLengthOptions,
  getPaperWidthOptions,
  getPaperHeightOptions,
} from "@/utills/qpOptionHelpers"


interface AddOrderDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
  editData?: any
}

const EditOrderDialog: React.FC<AddOrderDialogProps> = ({ open, onClose, refreshData, editData }) => {
  const dispatch = useAppDispatch()

  // Redux state
  const { packagingOptions } = useAppSelector((state) => state.packagingOptions)
  const { paperGSM, gsmByDeckal } = useAppSelector((state) => state.paperGSMs)
  const { kantans } = useAppSelector((state) => state.kantans)
  const { singleAccountMaster, loading: accountLoading } = useAppSelector((state) => state.accountMasters)
  const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeckalManual, setIsDeckalManual] = useState(false)
  const [isPaperOptionsLoading, setIsPaperOptionsLoading] = useState(false);

  // Quality Packaging form data
  const [qpFormData, setQpFormData] = useState({
    date: "",
    orderFrom: "",
    name: "",
    length: "",
    height: "",
    width: "",
    ply: "",
    paperWidth: "",
    paperLength: "",
    paperHeight: "",
    gsm: "",
    deckal: "",
    deckalCalculation: "",
    noOfPieces: "",
    ratePerPiece: "",
    amount: "",
    kgPerUnit: "",
    totalKg: "",
    kantan: null as string | null,
    kantanPerUnit: "",
    totalKantan: {
      reel: "",
      inch: ""
    },
    kantanDeckal: "",
    salesRemark: "",
    companyName: null,
    party: null,
    _id: ""
  })

  const paperDimensionOptions = useMemo(() => {
    if (!gsmByDeckal?.gsmOptions) return { length: [], width: [], height: [] }

    // Use the same options for all three dimensions
    const options = gsmByDeckal.gsmOptions.map((opt: any) => ({
      value: opt.value,
      label: opt.label,
      id: opt.id
    }))

    return {
      length: options,
      width: options,
      height: options
    }
  }, [gsmByDeckal])

  // Initialize form data when dialog opens
  console.log("DEBUG : EditOrderDialog : editData:", editData);
  useEffect(() => {
    if (open && editData) {
      const initialIsManual = editData?.deckal !== editData?.deckalCalculation;
      setIsDeckalManual(initialIsManual);

      // Set loading state
      setIsPaperOptionsLoading(true);

      // Fetch GSM data if deckal exists
      if (editData?.deckal) {
        dispatch(getGSMByDeckalThunk(editData.deckal))
          .unwrap()
          .finally(() => {
            setIsPaperOptionsLoading(false);
          });
      } else {
        setIsPaperOptionsLoading(false);
      }

      setQpFormData({
        date: editData?.date || "",
        orderFrom: editData?.orderFrom || "",
        name: editData?.name?.name || "",
        length: editData?.length?.length || "",
        height: editData?.height?.height || "",
        width: editData?.width?.width || "",
        paperLength: editData?.paperLength?.gsm || "",
        paperWidth: editData?.paperWidth?.gsm || "",
        paperHeight: editData?.paperHeight?.gsm || "",
        ply: editData?.ply?.ply || "",
        gsm: editData?.gsm || "",
        deckal: editData?.deckal || "",
        deckalCalculation: editData?.deckalCalculation || "",
        noOfPieces: editData?.noOfPieces?.toString() || "",
        ratePerPiece: editData?.ratePerPiece?.toString() || "",
        amount: editData?.amount || "",
        kgPerUnit: editData?.kgPerUnit || "",
        totalKg: editData?.totalKg || "",
        kantan: editData?.kantan?._id || null,
        kantanPerUnit: editData?.kantanPerUnit || "",
        totalKantan: {
          reel: editData?.totalKantan?.reel?.toString() || "",
          inch: editData?.totalKantan?.inch?.toString() || ""
        },
        kantanDeckal: editData?.kantanDeckal || "",
        salesRemark: editData?.salesRemark || "",
        companyName: editData?.companyName?._id || null,
        party: editData?.party?._id || null,
        _id: editData?._id || ""
      })

      dispatch(clearOrderError())
      dispatch(clearOrderSuccessMessage())
    }
  }, [open, editData, dispatch])

  // Handle success and error messages with toast
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage, { autoClose: 3000 })
      dispatch(clearOrderSuccessMessage())
    }
  }, [successMessage, dispatch])

  useEffect(() => {
    if (open) {
      dispatch(getAllPackagingOptionsThunk())
      dispatch(getAllKantansThunk())
      if (qpFormData.deckal) {
        dispatch(getGSMByDeckalThunk(qpFormData.deckal))
      }
    }
  }, [open, dispatch, qpFormData.deckal])

  useEffect(() => {
    if (orderError) {
      toast.error(orderError, { autoClose: 3000 })
      dispatch(clearOrderError())
    }
  }, [orderError, dispatch])

  // Fetch packaging options and kantans
  useEffect(() => {
    if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk())
    if (!paperGSM.length) dispatch(getAllPackagingOptionsThunk())
    if (!kantans.length) dispatch(getAllKantansThunk())
  }, [dispatch, packagingOptions.length, kantans.length])

  const handleQpChange = (field: string, value: any) => {
    setQpFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDeckalChange = (e: any) => {
    const value = e.target.value
    handleQpChange("deckal", value)
    setIsDeckalManual(!!value && value !== "")

    handleQpChange("paperLength", "")
    handleQpChange("paperWidth", "")
    handleQpChange("paperHeight", "")
  }

  const handleSubmit = async () => {
    if (!qpFormData.companyName || !qpFormData.party) {
      toast.error("Please fill all required fields (Company Name and Party Name)", { autoClose: 3000 })
      return
    }

    if (!qpFormData._id) {
      toast.error("Invalid order ID. Cannot update order.", { autoClose: 3000 })
      return
    }

    setIsSubmitting(true)

    try {
      const findOptionId = (field: string, value: string) => {
        if (!value) return undefined
        const filteredOptions = packagingOptions.filter((option: any) => {
          return (
            (!qpFormData.name || option.name === qpFormData.name) &&
            (!qpFormData.ply || option.ply === qpFormData.ply) &&
            (!qpFormData.length || option.length === qpFormData.length) &&
            (!qpFormData.width || option.width === qpFormData.width) &&
            (!qpFormData.height || option.height === qpFormData.height)
          )
        })
        const matchingOption = filteredOptions.find((option: any) => option[field] === value)
        return matchingOption ? matchingOption._id : undefined
      }
      const findOptionPaperId = (field: string, value: string) => {
        if (!value) return undefined;
        // Find the option where the specific field matches the selected value
        const matchingOption = paperGSM.find((option: any) => option[field] === value);
        return matchingOption ? matchingOption._id : undefined;
      };

      const orderData = {
        isQp: true,
        date: qpFormData.date || undefined,
        orderFrom: qpFormData.orderFrom || undefined,
        name: findOptionId('name', qpFormData.name),
        ply: findOptionId('ply', qpFormData.ply),
        length: findOptionId('length', qpFormData.length),
        width: findOptionId('width', qpFormData.width),
        height: findOptionId('height', qpFormData.height),
        paperLength: findOptionPaperId('gsm', qpFormData.paperLength),
        paperWidth: findOptionPaperId('gsm', qpFormData.paperWidth),
        paperHeight: findOptionPaperId('gsm', qpFormData.paperHeight),
        gsm: qpFormData.gsm || undefined,
        deckal: qpFormData.deckal || undefined,
        deckalCalculation: qpFormData.deckalCalculation || undefined,
        noOfPieces: qpFormData.noOfPieces ? Number(qpFormData.noOfPieces) : undefined,
        ratePerPiece: qpFormData.ratePerPiece ? Number(qpFormData.ratePerPiece) : undefined,
        amount: qpFormData.amount ? Number(qpFormData.amount) : undefined,
        kgPerUnit: qpFormData.kgPerUnit ? Number(qpFormData.kgPerUnit) : undefined,
        totalKg: qpFormData.totalKg ? Number(qpFormData.totalKg) : undefined,
        kantan: qpFormData.kantan || undefined,
        kantanPerUnit: qpFormData.kantanPerUnit ? Number(qpFormData.kantanPerUnit) : undefined,
        totalKantan: {
          reel: qpFormData.totalKantan.reel || "0",
          inch: qpFormData.totalKantan.inch || "0",
        },
        kantanDeckal: qpFormData.kantanDeckal || undefined,
        salesRemark: qpFormData.salesRemark || undefined,
        companyName: qpFormData.companyName,
        party: qpFormData.party
      }

      if (orderData.name === undefined || orderData.ply === undefined || orderData.length === undefined ||
        orderData.width === undefined || orderData.height === undefined) {
        toast.error("Invalid packaging options selected. Please check name, ply, and dimensions.", { autoClose: 3000 })
        setIsSubmitting(false)
        return
      }

      await dispatch(updateQPOrderThunk({ id: qpFormData._id, data: orderData })).unwrap()
      toast.success("Order updated successfully!", { autoClose: 3000 })

      if (refreshData) refreshData()
      handleClose()
    } catch (error: any) {
      console.error("QP Order update error:", error)
      toast.error(error?.message || "Failed to update QP order", { autoClose: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setQpFormData({
      date: "",
      orderFrom: "",
      name: "",
      length: "",
      height: "",
      width: "",
      ply: "",
      paperWidth: "",
      paperLength: "",
      paperHeight: "",
      gsm: "",
      deckal: "",
      deckalCalculation: "",
      noOfPieces: "",
      ratePerPiece: "",
      amount: "",
      kgPerUnit: "",
      totalKg: "",
      kantan: null,
      kantanPerUnit: "",
      totalKantan: { reel: "", inch: "" },
      kantanDeckal: "",
      salesRemark: "",
      companyName: null,
      party: null,
      _id: ""
    })
    setIsDeckalManual(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  interface OptionType {
    label: string
    value: string
  }

  // Modify the getSelectedOption function to handle loading state
  const getSelectedOption = (value: string, options: OptionType[]) => {
    if (!value) return null;

    // If options are loading, create a temporary option
    if (isPaperOptionsLoading || options.length === 0) {
      return { value, label: value };
    }

    return options.find((option) => option.value === value) || null;
  };

  // Helper functions to get unique values for dropdowns with dynamic filtering
  const getUniqueNameOptions = () => {
    const uniqueNames = [...new Set(packagingOptions.map((item: any) => item.name))].sort()
    return uniqueNames.map((name) => ({
      value: name,
      label: name
    }))
  }

  const getUniquePlyOptions = () => {
    const filteredOptions = packagingOptions.filter((item: any) =>
      (!qpFormData.name || item.name === qpFormData.name)
    )
    const uniquePlies = [...new Set(filteredOptions.map((item: any) => item.ply))].sort()
    return uniquePlies.map((ply) => ({
      value: ply,
      label: `${ply}`
    }))
  }

  const getUniqueLengthOptions = () => {
    const filteredOptions = packagingOptions.filter((item: any) =>
      (!qpFormData.name || item.name === qpFormData.name) &&
      (!qpFormData.ply || item.ply === qpFormData.ply)
    )
    const uniqueLengths = [...new Set(filteredOptions.map((item: any) => item.length))].sort()
    return uniqueLengths.map((length) => ({
      value: length,
      label: length
    }))
  }

  const getUniqueWidthOptions = () => {
    const filteredOptions = packagingOptions.filter((item: any) =>
      (!qpFormData.name || item.name === qpFormData.name) &&
      (!qpFormData.ply || item.ply === qpFormData.ply) &&
      (!qpFormData.length || item.length === qpFormData.length)
    )
    const uniqueWidths = [...new Set(filteredOptions.map((item: any) => item.width))].sort()
    return uniqueWidths.map((width) => ({
      value: width,
      label: width
    }))
  }

  const getUniqueHeightOptions = () => {
    const filteredOptions = packagingOptions.filter((item: any) =>
      (!qpFormData.name || item.name === qpFormData.name) &&
      (!qpFormData.ply || item.ply === qpFormData.ply) &&
      (!qpFormData.length || item.length === qpFormData.length) &&
      (!qpFormData.width || item.width === qpFormData.width)
    )
    const uniqueHeights = [...new Set(filteredOptions.map((item: any) => item.height))].sort()
    return uniqueHeights.map((height) => ({
      value: height,
      label: height
    }))
  }


  const renderQpForm = () => {
    const handleItemNameChange = (_, val: any) => {
      handleQpChange("name", val?.value || "")
      handleQpChange("ply", "")
      handleQpChange("length", "")
      handleQpChange("width", "")
      handleQpChange("height", "")
    }

    const handlePlyChange = (_, val: any) => {
      handleQpChange("ply", val?.value || "")
      handleQpChange("length", "")
      handleQpChange("width", "")
      handleQpChange("height", "")
    }

    const handlePaperLengthChange = (_, val: any) => {
      handleQpChange("paperLength", val?.value || "")
    }

    const handlePaperWidthChange = (_, val: any) => {
      handleQpChange("paperWidth", val?.value || "")
    }

    const handlePaperHeightChange = (_, val: any) => {
      handleQpChange("paperHeight", val?.value || "")
    }
    return (
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
            labelName="Deckal Calculation"
            placeholder="Deckal Calculation"
            fullWidth
            value={qpFormData.deckalCalculation}
            disabled
          />
          <ThemeInput
            labelName="Deckal"
            placeholder="Deckal"
            fullWidth
            value={qpFormData.deckal}
            onChange={handleDeckalChange}
          />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="Paper Length"
            options={paperDimensionOptions.length}
            value={getSelectedOption(qpFormData.paperLength, paperDimensionOptions.length)}
            onChange={handlePaperLengthChange}
            name="paperLength"
          // loading={isPaperOptionsLoading}
          />
          <ThemeSelect
            label="Paper Width"
            options={paperDimensionOptions.width}
            value={getSelectedOption(qpFormData.paperWidth, paperDimensionOptions.width)}
            onChange={handlePaperWidthChange}
            name="paperWidth"
          // loading={isPaperOptionsLoading}
          />
          <ThemeSelect
            label="Paper Height"
            options={paperDimensionOptions.height}
            value={getSelectedOption(qpFormData.paperHeight, paperDimensionOptions.height)}
            onChange={handlePaperHeightChange}
            name="paperHeight"
          // loading={isPaperOptionsLoading}
          />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
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
            disabled
          />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>

          <ThemeInput
            labelName="GSM"
            placeholder="GSM"
            fullWidth
            value={qpFormData.gsm}
            disabled
          />
          <ThemeInput
            labelName="KG Per Unit"
            placeholder="KG Per Unit"
            fullWidth
            value={qpFormData.kgPerUnit}
            disabled
          />
          <ThemeInput
            labelName="Total KG"
            placeholder="Total KG"
            fullWidth
            value={qpFormData.totalKg}
            disabled
          />
        </Stack>
        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="Kantan"
            options={kantans.map((item: any) => ({ value: item._id, label: item.kantanName }))}
            value={kantans
              .map((item: any) => ({ value: item._id, label: item.kantanName }))
              .find((item) => item.value === qpFormData.kantan) || null}
            onChange={(_, val: any) => handleQpChange("kantan", val?.value || null)}
            name="kantan"
          />
          <ThemeInput
            labelName="Kantan Per Unit"
            placeholder="Kantan Per Unit"
            fullWidth
            value={qpFormData.kantanPerUnit}
            disabled
          />
          <ThemeInput
            labelName="Total Kantan"
            placeholder="Total Kantan"
            fullWidth
            value={
              qpFormData.totalKantan.reel && qpFormData.totalKantan.inch
                ? `${qpFormData.totalKantan.reel} reel ${qpFormData.totalKantan.inch} inch`
                : ""
            }
            disabled
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
  }

  // Automatic calculations
  useEffect(() => {
    const { length, width, height, ply, noOfPieces, ratePerPiece, deckal } = qpFormData

    if (!length || !width || !height || !ply) return

    const selectedPackagingOption = packagingOptions.find((item: any) =>
      item.name === qpFormData.name &&
      item.ply === qpFormData.ply &&
      item.length === qpFormData.length &&
      item.width === qpFormData.width &&
      item.height === qpFormData.height
    )

    const calcLength = selectedPackagingOption?.length ? Number(selectedPackagingOption.length) : Number(length)
    const calcWidth = selectedPackagingOption?.width ? Number(selectedPackagingOption.width) : Number(width)
    const calcHeight = selectedPackagingOption?.height ? Number(selectedPackagingOption.height) : Number(height)
    const calcPly = selectedPackagingOption?.ply ? Number(selectedPackagingOption.ply) : Number(ply)

    const deckalValue = calculateDeckal(calcWidth, calcHeight)
    const formattedDeckalValue = deckalValue.toFixed(2)
    handleQpChange("deckalCalculation", formattedDeckalValue)

    if (!isDeckalManual) {
      handleQpChange("deckal", formattedDeckalValue)
    }

    const gsmValue = calculateGSM(calcPly, calcLength, calcWidth, calcHeight)
    handleQpChange("gsm", gsmValue.toFixed(2))

    const effectiveDeckal = Number(deckal || formattedDeckalValue)
    const kgPerPiece = calculateKgPerPiece(calcLength, calcWidth, effectiveDeckal, Number(gsmValue))
    handleQpChange("kgPerUnit", kgPerPiece.toFixed(4))

    const totalKg = calculateTotalKg(Number(noOfPieces || 0), kgPerPiece)
    handleQpChange("totalKg", totalKg.toFixed(2))

    const amount = calculateTotalAmount(Number(noOfPieces || 0), Number(ratePerPiece || 0))
    handleQpChange("amount", amount.toFixed(2))

    const calcNoOfPieces = Number(noOfPieces || 0)
    const { kantanPerUnit, reel, inch } = calculateKantan(calcLength, calcWidth, calcNoOfPieces)

    handleQpChange("kantanPerUnit", kantanPerUnit.toFixed(2))
    handleQpChange("totalKantan", { reel: reel.toString(), inch: inch.toString() })
  }, [
    qpFormData.length,
    qpFormData.width,
    qpFormData.height,
    qpFormData.ply,
    qpFormData.name,
    qpFormData.noOfPieces,
    qpFormData.ratePerPiece,
    qpFormData.deckal,
    isDeckalManual,
    packagingOptions
  ])

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="Edit Order">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        {renderQpForm()}

        <ThemeButton
          onClick={handleSubmit}
          disabled={isSubmitting || accountLoading || orderLoading || !qpFormData.companyName}
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
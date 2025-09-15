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
    const { paperGSM } = useAppSelector((state) => state.paperGSMs)
    const { kantans } = useAppSelector((state) => state.kantans)
    const { singleAccountMaster, loading: accountLoading } = useAppSelector((state) => state.accountMasters)
    const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeckalManual, setIsDeckalManual] = useState(false)

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
      paperName: "",
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

    // Initialize form data when dialog opens
    useEffect(() => {
      if (open && editData) {
        const initialIsManual = editData?.deckal !== editData?.deckalCalculation
        setIsDeckalManual(initialIsManual)

        setQpFormData({
          date: editData?.date || "",
          orderFrom: editData?.orderFrom || "",
          name: editData?.name?.name || "",
          length: editData?.length?.length || "",
          height: editData?.height?.height || "",
          width: editData?.width?.width || "",
          paperName: editData?.paperName?.name || "",
          paperLength: editData?.paperLength?.length || "",
          paperWidth: editData?.paperWidth?.width || "",
          paperHeight: editData?.paperHeight?.height || "",
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
          paperName: findOptionPaperId('name', qpFormData.paperName),
          paperLength: findOptionPaperId('length', qpFormData.paperLength),
          paperWidth: findOptionPaperId('width', qpFormData.paperWidth),
          paperHeight: findOptionPaperId('height', qpFormData.paperHeight),
          gsm: qpFormData.gsm || undefined,
          deckal: qpFormData.deckal || undefined,
          deckalCalculation: qpFormData.deckalCalculation || undefined,
          noOfPieces: qpFormData.noOfPieces ? Number(qpFormData.noOfPieces) : undefined,
          ratePerPiece: qpFormData.ratePerPiece ? Number(qpFormData.ratePerPiece) : undefined,
          amount: qpFormData.amount ? Number(qpFormData.amount) : undefined,
          kgPerUnit: qpFormData.kgPerUnit ? Number(qpFormData.kgPerUnit) : undefined,
          totalKg: qpFormData.totalKg ? Number(qpFormData.totalKg) : undefined,
          kantan: qpFormData.kantan || undefined,
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
        paperName: "",
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
          <ThemeSelect
            label="Paper Name"
            options={getPaperNameOptions()}
            value={getSelectedOption(qpFormData.paperName, getPaperNameOptions())}
            onChange={(_, val: any) => handleQpChange("paperName", val?.value || "")}
            name="paperName"
          />
          <ThemeSelect
            label="Paper Length"
            options={getPaperLengthOptions()}
            value={getSelectedOption(qpFormData.paperLength, getPaperLengthOptions())}
            onChange={(_, val: any) => handleQpChange("paperLength", val?.value || "")}
            name="paperLength"
          />
          <ThemeSelect
            label="Paper Width"
            options={getPaperWidthOptions()}
            value={getSelectedOption(qpFormData.paperWidth, getPaperWidthOptions())}
            onChange={(_, val: any) => handleQpChange("paperWidth", val?.value || "")}
            name="paperWidth"
          />
          <ThemeSelect
            label="Paper Height"
            options={getPaperHeightOptions()}
            value={getSelectedOption(qpFormData.paperHeight, getPaperHeightOptions())}
            onChange={(_, val: any) => handleQpChange("paperHeight", val?.value || "")}
            name="paperHeight"
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
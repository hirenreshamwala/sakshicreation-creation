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
  const { singleAccountMaster, loading: accountLoading } = useAppSelector((state) => state.accountMasters)
  const { loading: orderLoading, error: orderError, successMessage } = useAppSelector((state) => state.orders)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Quality Packaging form data
  const [qpFormData, setQpFormData] = useState({
    date: editData?.date,
    orderFrom: editData?.orderFrom,
    size: editData?.size?._id,
    ply: editData?.ply?._id,
    gsm: editData?.gsm?._id,
    deckal: editData?.deckal?._id,
    rate: editData?.rate,
    dyeNumber: editData?.dyeNumber,
    dyeSize: editData?.dyeSize,
    dySheetSize: editData?.dySheetSize,
    dyeRemark: editData?.dyeRemark,
    godownRemark: editData?.godownRemark,
    factoryRemark: editData?.factoryRemark,
    delivery: editData?.delivery,
    _id: editData?._id
  })

  // Clear messages when dialog opens
  useEffect(() => {
    if (open) {
      dispatch(clearOrderError())
      dispatch(clearOrderSuccessMessage())
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

  useEffect(() => {
    if (!packagingOptions.length) dispatch(getAllPackagingOptionsThunk());
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
      delivery: "",
      _id: ""
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

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
          options={packagingOptions?.map((item: any) => ({
            value: item?._id,
            label: item?.ply,
          }))}
          value={packagingOptions
            ?.map((item: any) => ({ value: item?._id, label: item?.ply }))
            ?.find((item) => item.value === qpFormData.ply)}
          onChange={(e, val: any) => {
            handleQpChange("ply", val.value)
            handleQpChange("size", null)
            handleQpChange("gsm", null)
            handleQpChange("deckal", null)
          }}
        />

      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeSelect
          label="Size"
          options={packagingOptions
            ?.filter((item) => item._id === qpFormData.ply) // ✅ match ply
            ?.map((item: any) => ({
              value: item?._id,
              label: item?.size,
            }))}
          value={packagingOptions
            ?.filter((item) => item._id === qpFormData.ply)
            ?.map((item: any) => ({ value: item?._id, label: item?.size }))
            ?.find((item) => item.value === qpFormData.size)}
          onChange={(e, val: any) => {
            handleQpChange("size", val.value)
            handleQpChange("gsm", null)
            handleQpChange("deckal", null)
          }}
        />

        <ThemeSelect
          label="GSM"
          options={packagingOptions
            ?.filter((item) => item._id === qpFormData.size) // ✅ match size
            ?.map((item: any) => ({
              value: item?._id,
              label: item?.gsm,
            }))}
          value={packagingOptions
            ?.filter((item) => item._id === qpFormData.size)
            ?.map((item: any) => ({ value: item?._id, label: item?.gsm }))
            ?.find((item) => item.value === qpFormData.gsm)}
          onChange={(e, val: any) => {
            handleQpChange("gsm", val.value)
            handleQpChange("deckal", null)
          }}
        />
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <ThemeSelect
          label="Deckal"
          options={packagingOptions
            ?.filter((item) => item._id === qpFormData.gsm)
            ?.map((item: any) => ({
              value: item?._id,
              label: item?.deckal,
            }))}
          value={packagingOptions
            ?.filter((item) => item._id === qpFormData.gsm)
            ?.map((item: any) => ({ value: item?._id, label: item?.deckal }))
            ?.find((item) => item.value === qpFormData.deckal)}
          onChange={(e, val: any) => handleQpChange("deckal", val.value)}
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
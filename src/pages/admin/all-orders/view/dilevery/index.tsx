"use client"
import { useState, useEffect } from "react"
import { Box, Typography, Stack, CircularProgress } from "@mui/material"
import StepperProgress from "@/component/common_component/stepperprogress"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import { useRouter } from "next/router"
import { useAppDispatch, useAppSelector } from "@/store"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { toast } from "react-toastify"
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect"
import { useFormik } from "formik"
import * as Yup from "yup"

type OptionType = {
  label: string
  value: string | number
}

const DeliveryForm = () => {
  const router = useRouter()
  const { id: orderId } = router.query
  const dispatch = useAppDispatch()
  const { singleOrder } = useAppSelector((state) => state.orders)

  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [selectedDeliveryStaff, setSelectedDeliveryStaff] = useState<any>(null)

  const formik = useFormik({
    initialValues: {
      remarks: "",
      date: "",
      time: "",
    },
    validationSchema: Yup.object({
      remarks: Yup.string().required("Remarks are required"),
      date: Yup.string().required("Date is required"),
      time: Yup.string(),
    }),
    onSubmit: async (values) => {
      if (!orderId || typeof orderId !== "string") {
        toast.error("Order ID not found")
        return
      }
      if (!selectedDeliveryStaff) {
        toast.error("Please select a staff for delivery.")
        return
      }

      setLoading(true)
      try {
        const updateData = {
          status: "Delivery",
          deliveryDate: values.date,
          deliveryTime: values.time,
          deliveryStaff: selectedDeliveryStaff.value,
          remarks: values.remarks, 
        }
        await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
        toast.success("Order marked as delivered successfully!")
        router.push(`/admin/all-orders`) // Example: go back to all orders
      } catch (error: any) {
        console.error("Error marking as delivered:", error)
        toast.error(error?.message || "Failed to mark as delivered")
      } finally {
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    const fetchOrderData = async () => {
      if (orderId && typeof orderId === "string") {
        try {
          setPageLoading(true)
          await dispatch(getOrderByIdThunk(orderId)).unwrap()
        } catch (err) {
          console.error("Failed to fetch order:", err)
          toast.error("Failed to load order data")
        } finally {
          setPageLoading(false)
        }
      }
    }
    fetchOrderData()
  }, [dispatch, orderId])


  useEffect(() => {
    if (singleOrder) {
      // Populate Formik values
      formik.setValues({
        remarks: singleOrder.remarks || "",
        date: singleOrder.deliveryDate ? new Date(singleOrder.deliveryDate).toISOString().split("T")[0] : "",
        time: singleOrder.deliveryTime || "",
      })

      // Set selected staff
      if (singleOrder.deliveryStaff && singleOrder.deliveryStaff._id) {
        setSelectedDeliveryStaff({
          value: singleOrder.deliveryStaff._id,
          label: singleOrder.deliveryStaff.name || `Staff ${singleOrder.deliveryStaff._id}`,
        })
      } else {
        setSelectedDeliveryStaff(null)
      }
    }
  }, [singleOrder])

  const handleDeliveryStaffChange = (event: any, newValue: any) => {
    setSelectedDeliveryStaff(newValue)
  }

  if (pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (!singleOrder) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>No order data found</Typography>
      </Box>
    )
  }

  return (
    <>
      <Box>
        {/* Stepper */}
         <StepperProgress 
          activeStep={5} 
          orderStatus={singleOrder?.status}
          designerStatus={singleOrder?.designerStatus}
          printerStatus={singleOrder?.printerStatus}
        />
        {/* Section Header */}
        <Box mt={2} border="2px solid #12B76A" borderRadius={2} p={2} bgcolor="#fff">
          <Typography fontWeight={600} fontSize={16} mb={2}>
            Delivery
          </Typography>
          {/* Form Fields */}
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <ThemeInput
                labelName="Company Name"
                value={singleOrder.companyName?.companyName || "N/A"}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <ThemeInput
                labelName="Party Name"
                value={singleOrder.party?.partyName || "N/A"}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <ThemeInput
                labelName="Item Name"
                value={singleOrder.productItem?.itemName || "N/A"}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Stack>
                      <Stack direction="row" spacing={2}>
         
            <ThemeInput
              labelName="Quantity"
              value={singleOrder.qty?.toString() || "N/A"}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <RoleStaffSelect
              label="Assign Sales Staff"
              name="deliveryStaff"
              value={selectedDeliveryStaff}
              onChange={handleDeliveryStaffChange}
              onStaffChange={handleDeliveryStaffChange}
              roleFilter="Sales Staff"
              showStaff={true}
              disabled={!!singleOrder.deliveryStaff || loading} // Disable if already assigned or loading
            />
              {/* <Box sx={{ display: "flex", gap: 2 }}> */}
                <ThemeInput
                  labelName="Date"
                  type="date"
                  name="date"
                  value={formik.values.date}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  error={formik.touched.date && Boolean(formik.errors.date)}
                  helperText={formik.touched.date && (formik.errors.date as string)}
                  required
                />
                <ThemeInput
                  labelName="Time"
                  type="time"
                  name="time"
                  value={formik.values.time}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  error={formik.touched.time && Boolean(formik.errors.time)}
                  helperText={formik.touched.time && (formik.errors.time as string)}
                />
              {/* </Box> */}
            </Stack>
           
        
            <ThemeInput
              labelName="Remarks"
              placeholder="Enter Remarks"
              multiline
              rows={3}
              fullWidth
              name="remarks"
              value={formik.values.remarks}
              onChange={formik.handleChange}
              error={formik.touched.remarks && Boolean(formik.errors.remarks)}
              helperText={formik.touched.remarks && (formik.errors.remarks as string)}
            />
            {/* Final Button */}
            <ThemeButton
              sx={{
                background: "#12B76A",
                color: "#fff",
                fontWeight: 600,
                fontSize: 18,
                borderRadius: 2,
                py: 1.2,
                width: "100%",
                "&:hover": { background: "#079455" },
              }}
              onClick={() => formik.handleSubmit()}
              disabled={loading || !!singleOrder.deliveryStaff || formik.isSubmitting}
            >
              {loading || formik.isSubmitting ? "Assigning..." : "Assign to Staff →"}
            </ThemeButton>
          </Stack>
        </Box>
      </Box>
    </>
  )
}

export default DeliveryForm

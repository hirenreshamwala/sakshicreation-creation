"use client"
import { useEffect, useState } from "react"
import { Box, Typography, Button, CircularProgress, Paper, Stack } from "@mui/material"
import { AiOutlineEye } from "react-icons/ai"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { useAppDispatch, useAppSelector } from "@/store"
import { useRouter } from "next/router"
import { toast } from "react-toastify"
import { formatDateToDDMMYYYY } from "@/utills/utills"

const DesignerViewTask = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { id: orderId } = router.query
  const [openFilesDialog, setOpenFilesDialog] = useState(false)
  const [openDesignFilesDialog, setOpenDesignFilesDialog] = useState(false)
  const { singleOrder, loading }:any = useAppSelector((state) => state.orders)
  const [pageLoading, setPageLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    partyName: "",
    ownerWhatsAppNo: "",
    itemName: "",
    orderNumber: "",
    size: "",
    quantity: "",
    number: "",
    startNumber: "",
    endNumber: "",
    color: "",
    pType: "",
    remarks: "",
    color1: "",
    color2: "",
    // binding: false,
    bindingType: "",
    bindingPage: "",
    // bookletFolder: false,
    bookletFolderType: "",
  })
  const [designerRemarks, setDesignerRemarks] = useState("")

  // Fetch order data
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

  // Populate form data when singleOrder changes
  useEffect(() => {
    if (singleOrder) {
      setFormData({
        companyName: singleOrder.companyName?.companyName || "",
        partyName: singleOrder.party?.partyName || "",
        ownerWhatsAppNo: singleOrder.party?.ownerWhatsAppNo || "",
        itemName: singleOrder.productItem?.itemName || "",
        orderNumber: singleOrder.orderNumber || "",
        size: singleOrder.size || "",
        quantity: singleOrder.qty?.toString() || "",
        number: singleOrder.number || "",
        startNumber: singleOrder.startNumber || "",
        endNumber: singleOrder.endNumber || "",
        color: singleOrder.color || "",
        pType: singleOrder.pType || "",
        remarks: singleOrder.remarks || "",
        color1: singleOrder.color1 || "",
        color2: singleOrder.color2 || "",
        bindingType: singleOrder.bindingType?.name || "",
        bindingPage: singleOrder.bindingPage || "",
        bookletFolderType: singleOrder.bookletFolderType || "",
      })
      setDesignerRemarks(singleOrder.designerRemarks || "")
    }
  }, [singleOrder])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCloseFilesDialog = () => setOpenFilesDialog(false)
  const handleViewDesignFiles = () => setOpenDesignFilesDialog(true)
  const handleCloseDesignFilesDialog = () => setOpenDesignFilesDialog(false)

  const handleStartWorking = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }
    setSubmitLoading(true)
    try {
      const updateData: any = {
        designerStatus: "In Progress",
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Work started!")
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      console.error("Error starting work:", error)
      toast.error(error || "Failed to start work")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }
    /* 
    // Commented out file check as per new requirement
    if (!fileUploadRef.current?.getSelectedFiles()?.length) {
      toast.error("Please upload design files before submitting")
      return
    }
    */
    setSubmitLoading(true)
    try {
      // Prepare update data - status becomes "Done" when designer clicks Done
      const updateData: any = {
        designerStatus: "Done", // This marks it as submitted for Admin approval
        designerRemarks: designerRemarks,
        clientApprovalSentAt: null, // Reset client approval so admin can send it again
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Task submitted successfully!")
      // Refresh order data
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      console.error("Error updating order:", error)
      toast.error(error || "Failed to update order")
    } finally {
      setSubmitLoading(false)
    }
  }

  const getFileNameFromPath = (path: string) => {
    return path?.split("/").pop() || "File"
  }

  if (pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!singleOrder) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>No order data found</Typography>
      </Box>
    )
  }

  // Check designer status and permissions
  const canEdit = singleOrder.designerStatus === "Pending" || singleOrder.designerStatus === "Rework"
  const isInProgress = singleOrder.designerStatus === "In Progress"
  const isDone = singleOrder.designerStatus === "Done"
  const isApproved = singleOrder.designerStatus === "Approved"
  const hasDesignFiles = singleOrder.designFiles && singleOrder.designFiles.length > 0
  const hasReworkHistory = singleOrder.reworkHistory && singleOrder.reworkHistory.length > 0

  return (
    <Box>
      {/* Order Details */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2} color="#1976D2">
          Order Details
        </Typography>
        {/* Row 1: Company, Party, Item */}
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="Company Name"
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Party Name"
            value={formData.partyName}
            onChange={(e) => handleInputChange("partyName", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="WhatsApp No"
            value={formData.ownerWhatsAppNo}
            onChange={(e) => handleInputChange("partyName", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Item Name"
            value={formData.itemName}
            onChange={(e) => handleInputChange("itemName", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          {/* </Box> */}
          {/* Row 2: Order Number, Quantity */}
          {/* <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}> */}
          <ThemeInput
            labelName="Quantity"
            value={formData.quantity}
            onChange={(e) => handleInputChange("quantity", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
        </Box>
        {/* Row 3: Size, Number, Start Number, End Number */}
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="Size"
            value={formData.size}
            onChange={(e) => handleInputChange("size", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Number"
            value={formData.number}
            onChange={(e) => handleInputChange("number", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Start Number"
            value={formData.startNumber}
            onChange={(e) => handleInputChange("startNumber", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="End Number"
            value={formData.endNumber}
            onChange={(e) => handleInputChange("endNumber", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
        </Box>
        {/* Row 4: Color, PType */}
        {/* Row 4: Color, PType, and conditional Color1/Color2 */}
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="Color"
            value={formData.color}
            onChange={(e) => handleInputChange("color", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />


          {/* Conditional Color1 field */}
          {(formData.color === "1" || formData.color === "2") && (
            <ThemeInput
              labelName="Color 1 Type"
              value={formData.color1}
              onChange={(e) => handleInputChange("color1", e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{ readOnly: true }}
            />
          )}

          {formData.color === "2" && (
            <ThemeInput
              labelName="Color 2 Type"
              value={formData.color2}
              onChange={(e) => handleInputChange("color2", e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{ readOnly: true }}
            />
          )}
        </Box>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="Printing Type"
            value={formData.pType}
            onChange={(e) => handleInputChange("pType", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Binder Type"
            value={formData.bindingType}
            onChange={(e) => handleInputChange("pType", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Binding Page"
            value={formData.bindingPage}
            onChange={(e) => handleInputChange("pType", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Booklet Folder Type"
            value={formData.bookletFolderType}
            onChange={(e) => handleInputChange("pType", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
        </Box>
        {/* Original Remarks */}
        <Box mb={2}>
          <ThemeInput
            labelName="Original Remarks"
            value={formData.remarks}
            onChange={(e) => handleInputChange("remarks", e.target.value)}
            multiline
            rows={2}
            sx={{ width: "100%" }}
            InputProps={{ readOnly: true }}
          />
        </Box>
      </Paper>
    
      {/* Design Files Section - Show when In Progress, Done, or Approved */}
      {(isInProgress || isDone || isApproved) && hasDesignFiles && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="#4CAF50">
            Design Files ({singleOrder.designFiles.length})
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleViewDesignFiles}
            sx={{
              color: "#4CAF50",
              borderColor: "#4CAF50",
              fontWeight: 600,
              textTransform: "none",
              fontSize: 16,
              py: 1.2,
              background: "#fff",
              "&:hover": { background: "#f0f9f0", borderColor: "#4CAF50" },
            }}
            startIcon={<AiOutlineEye />}
          >
            View All Design Files ({singleOrder.designFiles.length})
          </Button>
        </Paper>
      )}
      {/* Rework History Section - Show when exists */}
      {hasReworkHistory && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="#FF9800">
            Rework History ({singleOrder.reworkHistory.length})
          </Typography>
          <Stack spacing={2}>
            {singleOrder.reworkHistory.map((rework: any, index: number) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  border: "1px solid #FFE0B2",
                  borderRadius: 2,
                  bgcolor: "#FFF8E1",
                }}
              >
                <Typography fontWeight={500} fontSize={14} mb={1}>
                  Rework #{index + 1}
                </Typography>
                <Typography fontSize={12} color="#666" mb={1}>
                  Date: {formatDateToDDMMYYYY(rework.date)}
                </Typography>
                <Typography fontSize={13} color="#FF9800" mb={1}>
                  Remark: {rework.remark}
                </Typography>
                {rework.files && rework.files.length > 0 && (
                  <Box>
                    <Typography fontSize={12} color="#666" mb={1}>
                      Reference Files:
                    </Typography>
                    {rework.files.map((file: any, fileIndex: number) => (
                      <Button
                        key={fileIndex}
                        variant="outlined"
                        size="small"
                        startIcon={<AiOutlineEye />}
                        onClick={() => {
                          const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383"

                          let fileUrl = file.path;

                          if (file.path.startsWith("http")) {
                            fileUrl = file.path;
                          } else if (file.path.startsWith("/uploads")) {
                            fileUrl = `${BaseURL}${file.path}`;
                          } else {
                            if (file.path.startsWith("design/") ||
                              file.path.startsWith("general/") ||
                              file.path.startsWith("rework/") ||
                              file.path.startsWith("orders/")) {
                              fileUrl = `${BaseURL}/uploads/${file.path}`;
                            } else {
                              fileUrl = `${BaseURL}/api/filedownload/download/${encodeURIComponent(file.path)}?view=true`;
                            }
                          }

                          window.open(fileUrl, "_blank");
                        }}
                        sx={{
                          mr: 1,
                          mb: 1,
                          textTransform: "none",
                          fontSize: 12,
                          borderColor: "#FFE0B2",
                          color: "#FF9800",
                        }}
                      >
                        {file.path?.split("/").pop() || `File ${fileIndex + 1}`}
                      </Button>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
      {/* Designer Work Section - Only show when Pending, Rework or In Progress */}
      {(canEdit || isInProgress) && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="#4CAF50">
            {singleOrder.designerStatus === "Rework" ? "Rework Design" : "Designer Work"}
          </Typography>
          {singleOrder.designerStatus === "Rework" && (
            <Box mb={3} sx={{ p: 2, bgcolor: "#FFF8E1", borderRadius: 2, border: "1px solid #FFE0B2" }}>
              <Typography fontWeight={500} fontSize={14} mb={1} color="#FF9800">
                ⚠️ Rework Required
              </Typography>
              <Typography fontSize={13} color="#666">
                Please review the rework history above and make necessary changes.
              </Typography>
            </Box>
          )}

          {canEdit ? (
            <ThemeButton
              sx={{
                background: "#1976D2",
                color: "#fff",
                fontWeight: 600,
                fontSize: 18,
                borderRadius: 2,
                py: 1.2,
                "&:hover": {
                  background: "#1565C0",
                },
                width: "100%",
              }}
              onClick={handleStartWorking}
              disabled={submitLoading}
            >
              {submitLoading ? "Processing..." : "Start Working"}
            </ThemeButton>
          ) : (
            <>
              <Box mb={3}>
                <ThemeInput
                  labelName="Designer Remarks"
                  placeholder="Enter your remarks about the design work..."
                  value={designerRemarks}
                  onChange={(e) => setDesignerRemarks(e.target.value)}
                  multiline
                  rows={3}
                  sx={{ width: "100%" }}
                />
              </Box>

              {/* Submit Button */}
              <ThemeButton
                sx={{
                  background: "#4CAF50",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 2,
                  py: 1.2,
                  "&:hover": {
                    background: "#388E3C",
                  },
                  width: "100%",
                }}
                onClick={handleSubmit}
                disabled={submitLoading}
              >
                {submitLoading ? "Processing..." : "Mark as Done"}
              </ThemeButton>
            </>
          )}
        </Paper>
      )}
      {/* In Progress Status - Removed this section as we now show work section for In Progress */}
      {/* Completed/Approved Status */}
      {(isDone || isApproved) && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#E8F5E8" }}>
          <Typography variant="h6" fontWeight={600} mb={1} color="#4CAF50">
            {isApproved ? "✅ Design Approved" : "✅ Design Completed"}
          </Typography>
          <Typography fontSize={14} color="#666">
            {isApproved
              ? "Your task has been approved by the manager. Great work!"
              : "Task is completed and waiting for manager review."}
          </Typography>
          {singleOrder.designerRemarks && (
            <Box mt={2}>
              <Typography fontWeight={500} fontSize={14} mb={1}>
                Final Remarks:
              </Typography>
              <Typography fontSize={13} color="#666" sx={{ fontStyle: "italic" }}>
                "{singleOrder.designerRemarks}"
              </Typography>
            </Box>
          )}
        </Paper>
      )}
      {/* View Files Dialogs */}
      <ViewFilesDialog
        open={openFilesDialog}
        onClose={handleCloseFilesDialog}
        files={singleOrder?.filePaths?.map((file: any) => file.path) || []}
        title="Original Order Files"
        showDownload={true}
        showView={true}
      />
      <ViewFilesDialog
        open={openDesignFilesDialog}
        onClose={handleCloseDesignFilesDialog}
        files={singleOrder?.designFiles?.map((file: any) => file.path) || []}
        title="Design Files"
        showDownload={true}
        showView={true}
      />
    </Box>
  )
}

export default DesignerViewTask

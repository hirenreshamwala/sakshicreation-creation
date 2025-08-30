"use client"
import { useEffect, useRef, useState } from "react"
import { Box, Typography, Button, CircularProgress, Paper, Stack, TextField } from "@mui/material"
import { AiOutlineEye } from "react-icons/ai"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import FileUpload from "@/component/reusablecomponents/FileUpload"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { useAppDispatch, useAppSelector } from "@/store"
import { useRouter } from "next/router"
import { toast } from "react-toastify"
import { MdRemoveRedEye } from "react-icons/md" // Import MdRemoveRedEye

const DesignerViewTask = () => {
  const dispatch = useAppDispatch()
  const fileUploadRef = useRef<any>(null)
  const router = useRouter()
  const { id: orderId } = router.query
  const [openFilesDialog, setOpenFilesDialog] = useState(false)
  const [openDesignFilesDialog, setOpenDesignFilesDialog] = useState(false)
  const { singleOrder, loading } = useAppSelector((state) => state.orders)
  const [pageLoading, setPageLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    partyName: "",
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
      })
      setDesignerRemarks(singleOrder.designerRemarks || "")
    }
  }, [singleOrder])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleViewFiles = () => setOpenFilesDialog(true)
  const handleCloseFilesDialog = () => setOpenFilesDialog(false)
  const handleViewDesignFiles = () => setOpenDesignFilesDialog(true)
  const handleCloseDesignFilesDialog = () => setOpenDesignFilesDialog(false)

  const handleSubmit = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }
    if (!fileUploadRef.current?.getSelectedFiles()?.length) {
      toast.error("Please upload design files before submitting")
      return
    }
    setSubmitLoading(true)
    try {
      let designFiles: any[] = []
      // Upload design files if any are selected
      if (fileUploadRef.current) {
        const selectedFiles = fileUploadRef.current.getSelectedFiles()
        if (selectedFiles.length > 0) {
          const uploadedFileResults = await fileUploadRef.current.uploadSelectedFiles()
          designFiles = uploadedFileResults.map((file: any) => ({
            path: `${file.folder}/${file.filename}`,
            remark: designerRemarks,
            uploadedAt: new Date().toISOString(),
          }))
        }
      }
      // Prepare update data - status becomes "In Progress" when files are submitted
      const updateData: any = {
        designerStatus: "In Progress",
        designerRemarks: designerRemarks,
        designFiles: [...(singleOrder?.designFiles || []), ...designFiles],
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Design files uploaded successfully!")
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
    return path.split("/").pop() || "File"
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
  const handleViewFile = (file: any) => {
  try {
    const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";
    
    // Handle different file path formats
    if (file.path.startsWith('http')) {
      // Direct URL - open as is
      window.open(file.path, '_blank');
    } else if (file.path.startsWith('/uploads')) {
      // Relative path - construct URL
      window.open(`${BaseURL}${file.path}`, '_blank');
    } else {
      // For files in specific folders like 'orders/', 'design/', or 'rework/'
      if (file.path.startsWith('orders/') || file.path.startsWith('design/') || file.path.startsWith('rework/')) {
        window.open(`${BaseURL}/uploads/${file.path}`, '_blank');
      } else {
        // Fallback to download endpoint
        window.open(
          `${BaseURL}/api/filedownload/download/${encodeURIComponent(file.path)}?view=true`,
          '_blank'
        );
      }
    }
  } catch (error) {
    console.error('Error opening file:', error);
    toast.error('Failed to open file');
  }
};

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
            labelName="Order Number"
            value={formData.orderNumber}
            onChange={(e) => handleInputChange("orderNumber", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
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
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="Color"
            value={formData.color}
            onChange={(e) => handleInputChange("color", e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="PType"
            value={formData.pType}
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
      {/* Original Files - Show each file with its remark */}
      {singleOrder.filePaths && singleOrder.filePaths.length > 0 && (
  <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
    <Typography variant="h6" fontWeight={600} mb={2} color="#1976D2">
      Original Files ({singleOrder.filePaths.length})
    </Typography>
    <Stack spacing={2} mb={2}>
      {singleOrder.filePaths.map((file: any, index: number) => (
        <Box key={index} display="flex" gap={2} alignItems="flex-end" flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<MdRemoveRedEye />}
            onClick={() => handleViewFile(file)} // Use the reusable function
            sx={{
              minWidth: 160,
              height: 45,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#fff",
              borderColor: "#ccc",
              color: "#333",
            }}
          >
            {file.path?.split("/").pop() || `File ${index + 1}`}
          </Button>
          <Box flex={1} width="100%">
            <Typography fontSize={14} fontWeight={500} mb={0.5}>
              File Remarks
            </Typography>
            <TextField
              placeholder="Remarks…."
              fullWidth
              size="small"
              variant="outlined"
              value={file.remark || ""}
              InputProps={{ style: { backgroundColor: "#fff" }, readOnly: true }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
    <Button
      variant="outlined"
      fullWidth
      onClick={handleViewFiles}
      sx={{
        color: "#344054",
        borderColor: "#D0D5DD",
        fontWeight: 600,
        textTransform: "none",
        fontSize: 16,
        py: 1.2,
        background: "#fff",
        "&:hover": { background: "#f6fef9", borderColor: "#D0D5DD" },
      }}
      startIcon={<AiOutlineEye />}
    >
      View All Original Files ({singleOrder.filePaths.length})
    </Button>
  </Paper>
)}
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
                  Date: {new Date(rework.createdAt).toLocaleString()}
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
                          const viewUrl = `${BaseURL}/api/filedownload/download/${encodeURIComponent(
                            file.path,
                          )}?view=true`
                          window.open(viewUrl, "_blank")
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
      {/* Designer Work Section - Only show when can edit */}
      {canEdit && (
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
                Please review the rework history above and make necessary changes to the design files.
              </Typography>
            </Box>
          )}
           {/* File Upload for Design Files */}
          <Box mb={3}>
            <Typography fontWeight={500} mb={1}>
              Upload Design Files
            </Typography>
            <FileUpload
              ref={fileUploadRef}
              folder="design"
              multiple={true}
              accept="*/*"
              variant="dropzone"
              onFilesSelected={() => {}}
              onUploadError={(error) => toast.error(error)}
              showPreview={true}
              showUploadButton={false}
              autoUpload={false}
              label="Drop design files here or click to browse"
              helperText="Upload your completed design files (Images, PDFs, etc.)"
            />
          </Box>
          {/* Designer Remarks */}
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
            {submitLoading ? "Uploading..." : "Submit Design Files"}
          </ThemeButton>
        </Paper>
      )}
      {/* In Progress Status - Show when files are submitted */}
      {isInProgress && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#E8F5E8" }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="#4CAF50">
            🔄 Design In Progress
          </Typography>
          <Typography fontSize={14} color="#666" mb={2}>
            Your design files have been submitted and are currently under review by the manager.
          </Typography>
          {singleOrder.designerRemarks && (
            <Box mb={2}>
              <Typography fontWeight={500} fontSize={14} mb={1}>
                Your Remarks:
              </Typography>
              <Typography fontSize={13} color="#666" sx={{ fontStyle: "italic" }}>
                "{singleOrder.designerRemarks}"
              </Typography>
            </Box>
          )}
          <Typography fontSize={12} color="#666" sx={{ fontStyle: "italic" }}>
            Please wait for manager feedback. You will be notified if any changes are required.
          </Typography>
        </Paper>
      )}
      {/* Completed/Approved Status */}
      {(isDone || isApproved) && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#E8F5E8" }}>
          <Typography variant="h6" fontWeight={600} mb={1} color="#4CAF50">
            {isApproved ? "✅ Design Approved" : "✅ Design Completed"}
          </Typography>
          <Typography fontSize={14} color="#666">
            {isApproved
              ? "Your design has been approved by the manager. Great work!"
              : "Design work is completed and waiting for manager review."}
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

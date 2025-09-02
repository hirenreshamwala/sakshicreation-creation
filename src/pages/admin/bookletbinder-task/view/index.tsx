"use client"
import { useEffect, useRef, useState } from "react"
import { Box, Button, Typography, Paper, CircularProgress, Stack, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Grid, IconButton } from "@mui/material"
import { AiOutlineEye } from "react-icons/ai"
import AddIcon from '@mui/icons-material/Add';
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import ThemeCheckbox from "@/component/common_component/themecheckbox"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import FileUpload from "@/component/reusablecomponents/FileUpload"
import { useAppDispatch, useAppSelector } from "@/store"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { useRouter } from "next/router"
import { toast } from "react-toastify"

type PaperField = {
  paperName: string;
  numberOfSheetsUsed: string;
  sheetSize: string;
  paperType: string;
  gsm: string;
  ratePerUnit: string;
};

const BookletBinderTaskView = () => {
  const dispatch = useAppDispatch()
  const fileUploadRef = useRef<any>(null)
  const router = useRouter()
  const { id: orderId } = router.query
  const { singleOrder } = useAppSelector((state) => state.orders)

  const [pageLoading, setPageLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [openDesignFilesDialog, setOpenDesignFilesDialog] = useState(false)
  const [openBinderFilesDialog, setOpenBinderFilesDialog] = useState(false)
  const [openBookletFilesDialog, setOpenBookletFilesDialog] = useState(false)
  const [bookletBinderRemarks, setBookletBinderRemarks] = useState("")
  const [bookletBinderWastedSheet, setBookletBinderWastedSheet] = useState("")
  const [uploadedBookletFiles, setUploadedBookletFiles] = useState<any[]>([])
  const [bookletPapers, setBookletPapers] = useState<PaperField[]>([])
  const [formData, setFormData] = useState({
    size: "",
    qty: "",
    isLamination: "No",
    laminationType: "",
    uv: "No",
    numberOfSheetUsed: "",
    sheetSize: "",
    paperType: "",
    gsm: "",
    ratePerUnit: "",
    isPasting: false,
    isCutting: false,
    isCreasing: false,
    isFoil: false,
    isPunching: false,
  })

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

  // Populate local state when singleOrder changes
  useEffect(() => {
    if (singleOrder) {
      setBookletBinderRemarks(singleOrder.bookletBinderRemarks || "")
      setBookletBinderWastedSheet(singleOrder.bookletBinderWastedSheet?.toString() || "")
      setUploadedBookletFiles(singleOrder.bookletBinderFiles || [])
      setFormData({
        size: singleOrder.size || "",
        qty: singleOrder.qty?.toString() || "",
        isLamination: singleOrder.isLamination ? "Yes" : "No",
        laminationType: singleOrder.laminationType || "",
        uv: singleOrder.uv || "No",
        numberOfSheetUsed: singleOrder.numberOfSheetUsed || "",
        sheetSize: singleOrder.sheetSize || "",
        paperType: singleOrder.paperType || "",
        gsm: singleOrder.gsm || "",
        ratePerUnit: singleOrder.ratePerUnit || "",
        isPasting: singleOrder.isPasting || false,
        isCutting: singleOrder.isCutting || false,
        isCreasing: singleOrder.isCreasing || false,
        isFoil: singleOrder.isFoil || false,
        isPunching: singleOrder.isPunching || false,
      })
      // Initialize booklet papers
      const printerPaperCount = singleOrder.printerPapers?.length || 0
      const binderPaperCount = singleOrder.binderPapers?.length || 0
      const totalPreviousPapers = printerPaperCount + binderPaperCount
      if (singleOrder.bookletPapers && singleOrder.bookletPapers.length > 0) {
        setBookletPapers(singleOrder.bookletPapers)
      } else {
        setBookletPapers([{
          paperName: `Paper-${totalPreviousPapers + 1}`,
          numberOfSheetsUsed: "",
          sheetSize: "",
          paperType: "",
          gsm: "",
          ratePerUnit: ""
        }])
      }
    }
  }, [singleOrder])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBookletFilesSelected = (selectedFiles: File[]) => {
    const newFileList = selectedFiles.map((file) => ({
      path: file.name,
      remark: "",
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      isNew: true,
    }))
    setUploadedBookletFiles((prev) => [...prev, ...newFileList])
  }

  const handleBookletFileRemoved = (removedFile: File) => {
    setUploadedBookletFiles((prev) =>
      prev.filter((file) => !(file.isNew && file.file && file.file.name === removedFile.name))
    )
  }

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error)
    toast.error(error)
  }

  const handleViewDesignFiles = () => setOpenDesignFilesDialog(true)
  const handleCloseDesignFilesDialog = () => setOpenDesignFilesDialog(false)

  const handleViewBinderFiles = () => setOpenBinderFilesDialog(true)
  const handleCloseBinderFilesDialog = () => setOpenBinderFilesDialog(false)

  const handleViewBookletFiles = () => setOpenBookletFilesDialog(true)
  const handleCloseBookletFilesDialog = () => setOpenBookletFilesDialog(false)

  const handleAddBookletPaper = () => {
    const printerPaperCount = singleOrder?.printerPapers?.length || 0
    const binderPaperCount = singleOrder?.binderPapers?.length || 0
    const bookletPaperCount = bookletPapers.length
    const totalPreviousPapers = printerPaperCount + binderPaperCount
    setBookletPapers([...bookletPapers, {
      paperName: `Paper-${totalPreviousPapers + bookletPaperCount + 1}`,
      numberOfSheetsUsed: "",
      sheetSize: "",
      paperType: "",
      gsm: "",
      ratePerUnit: ""
    }])
  }

  const handleBookletPaperChange = (index: number, field: keyof PaperField, value: string) => {
    const updatedPapers = [...bookletPapers]
    updatedPapers[index] = {
      ...updatedPapers[index],
      [field]: value
    }
    setBookletPapers(updatedPapers)
  }

  const handleUpdateStatus = async (orderId: string, statusType: string, status: string) => {
    try {
      setSubmitLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statusType,
          status,
        }),
      })

      if (response.ok) {
        await dispatch(getOrderByIdThunk(orderId)).unwrap()
        toast.success(`Status updated to ${status}`)
      } else {
        console.error("Failed to update status")
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Error updating status")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }

    const bookletBinderWastedSheetNum = Number(bookletBinderWastedSheet)
    if (isNaN(bookletBinderWastedSheetNum) || bookletBinderWastedSheetNum < 0) {
      toast.error("Booklet Binder Wasted Sheet must be a non-negative number")
      return
    }

    const qtyNum = Number(formData.qty)
    if (isNaN(qtyNum) || qtyNum < 1) {
      toast.error("Quantity must be a number greater than or equal to 1")
      return
    }

    if (formData.isLamination === "Yes" && !["Matte", "Gloss"].includes(formData.laminationType)) {
      toast.error("Lamination type must be 'Matte' or 'Gloss' when lamination is selected")
      return
    }

    // Validate booklet papers
    for (const paper of bookletPapers) {
      if (!paper.numberOfSheetsUsed || !paper.sheetSize || !paper.paperType || !paper.gsm || !paper.ratePerUnit) {
        toast.error("All paper fields must be filled")
        return
      }
    }

    setSubmitLoading(true)
    try {
      let newBookletFiles: any[] = []
      if (fileUploadRef.current) {
        const selectedFiles = fileUploadRef.current.getSelectedFiles()
        if (selectedFiles.length > 0) {
          const uploadedFileResults = selectedFiles.map((file: File) => ({
            folder: "booklet-files",
            filename: file.name,
          }))
          newBookletFiles = uploadedFileResults.map((file: any) => ({
            path: `${file.folder}/${file.filename}`,
            remark: bookletBinderRemarks,
            uploadedAt: new Date().toISOString(),
          }))
        }
      }

      const allBookletFiles = [...(singleOrder?.bookletBinderFiles || []), ...newBookletFiles.filter((f) => !f.isNew)]
      const currentDate = new Date().toISOString().split('T')[0]

      const updateData: any = {
        bookletBinderStatus: "Done",
        status: "Delivery",
        bookletBinderRemarks,
        bookletBinderWastedSheet: bookletBinderWastedSheetNum,
        bookletBinderFiles: allBookletFiles,
        bookletPapers, // Include booklet papers
        size: formData.size,
        qty: qtyNum,
        isLamination: formData.isLamination === "Yes",
        laminationType: formData.isLamination === "Yes" ? formData.laminationType : "",
        uv: formData.uv,
        numberOfSheetUsed: formData.numberOfSheetUsed,
        sheetSize: formData.sheetSize,
        paperType: formData.paperType,
        gsm: formData.gsm,
        ratePerUnit: formData.ratePerUnit,
        isPasting: formData.isPasting,
        isCutting: formData.isCutting,
        isCreasing: formData.isCreasing,
        isFoil: formData.isFoil,
        isPunching: formData.isPunching,
        receivedDate: currentDate
      }

      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Booklet binder task updated successfully!")
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      console.error("Error updating booklet binder task:", error)
      toast.error(error?.message || "Failed to update booklet binder task")
    } finally {
      setSubmitLoading(false)
    }
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

  const isHeld = singleOrder?.status === "Hold"
  const isBookletBinderWorkDone = singleOrder.bookletBinderStatus === "Done"
  const canEditBookletBinderTask = !isHeld && !isBookletBinderWorkDone
  const isPrinterStatusDone = singleOrder.printerStatus === "Done"
  const isBinderStatusDone = singleOrder.binderStatus === "Done" || singleOrder.binderStatus === "Pending"

  return (
    <Box>
      {/* Order Details */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600} color="#1976D2">
            Order Details
          </Typography>
          {singleOrder.bookletBinderStatus === "Pending" && (
            <ThemeButton
              sx={{
                background: "#1976D2",
                color: "#fff",
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 2,
                py: 1,
                px: 2.5,
                "&:hover": { background: "#1565C0" },
              }}
              onClick={() => handleUpdateStatus(singleOrder._id, "bookletBinder", "In Progress")}
            >
              Start Task
            </ThemeButton>
          )}
        </Box>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="Company Name"
            value={singleOrder.companyName?.companyName || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Party Name"
            value={singleOrder.party?.partyName || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Item Name"
            value={singleOrder.productItem?.itemName || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
        </Box>
        <Box mb={2}>
          <ThemeInput
            labelName="Original Remarks"
            value={singleOrder.remarks || "N/A"}
            multiline
            rows={2}
            sx={{ width: "100%" }}
            InputProps={{ readOnly: true }}
          />
        </Box>
      </Paper>

      {/* Design Files Section */}
      {singleOrder.designFiles && singleOrder.designFiles.length > 0 && (
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

      {/* Binder Files Section */}
      {singleOrder.binderFiles && singleOrder.binderFiles.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="#FF9800">
            Binder Files ({singleOrder.binderFiles.length})
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleViewBinderFiles}
            sx={{
              color: "#FF9800",
              borderColor: "#FF9800",
              fontWeight: 600,
              textTransform: "none",
              fontSize: 16,
              py: 1.2,
              background: "#fff",
              "&:hover": { background: "#fff8e1", borderColor: "#FF9800" },
            }}
            startIcon={<AiOutlineEye />}
          >
            View All Binder Files ({singleOrder.binderFiles.length})
          </Button>
        </Paper>
      )}

      {/* Booklet Binder Work Section */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2} color="#9C27B0">
          Booklet Binder Work
        </Typography>

        {isHeld && (
          <Box mb={3} sx={{ p: 2, bgcolor: "#FFF0F0", borderRadius: 2, border: "1px solid #F04438" }}>
            <Typography fontWeight={500} fontSize={14} mb={1} color="#F04438">
              🚫 Order On Hold
            </Typography>
            <Typography fontSize={13} color="#666">
              This order is currently on hold. You cannot update the booklet binder task until it is unheld.
            </Typography>
          </Box>
        )}

        {isBookletBinderWorkDone && (
          <Box mb={3} sx={{ p: 2, bgcolor: "#E8F5E8", borderRadius: 2, border: "1px solid #4CAF50" }}>
            <Typography fontWeight={500} fontSize={14} mb={1} color="#4CAF50">
              ✅ Booklet Binder Work Completed
            </Typography>
            <Typography fontSize={13} color="#666">
              This booklet binder task has been marked as done.
            </Typography>
          </Box>
        )}

        {/* Display Printer Papers */}
        {/* {isPrinterStatusDone && singleOrder?.printerPapers?.length > 0 && (
          <Box mb={3}>
            <Typography fontWeight={600} mb={2}>
              Printer Papers
            </Typography>
            {singleOrder.printerPapers.map((paper, index) => (
              <Box key={`printer-${index}`} mb={2} p={2} border={1} borderRadius={2} borderColor="#ddd">
                <Typography fontWeight={600}>{paper.paperName}</Typography>
                <Stack direction="row" spacing={2} mt={1}>
                  <ThemeInput
                    labelName="Number of Sheets Used"
                    value={paper.numberOfSheetsUsed}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <ThemeInput
                    labelName="Sheet Size"
                    value={paper.sheetSize}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <ThemeInput
                    labelName="Paper Type"
                    value={paper.paperType}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <ThemeInput
                    labelName="GSM"
                    value={paper.gsm}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <ThemeInput
                    labelName="Rate / Unit"
                    value={paper.ratePerUnit}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Stack>
              </Box>
            ))}
          </Box>
        )} */}

        {/* Display Binder Papers */}
        {/* {isBinderStatusDone && singleOrder?.binderPapers?.length > 0 && (
          <Box mb={3}>
            <Typography fontWeight={600} mb={2}>
              Binder Papers
            </Typography>
            {singleOrder.binderPapers.map((paper, index) => (
              <Box key={`binder-${index}`} mb={2} p={2} border={1} borderRadius={2} borderColor="#ddd">
                <Typography fontWeight={600}>{paper.paperName}</Typography>
                <Stack direction="row" spacing={2} mt={1}>
                  <ThemeInput
                    labelName="Number of Sheets Used"
                    value={paper.numberOfSheetsUsed}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <ThemeInput
                    labelName="Sheet Size"
                    value={paper.sheetSize}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <ThemeInput
                    labelName="Paper Type"
                    value={paper.paperType}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <ThemeInput
                    labelName="GSM"
                    value={paper.gsm}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <ThemeInput
                    labelName="Rate / Unit"
                    value={paper.ratePerUnit}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Stack>
              </Box>
            ))}
          </Box>
        )} */}

        {/* Booklet Papers Section */}
        <Box mb={3}>
          <Typography fontWeight={600} mb={2}>
            Booklet Papers
          </Typography>
          {bookletPapers.map((paper, index) => (
            <Box key={`booklet-${index}`} mb={2} p={2} border={1} borderRadius={2} borderColor="#ddd">
              <Typography fontWeight={600}>{paper.paperName}</Typography>
              <Stack direction="row" spacing={2} mt={1}>
                <ThemeInput
                  labelName="Number of Sheets Used"
                  value={paper.numberOfSheetsUsed}
                  onChange={(e) => handleBookletPaperChange(index, 'numberOfSheetsUsed', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditBookletBinderTask }}
                />
                <ThemeInput
                  labelName="Sheet Size"
                  value={paper.sheetSize}
                  onChange={(e) => handleBookletPaperChange(index, 'sheetSize', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditBookletBinderTask }}
                />
                <ThemeInput
                  labelName="Paper Type"
                  value={paper.paperType}
                  onChange={(e) => handleBookletPaperChange(index, 'paperType', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditBookletBinderTask }}
                />
                <ThemeInput
                  labelName="GSM"
                  value={paper.gsm}
                  onChange={(e) => handleBookletPaperChange(index, 'gsm', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditBookletBinderTask }}
                />
                <ThemeInput
                  labelName="Rate / Unit"
                  value={paper.ratePerUnit}
                  onChange={(e) => handleBookletPaperChange(index, 'ratePerUnit', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditBookletBinderTask }}
                />
              </Stack>
            </Box>
          ))}
         {/* {canEditBookletBinderTask && (
          <Box display="flex" justifyContent="flex-end">
            <ThemeButton
              onClick={handleAddBookletPaper}
              disabled={!canEditBookletBinderTask}
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: "#6366F1",
                borderRadius: "8px",
                color: "#fff",
                "&:hover": { backgroundColor: "#4F46E5" },
              }}
            >
              Add Booklet Paper
            </ThemeButton>
          </Box>
        )} */}
        </Box>

        {/* Booklet Binder Specs */}
        <Box mb={3}>
          <Typography fontWeight={600} mb={2}>
            Booklet Specifications
          </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <ThemeInput
                  labelName="Size"
                  value={formData.size}
                  onChange={(e) => handleInputChange("size", e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditBookletBinderTask }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ThemeInput
                  labelName="Qty"
                  value={formData.qty}
                  onChange={(e) => handleInputChange("qty", e.target.value)}
                  type="number"
                  fullWidth
                  InputProps={{ readOnly: !canEditBookletBinderTask }}
                />
              </Grid>

              {/* Lamination */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl component="fieldset" disabled={!canEditBookletBinderTask}>
                  <FormLabel component="legend">Lamination</FormLabel>
                  <RadioGroup
                    row
                    value={formData.isLamination}
                    onChange={(e) => handleInputChange("isLamination", e.target.value)}
                  >
                    <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="No" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {formData.isLamination === "Yes" && (
                <Grid item xs={12} sm={6} md={3}>
                  <ThemeInput
                    labelName="Lamination Type"
                    value={formData.laminationType}
                    onChange={(e) => handleInputChange("laminationType", e.target.value)}
                    placeholder="e.g., Matte, Gloss"
                    fullWidth
                    InputProps={{ readOnly: !canEditBookletBinderTask }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl component="fieldset" disabled={!canEditBookletBinderTask}>
                  <FormLabel component="legend">UV</FormLabel>
                  <RadioGroup
                    row
                    value={formData.uv}
                    onChange={(e) => handleInputChange("uv", e.target.value)}
                  >
                    <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="No" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            <Grid item xs={12} sm={6} md={3}>
            {/* <ThemeInput
              labelName="Number of Sheets Used"
              value={formData.numberOfSheetUsed}
              onChange={(e) => handleInputChange("numberOfSheetUsed", e.target.value)}
              type="number"
              fullWidth
              InputProps={{ readOnly: !canEditBookletBinderTask }}
            /> */}
          </Grid>
          {/* <Grid item xs={12} sm={6} md={3}>
            <ThemeInput
              labelName="Sheet Size"
              value={formData.sheetSize}
              onChange={(e) => handleInputChange("sheetSize", e.target.value)}
              fullWidth
              InputProps={{ readOnly: !canEditBookletBinderTask }}
            />
          </Grid> */}
          {/* <Grid item xs={12} sm={6} md={3}>
            <ThemeInput
              labelName="Paper Type"
              value={formData.paperType}
              onChange={(e) => handleInputChange("paperType", e.target.value)}
              fullWidth
              InputProps={{ readOnly: !canEditBookletBinderTask }}
            />
          </Grid> */}
          {/* <Grid item xs={12} sm={6} md={3}>
            <ThemeInput
              labelName="GSM"
              value={formData.gsm}
              onChange={(e) => handleInputChange("gsm", e.target.value)}
              fullWidth
              InputProps={{ readOnly: !canEditBookletBinderTask }}
            />
          </Grid> */}
            {/* <Grid item xs={12} sm={6} md={3}>
              <ThemeInput
              labelName="Rate / Unit"
              value={formData.ratePerUnit}
              onChange={(e) => handleInputChange("ratePerUnit", e.target.value)}
              type="number"
              fullWidth
              InputProps={{ readOnly: !canEditBookletBinderTask }}
            />
          </Grid> */}
        </Grid>
        </Box>

        {/* Additional Options */}
        <Box display="flex" gap={4} justifyContent={"space-between"} my={2}>
            <ThemeCheckbox
              label="Pasting"
              checked={formData.isPasting}
              onChange={(e) => handleInputChange("isPasting", e.target.checked)}
              disabled={!canEditBookletBinderTask}
            />
            <ThemeCheckbox
              label="Cutting"
              checked={formData.isCutting}
              onChange={(e) => handleInputChange("isCutting", e.target.checked)}
              disabled={!canEditBookletBinderTask}
            />
            <ThemeCheckbox
              label="Creasing"
              checked={formData.isCreasing}
              onChange={(e) => handleInputChange("isCreasing", e.target.checked)}
              disabled={!canEditBookletBinderTask}
            />
            <ThemeCheckbox
              label="Foil"
              checked={formData.isFoil}
              onChange={(e) => handleInputChange("isFoil", e.target.checked)}
              disabled={!canEditBookletBinderTask}
            />
            <ThemeCheckbox
              label="Punching"
              checked={formData.isPunching}
              onChange={(e) => handleInputChange("isPunching", e.target.checked)}
              disabled={!canEditBookletBinderTask}
            />
            {/* <ThemeCheckbox
              label="Paper-1"
              checked={formData.isPaper1}
              onChange={(e) => handleInputChange("isPaper1", e.target.checked)}
              disabled={!canEditBookletBinderTask}
            />
            <ThemeCheckbox
              label="Paper-2"
              checked={formData.isPaper2}
              onChange={(e) => handleInputChange("isPaper2", e.target.checked)}
              disabled={!canEditBookletBinderTask}
            /> */}
          </Box>

        {/* Booklet Binder Wasted Sheet */}
        <Box mb={3}>
          <ThemeInput
            labelName="Booklet Binder Wasted Sheet"
            placeholder="Enter number of wasted sheets"
            value={bookletBinderWastedSheet}
            onChange={(e) => setBookletBinderWastedSheet(e.target.value)}
            type="number"
            sx={{ width: "100%" }}
            InputProps={{ readOnly: !canEditBookletBinderTask }}
          />
        </Box>

        {/* Booklet Binder Remarks */}
        <Box mb={3}>
          <ThemeInput
            labelName="Booklet Binder Remarks"
            placeholder="Enter your remarks about the booklet binding work..."
            value={bookletBinderRemarks}
            onChange={(e) => setBookletBinderRemarks(e.target.value)}
            multiline
            rows={3}
            sx={{ width: "100%" }}
            InputProps={{ readOnly: !canEditBookletBinderTask }}
          />
        </Box>

        {/* File Upload for Booklet Binder Files */}
        <Box mb={3}>
          <Typography fontWeight={500} mb={1}>
            Upload Booklet Binder Files (Optional)
          </Typography>
          <FileUpload
            ref={fileUploadRef}
            folder="booklet-files"
            multiple={true}
            accept="*/*"
            variant="dropzone"
            onFilesSelected={handleBookletFilesSelected}
            onFileRemoved={handleBookletFileRemoved}
            onUploadError={handleUploadError}
            showPreview={true}
            showUploadButton={false}
            autoUpload={false}
            label="Drop booklet files here or click to browse"
            helperText="Upload any relevant files related to the booklet binding process (e.g., proofs, samples)"
            disabled={!canEditBookletBinderTask}
          />
        </Box>

        {/* View Booklet Files */}
        {uploadedBookletFiles && uploadedBookletFiles.length > 0 && (
          <Box mb={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleViewBookletFiles}
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
              View All Booklet Files ({uploadedBookletFiles.length})
            </Button>
          </Box>
        )}

        {/* Submit Button */}
        {singleOrder.bookletBinderStatus === "In Progress" && (
        <ThemeButton
          sx={{
            background: "#12B76A",
            color: "#fff",
            fontWeight: 600,
            fontSize: 18,
            borderRadius: 2,
            py: 1.2,
            mt: 1,
            "&:hover": { background: "#079455" },
            width: "100%",
          }}
          onClick={handleSubmit}
          disabled={submitLoading || !canEditBookletBinderTask}
        >
          {submitLoading ? "Updating..." : "Mark As Done"}
        </ThemeButton>
        )}
      </Paper>

      {/* View Files Dialogs */}
      <ViewFilesDialog
        open={openDesignFilesDialog}
        onClose={handleCloseDesignFilesDialog}
        files={singleOrder?.designFiles?.map((file: any) => file.path) || []}
        title="Design Files"
        showDownload={true}
        showView={true}
      />
      <ViewFilesDialog
        open={openBinderFilesDialog}
        onClose={handleCloseBinderFilesDialog}
        files={singleOrder?.binderFiles?.map((file: any) => file.path) || []}
        title="Binder Files"
        showDownload={true}
        showView={true}
      />
      <ViewFilesDialog
        open={openBookletFilesDialog}
        onClose={handleCloseBookletFilesDialog}
        files={uploadedBookletFiles.map((file: any) => file.path) || []}
        title="Booklet Binder Files"
        showDownload={true}
        showView={true}
      />
    </Box>
  )
}

export default BookletBinderTaskView
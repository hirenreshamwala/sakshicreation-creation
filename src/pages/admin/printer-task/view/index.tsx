"use client"
import { useEffect, useRef, useState } from "react"
import { Box, Button, Typography, Paper, CircularProgress, Stack, IconButton } from "@mui/material"
import { AiOutlineEye } from "react-icons/ai"
import AddIcon from '@mui/icons-material/Add';
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import FileUpload from "@/component/reusablecomponents/FileUpload"
import { useAppDispatch, useAppSelector } from "@/store"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { useRouter } from "next/router"
import { toast } from "react-toastify"
import ThemeSelect from "@/component/common_component/themeselect";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";

type PaperField = {
  paperName: string;
  numberOfSheetsUsed: string;
  sheetSize: string;
  paperType: string;
  gsm: string;
  ratePerUnit: string;
};

const PrinterTaskView = () => {
  const dispatch = useAppDispatch()
  const fileUploadRef = useRef<any>(null)
  const router = useRouter()
  const { id: orderId } = router.query
  const { singleOrder } = useAppSelector((state) => state.orders)
  const { materials } = useAppSelector(state => state.materials);
  const [pageLoading, setPageLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [openDesignFilesDialog, setOpenDesignFilesDialog] = useState(false)
  const [openPrinterFilesDialog, setOpenPrinterFilesDialog] = useState(false)
  const [printerRemarks, setPrinterRemarks] = useState("")
  const [printerWastedSheet, setPrinterWastedSheet] = useState("")
  const [uploadedPrinterFiles, setUploadedPrinterFiles] = useState<any[]>([])
  const [printerPapers, setPrinterPapers] = useState<PaperField[]>([])
  const [paperFields, setPaperFields] = useState<PaperField[]>([]);

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
      setPrinterRemarks(singleOrder.printerRemarks || "")
      setPrinterWastedSheet(singleOrder.printerWastedSheet?.toString() || "")
      setUploadedPrinterFiles(singleOrder.printerFiles || [])
      // Initialize printer papers
      if (singleOrder.printerPapers && singleOrder.printerPapers.length > 0) {
        setPrinterPapers(singleOrder.printerPapers)
      } else {
        setPrinterPapers([{
          paperName: "Paper-1",
          numberOfSheetsUsed: "",
          sheetSize: "",
          paperType: "",
          gsm: "",
          ratePerUnit: ""
        }])
      }
    }
  }, [singleOrder])

  const handlePrinterFilesSelected = (selectedFiles: File[]) => {
    const newFileList = selectedFiles.map((file) => ({
      path: file.name,
      remark: "",
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      isNew: true,
    }))
    setUploadedPrinterFiles((prev) => [...prev, ...newFileList])
  }

  const handlePrinterFileRemoved = (removedFile: File) => {
    setUploadedPrinterFiles((prev) =>
      prev.filter((file) => !(file.isNew && file.file && file.file.name === removedFile.name))
    )
  }

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error)
    toast.error(error)
  }

  useEffect(() => {
    dispatch(getAllMaterialsThunk());
  }, []);

  const handleViewDesignFiles = () => setOpenDesignFilesDialog(true)
  const handleCloseDesignFilesDialog = () => setOpenDesignFilesDialog(false)

  const handleViewPrinterFiles = () => setOpenPrinterFilesDialog(true)
  const handleClosePrinterFilesDialog = () => setOpenPrinterFilesDialog(false)

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

  const handleAddPrinterPaper = () => {
    const paperCount = printerPapers.length
    setPrinterPapers([...printerPapers, {
      paperName: `Paper-${paperCount + 1}`,
      numberOfSheetsUsed: "",
      sheetSize: "",
      paperType: "",
      gsm: "",
      ratePerUnit: ""
    }])
  }

  const handlePrinterPaperChange = (index: number, field: keyof PaperField, value: string) => {
    const updatedPapers = [...printerPapers]
    updatedPapers[index] = {
      ...updatedPapers[index],
      [field]: value
    }
    setPrinterPapers(updatedPapers)
  }

  const handleSubmit = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }

    const printerWastedSheetNum = Number(printerWastedSheet)
    if (isNaN(printerWastedSheetNum) || printerWastedSheetNum < 0) {
      toast.error("Printer Wasted Sheet must be a non-negative number")
      return
    }

    // Validate printer papers
    for (const paper of printerPapers) {
      if (!paper.numberOfSheetsUsed || !paper.sheetSize || !paper.paperType || !paper.gsm || !paper.ratePerUnit) {
        toast.error("All paper fields must be filled")
        return
      }
    }

    setSubmitLoading(true)
    try {
      let newPrinterFiles: any[] = []
      if (fileUploadRef.current) {
        const selectedFiles = fileUploadRef.current.getSelectedFiles()
        if (selectedFiles.length > 0) {
          const uploadedFileResults = selectedFiles.map((file: File) => ({
            folder: "printer-files",
            filename: file.name,
          }))
          newPrinterFiles = uploadedFileResults.map((file: any) => ({
            path: `${file.folder}/${file.filename}`,
            remark: printerRemarks,
            uploadedAt: new Date().toISOString(),
          }))
        }
      }

      const allPrinterFiles = [
        ...(singleOrder?.printerFiles || []),
        ...newPrinterFiles.filter((f) => !f.isNew),
      ]

      const updateData: any = {
        printerStatus: "Done",
        printerRemarks,
        printerWastedSheet: printerWastedSheetNum,
        printerFiles: allPrinterFiles,
        printerPapers, // Include printer papers
      }

      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Printer task updated successfully!")
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      console.error("Error updating printer task:", error)
      toast.error(error?.message || "Failed to update printer task")
    } finally {
      setSubmitLoading(false)
    }
  }

  const materialNameOptions = Array.from(new Set(materials.map(material => material.materialName))).map(name => ({
    value: name,
    label: name
  }));

  const getMaterialGSMOptions = (materialName: string) => {
    const filteredMaterials = materials.filter(material => material.materialName === materialName);
    return Array.from(new Set(filteredMaterials.map(material => material.materialGSM.toString()))).map(gsm => ({
      value: gsm,
      label: `${gsm} GSM`
    }));
  };

  const getMaterialSizeOptions = (materialName: string, materialGSM: string) => {
    const filteredMaterials = materials.filter(
      material =>
        material.materialName === materialName &&
        material.materialGSM.toString() === materialGSM
    );
    return Array.from(new Set(filteredMaterials.map(material => material.materialSize))).map(size => ({
      value: size,
      label: size
    }));
  };

  // Handle material selection for a specific paper field
  const handleMaterialNameChange = (index: number, value: string) => {
    const updatedFields = [...paperFields];
    updatedFields[index] = {
      ...updatedFields[index],
      materialName: value,
      paperType: value,
      gsm: "", // Reset GSM when material name changes
      materialSize: "", // Reset size when material name changes
    };
    setPaperFields(updatedFields);
  };

  const handleMaterialGSMChange = (index: number, value: string) => {
    const updatedFields = [...paperFields];
    updatedFields[index] = {
      ...updatedFields[index],
      gsm: value,
      materialSize: "", // Reset size when GSM changes
    };
    setPaperFields(updatedFields);
  };

  const handleMaterialSizeChange = (index: number, value: string) => {
    const updatedFields = [...paperFields];
    updatedFields[index] = {
      ...updatedFields[index],
      materialSize: value,
      sheetSize: value // Set sheetSize to match material size
    };
    setPaperFields(updatedFields);
  };

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
  const isPrinterWorkDone = singleOrder.printerStatus === "Done"
  const canEditPrinterTask = !isHeld && !isPrinterWorkDone

  return (
    <Box>
      {/* Order Details */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600} color="#1976D2">
            Order Details
          </Typography>
          {singleOrder.printerStatus === "Pending" && (
            <ThemeButton
              sx={{
                background: "#1976D2",
                color: "#fff",
                fontWeight: 600,
                fontSize: 18,
                borderRadius: 2,
                py: 1.2,
                "&:hover": { background: "#1565C0" },
                width: "auto",
              }}
              onClick={() => handleUpdateStatus(singleOrder._id, "printer", "In Progress")}
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
          <ThemeInput
            labelName="Order Number"
            value={singleOrder.orderNumber || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Quantity"
            value={singleOrder.qty?.toString() || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
        </Box>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="Size"
            value={singleOrder.size || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Binding"
            value={singleOrder.binding || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Sub Paper"
            value={singleOrder.subPaper || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Used Paper"
            value={singleOrder.usedPaper || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Printing Type"
            value={singleOrder.pType || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
        </Box>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="Printing Rate"
            value={singleOrder.printingrate || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Printing Rate Per Unit"
            value={singleOrder.printingratePerUnit || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="GSM"
            value={singleOrder.gsm || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Raw Paper Size"
            value={singleOrder.rowPaperSize || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Raw Paper User"
            value={singleOrder.rowPaperUser || "N/A"}
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

      {/* Printer Work Section */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2} color="#FF9800">
          Printer Work
        </Typography>

        {isHeld && (
          <Box mb={3} sx={{ p: 2, bgcolor: "#FFF0F0", borderRadius: 2, border: "1px solid #F04438" }}>
            <Typography fontWeight={500} fontSize={14} mb={1} color="#F04438">
              🚫 Order On Hold
            </Typography>
            <Typography fontSize={13} color="#666">
              This order is currently on hold. You cannot update the printer task until it is unheld.
            </Typography>
          </Box>
        )}

        {isPrinterWorkDone && (
          <Box mb={3} sx={{ p: 2, bgcolor: "#E8F5E8", borderRadius: 2, border: "1px solid #4CAF50" }}>
            <Typography fontWeight={500} fontSize={14} mb={1} color="#4CAF50">
              ✅ Printer Work Completed
            </Typography>
            <Typography fontSize={13} color="#666">
              This printer task has been marked as done.
            </Typography>
          </Box>
        )}

        {/* Printer Papers Section */}
        <Box mb={3}>
          <Typography fontWeight={600} mb={2}>
            Printer Papers
          </Typography>
          {printerPapers.map((paper, index) => (
            <Box key={`printer-${index}`} mb={2} p={2} border={1} borderRadius={2} borderColor="#ddd">
              <Typography fontWeight={600}>{paper.paperName}</Typography>
              <Stack direction="row" spacing={2} mt={1}>
                <ThemeSelect
                  label="Paper Type"
                  options={materialNameOptions}
                  value={materialNameOptions.find(opt => opt.value === paper.paperType) || null}
                  onChange={(e, newValue) => handleMaterialNameChange(index, newValue?.value as string || "")}
                  required
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeSelect
                  label="GSM"
                  options={getMaterialGSMOptions(paper.paperType)}
                  value={getMaterialGSMOptions(paper.paperType).find(opt => opt.value === paper.gsm) || null}
                  onChange={(e, newValue) => handleMaterialGSMChange(index, newValue?.value as string || "")}
                  required
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeSelect
                  label="Size"
                  options={getMaterialSizeOptions(paper.paperType, paper.gsm)}
                  value={getMaterialSizeOptions(paper.paperType, paper.gsm).find(opt => opt.value === paper.materialSize) || null}
                  onChange={(e, newValue) => handleMaterialSizeChange(index, newValue?.value as string || "")}
                  required
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeInput
                  labelName="Number of Sheets Used"
                  value={paper.numberOfSheetsUsed}
                  onChange={(e) => handlePrinterPaperChange(index, 'numberOfSheetsUsed', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeInput
                  labelName="Sheet Size"
                  value={paper.sheetSize}
                  onChange={(e) => handlePrinterPaperChange(index, 'sheetSize', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeInput
                  labelName="Paper Type"
                  value={paper.paperType}
                  onChange={(e) => handlePrinterPaperChange(index, 'paperType', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeInput
                  labelName="GSM"
                  value={paper.gsm}
                  onChange={(e) => handlePrinterPaperChange(index, 'gsm', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
                <ThemeInput
                  labelName="Rate / Unit"
                  value={paper.ratePerUnit}
                  onChange={(e) => handlePrinterPaperChange(index, 'ratePerUnit', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditPrinterTask }}
                />
              </Stack>
            </Box>
          ))}
          {/* {canEditPrinterTask && (
          <Box display="flex" justifyContent="flex-end">
            <ThemeButton
              onClick={handleAddPrinterPaper}
              disabled={!canEditPrinterTask}
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: "#6366F1",
                borderRadius: "8px",
                color: "#fff",
                "&:hover": { backgroundColor: "#4F46E5" },
              }}
            >
              Add Printer Paper
            </ThemeButton>
          </Box>
        )} */}
        </Box>

        {/* Printer Wasted Sheet */}
        <Box mb={3}>
          <ThemeInput
            labelName="Printer Wasted Sheet"
            placeholder="Enter number of wasted sheets"
            value={printerWastedSheet}
            onChange={(e) => setPrinterWastedSheet(e.target.value)}
            type="number"
            sx={{ width: "100%" }}
            InputProps={{ readOnly: !canEditPrinterTask }}
          />
        </Box>

        {/* Printer Remarks */}
        <Box mb={3}>
          <ThemeInput
            labelName="Printer Remarks"
            placeholder="Enter your remarks about the printing work..."
            value={printerRemarks}
            onChange={(e) => setPrinterRemarks(e.target.value)}
            multiline
            rows={3}
            sx={{ width: "100%" }}
            InputProps={{ readOnly: !canEditPrinterTask }}
          />
        </Box>

        {/* File Upload for Printer's Files */}
        <Box mb={3}>
          <Typography fontWeight={500} mb={1}>
            Upload Printer Files (Optional)
          </Typography>
          <FileUpload
            ref={fileUploadRef}
            folder="printer-files"
            multiple={true}
            accept="*/*"
            variant="dropzone"
            onFilesSelected={handlePrinterFilesSelected}
            onFileRemoved={handlePrinterFileRemoved}
            onUploadError={handleUploadError}
            showPreview={true}
            showUploadButton={false}
            autoUpload={false}
            label="Drop printer files here or click to browse"
            helperText="Upload any relevant files related to the printing process (e.g., proofs, samples)"
            disabled={!canEditPrinterTask}
          />
        </Box>

        {/* View Printer Files */}
        {uploadedPrinterFiles && uploadedPrinterFiles.length > 0 && (
          <Box mb={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleViewPrinterFiles}
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
              View All Printer Files ({uploadedPrinterFiles.length})
            </Button>
          </Box>
        )}

        {/* Submit Button */}
        {singleOrder.printerStatus === "In Progress" && (
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
            disabled={submitLoading || !canEditPrinterTask}
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
        open={openPrinterFilesDialog}
        onClose={handleClosePrinterFilesDialog}
        files={uploadedPrinterFiles.map((file: any) => file.path) || []}
        title="Printer Files"
        showDownload={true}
        showView={true}
      />
    </Box>
  )
}

export default PrinterTaskView
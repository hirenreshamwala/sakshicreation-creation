"use client"
import { useEffect, useRef, useState } from "react"
import { Box, Button, Typography, Paper, CircularProgress, Stack, IconButton, FormControlLabel, Switch } from "@mui/material"
import { AiOutlineEye } from "react-icons/ai"
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
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
import { authService } from "@/services/auth.service";
import { getAllBinderTypesThunk } from "@/store/slices/binderTypeSlice";

type OptionType = {
  label: string;
  value: string | number;
};

type PaperField = {
  paperName: string;
  numberOfSheetsUsed: string;
  sheetSize: string;
  paperType: string;
  gsm: string;
  ratePerUnit: string;
  wastage: string;
  materialId?: string;
};

const BinderTaskView = () => {
  const dispatch = useAppDispatch()
  const fileUploadRef = useRef<any>(null)
  const router = useRouter()
  const { id: orderId } = router.query
  const { singleOrder } = useAppSelector((state) => state.orders)
  const { materials } = useAppSelector(state => state.materials);
  const { binderTypes } = useAppSelector((state) => state.binderType);
  const [pageLoading, setPageLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [openDesignFilesDialog, setOpenDesignFilesDialog] = useState(false)
  const [openBinderFilesDialog, setOpenBinderFilesDialog] = useState(false)
  const [binderRemarks, setBinderRemarks] = useState("")
  const [binderWastedSheet, setBinderWastedSheet] = useState("")
  const [uploadedBinderFiles, setUploadedBinderFiles] = useState<any[]>([])
  const [binderPapers, setBinderPapers] = useState<PaperField[]>([])
  const [binding, setBinding] = useState(false)
  const [bindingType, setBindingType] = useState("")

  const getSelectedOption = (value: string, options: OptionType[]) => {
    return options.find((option) => option.value === value) || null;
  };

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
      setBinderRemarks(singleOrder.binderRemarks || "")
      setBinderWastedSheet(singleOrder.binderWastedSheet?.toString() || "")
      setUploadedBinderFiles(singleOrder.binderFiles || [])
      // Safely convert binding to boolean: handles boolean false/true, string "false"/"true", undefined/null/empty as false
      const bindingValue = !!singleOrder.binding && singleOrder.binding !== "false";
      setBinding(bindingValue);
      console.log("DEBUG: Order binding value:", singleOrder.binding, typeof singleOrder.binding);
      console.log("DEBUG: Formik binding value after set:", bindingValue);
      setBindingType(singleOrder.bindingType?._id || "")
      
      // Initialize binder papers
      const printerPaperCount = singleOrder.printerPapers?.length || 0
      if (singleOrder.binderPapers && singleOrder.binderPapers.length > 0) {
        setBinderPapers(singleOrder.binderPapers.map((paper: any) => ({
          ...paper,
          wastage: paper.wastage?.toString() || "0" // Initialize wastage field
        })))
      } else {
        setBinderPapers([{
          paperName: `Paper-${printerPaperCount + 1}`,
          numberOfSheetsUsed: "",
          sheetSize: "",
          paperType: "",
          gsm: "",
          ratePerUnit: "",
          wastage: "0"
        }])
      }
    }
  }, [singleOrder])

  // Calculate total wastage whenever binderPapers changes
  useEffect(() => {
    const totalWastage = binderPapers.reduce((sum, paper) => {
      return sum + (parseFloat(paper.wastage) || 0)
    }, 0)

    setBinderWastedSheet(totalWastage.toString())
  }, [binderPapers])

  const handleBinderFilesSelected = (selectedFiles: File[]) => {
    const newFileList = selectedFiles.map((file) => ({
      path: file.name,
      remark: "",
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      isNew: true,
    }))
    setUploadedBinderFiles((prev) => [...prev, ...newFileList])
  }

  const handleBinderFileRemoved = (removedFile: File) => {
    setUploadedBinderFiles((prev) =>
      prev.filter((file) => !(file.isNew && file.file && file.file.name === removedFile.name))
    )
  }

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error)
    toast.error(error)
  }
  useEffect(() => {
    if (!materials.length) dispatch(getAllMaterialsThunk());
    if (!binderTypes.length) dispatch(getAllBinderTypesThunk());
  }, [dispatch, materials.length, binderTypes.length])
  const handleViewDesignFiles = () => setOpenDesignFilesDialog(true)
  const handleCloseDesignFilesDialog = () => setOpenDesignFilesDialog(false)

  const handleViewBinderFiles = () => setOpenBinderFilesDialog(true)
  const handleCloseBinderFilesDialog = () => setOpenBinderFilesDialog(false)

  const handleAddBinderPaper = () => {
    const printerPaperCount = singleOrder?.printerPapers?.length || 0
    const binderPaperCount = binderPapers.length
    setBinderPapers([...binderPapers, {
      paperName: `Paper-${printerPaperCount + binderPaperCount + 1}`,
      numberOfSheetsUsed: "",
      sheetSize: "",
      paperType: "",
      gsm: "",
      ratePerUnit: "",
      wastage: "0"
    }])
  }

  const handleBinderPaperChange = (index: number, field: keyof PaperField, value: string) => {
    const updatedPapers = [...binderPapers]
    updatedPapers[index] = {
      ...updatedPapers[index],
      [field]: value.trim() === "" ? null : value // Convert empty strings to null
    }
    setBinderPapers(updatedPapers)
  }

  const handleDeleteBinderPaper = (index: number) => {
    if (binderPapers.length === 1) {
      toast.error("At least one paper field is required")
      return
    }
    const updatedPapers = binderPapers.filter((_, i) => i !== index)
    setBinderPapers(updatedPapers)
  }

  const handleUpdateStatus = async (orderId: string, statusType: string, status: string) => {
    try {
      setSubmitLoading(true)
      const token = authService.getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
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

    // const binderWastedSheetNum = Number(binderWastedSheet)
    // if (isNaN(binderWastedSheetNum) || binderWastedSheetNum < 0) {
    //   toast.error("Binder Wasted Sheet must be a non-negative number")
    //   return
    // }

    // Validate binder papers
    // for (const paper of binderPapers) {
    //   if (!paper.numberOfSheetsUsed || !paper.sheetSize || !paper.paperType || !paper.gsm || !paper.ratePerUnit) {
    //     toast.error("All paper fields must be filled")
    //     return
    //   }
    // }

    setSubmitLoading(true)
    try {
      let newBinderFiles: any[] = []
      if (fileUploadRef.current) {
        const selectedFiles = fileUploadRef.current.getSelectedFiles()
        if (selectedFiles.length > 0) {
          const uploadedFileResults = selectedFiles.map((file: File) => ({
            folder: "binder-files",
            filename: file.name,
          }))
          newBinderFiles = uploadedFileResults.map((file: any) => ({
            path: `${file.folder}/${file.filename}`,
            remark: binderRemarks,
            uploadedAt: new Date().toISOString(),
          }))
        }
      }

      const allBinderFiles = [...(singleOrder?.binderFiles || []), ...newBinderFiles.filter((f) => !f.isNew)]
      const currentDate = new Date().toISOString()?.split('T')[0]

      const updateData: any = {
        binderStatus: "Done",
        binderRemarks,
        binderWastedSheet: parseFloat(binderWastedSheet) || 0,
        binderFiles: allBinderFiles,
        binderPapers, // Include binder papers
        receivedDate: currentDate,
        binding: binding, // Include binding status
        bindingType: binding ? bindingType : null, // Include binding type conditionally
      }

      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Binder task updated successfully!")
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      console.error("Error updating binder task:", error)
      toast.error(error?.message || "Failed to update binder task")
    } finally {
      setSubmitLoading(false)
    }
  }

  // Get unique material names
  const materialNameOptions = materials.map(material => ({
    value: material._id, // Use _id as value
    label: material.materialName,
  }));

  // Get GSM options for a specific material (_id)
  const getMaterialGSMOptions = (materialId: string) => {
    const filteredMaterials = materials.filter(m => m._id === materialId);
    return Array.from(
      new Set(filteredMaterials.map(m => m.materialGSM.toString()))
    ).map(gsm => {
      const gsmMaterial = filteredMaterials.find(m => m.materialGSM.toString() === gsm);
      return {
        value: gsmMaterial?._id, // Use _id for GSM too
        label: `${gsm} GSM`,
      };
    });
  };

  // Get size options for a specific material + GSM
  const getMaterialSizeOptions = (materialId: string, materialGSM: string) => {
    const filteredMaterials = materials.filter(
      m => m._id === materialGSM
    );
    return filteredMaterials.map(m => ({
      value: m._id, // Each size option tied to material _id
      label: m.materialSize,
    }));
  };

  // Handle material name selection
  const handleMaterialNameChange = (index: number, id: string) => {
    const updatedPapers = [...binderPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      paperType: id || null, // Use null for empty values
      gsm: null,       
      sheetSize: null,
    };
    setBinderPapers(updatedPapers);
  };

  // Handle GSM selection
  const handleMaterialGSMChange = (index: number, id: string) => {
    const updatedPapers = [...binderPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      gsm: id || null, // Use null for empty values
      sheetSize: null,
    };
    setBinderPapers(updatedPapers);
  };

  // Handle size selection
  const handleMaterialSizeChange = (index: number, id: string) => {
    const updatedPapers = [...binderPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      sheetSize: id || null, // store _id
    };
    setBinderPapers(updatedPapers);
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
  const isBinderWorkDone = singleOrder.binderStatus === "Done"
  const canEditBinderTask = !isHeld && (singleOrder.binderStatus === "In Progress" || singleOrder.binderStatus === "Pending")
  const isPrinterStatusDone = singleOrder.printerStatus === "Done"

  return (
    <Box>
      {/* Order Details */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight={600} color="#1976D2">
            Order Details
          </Typography>
          {singleOrder.binderStatus === "Pending" && (
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
              onClick={() => handleUpdateStatus(singleOrder._id, "binder", "In Progress")}
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
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
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
          <ThemeInput
            labelName="Raw Paper Size"
            value={singleOrder.rowPaperSize || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Raw Paper Used"
            value={singleOrder.rowPaperUser || "N/A"}
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
          
          {/* Binding Switch and Conditional Select - Added from BinderForm */}
          <FormControlLabel
            control={
              <Switch
                checked={binding}
                onChange={(e) => setBinding(e.target.checked)}
                color="primary"
                disabled={!canEditBinderTask}
              />
            }
            label="Binding"
            sx={{ flex: 1, justifyContent: "flex-start" }}
          />
          {binding && (
            <Box sx={{ width: 1 }} >
              <ThemeSelect
                label="Binding Type"
                value={getSelectedOption(bindingType, binderTypes?.map((item) => ({ value: item?._id, label: item?.name })) || [])}
                options={binderTypes?.map((item) => ({ value: item?._id, label: item?.name })) || []}
                onChange={(_, v) => setBindingType(v ? v.value : "")}
                disabled={!canEditBinderTask}
                sx={{ flex: 1 }}
              />
            </Box>
          )}
          
          <ThemeInput
            labelName="Pages / book"
            value={singleOrder.pagesPerBook?.toString() || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          {/* <ThemeInput
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
          /> */}
        </Box>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="Rate / book"
            value={singleOrder.rateBook || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Total Amount"
            value={singleOrder.totalAmount || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          {/* <ThemeInput
            labelName="GSM"
            value={singleOrder.gsm || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          /> */}
          <ThemeInput
            labelName="GST"
            value={singleOrder.gst || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          {/* <ThemeInput
            labelName="Rate / Unit"
            value={singleOrder.ratePerUnit || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          /> */}
        </Box>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={2}>
          <ThemeInput
            labelName="Start Number"
            value={singleOrder.startNumber || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="End Number"
            value={singleOrder.endNumber || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Total Numbering"
            value={singleOrder.totalNumbering || "N/A"}
            sx={{ flex: 1 }}
            InputProps={{ readOnly: true }}
          />
          <ThemeInput
            labelName="Final Amount with Numbering"
            value={singleOrder.numberingAmount || "N/A"}
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
      {singleOrder.approvedFiles && singleOrder.approvedFiles.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} mb={2} color="#4CAF50">
            Design Files ({singleOrder.approvedFiles.length})
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
            View All Design Files ({singleOrder.approvedFiles.length})
          </Button>
        </Paper>
      )}

      {/* Binder Work Section */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2} color="#FF9800">
          Binder Work
        </Typography>

        {isHeld && (
          <Box mb={3} sx={{ p: 2, bgcolor: "#FFF0F0", borderRadius: 2, border: "1px solid #F04438" }}>
            <Typography fontWeight={500} fontSize={14} mb={1} color="#F04438">
              🚫 Order On Hold
            </Typography>
            <Typography fontSize={13} color="#666">
              This order is currently on hold. You cannot update the binder task until it is unheld.
            </Typography>
          </Box>
        )}

        {isBinderWorkDone && (
          <Box mb={3} sx={{ p: 2, bgcolor: "#E8F5E8", borderRadius: 2, border: "1px solid #4CAF50" }}>
            <Typography fontWeight={500} fontSize={14} mb={1} color="#4CAF50">
              ✅ Binder Work Completed
            </Typography>
            <Typography fontSize={13} color="#666">
              This binder task has been marked as done.
            </Typography>
          </Box>
        )}

        {/* Binder Papers Section */}
        <Box mb={3}>
          <Typography fontWeight={600} mb={2}>
            Binder Papers
          </Typography>
          {binderPapers.map((paper, index) => (
            <Box key={`binder-${index}`} mb={2} p={2} border={1} borderRadius={2} borderColor="#ddd">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography fontWeight={600}>
                  {paper.paperName}
                </Typography>
                {canEditBinderTask && (
                  <IconButton
                    onClick={() => handleDeleteBinderPaper(index)}
                    disabled={binderPapers.length === 1}
                    sx={{
                      color: '#F04438',
                      '&:hover': { backgroundColor: '#FEE2E2' },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
              <Stack direction="row" spacing={2} mt={1}>
                <ThemeInput
                  labelName="Number of Sheets Used"
                  value={paper.numberOfSheetsUsed}
                  onChange={(e) => handleBinderPaperChange(index, 'numberOfSheetsUsed', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditBinderTask }}
                />
                <ThemeSelect
                  label="Paper Type"
                  options={materialNameOptions}
                  value={materialNameOptions.find(opt => opt.value === paper.paperType) || null}
                  onChange={(e, newValue) =>
                    handleMaterialNameChange(index, newValue?.value as string || "")
                  }
                  // required
                  disabled={!canEditBinderTask}
                />
                <ThemeSelect
                  label="GSM"
                  options={getMaterialGSMOptions(paper.paperType)}
                  value={getMaterialGSMOptions(paper.paperType).find(opt => opt.value === paper.gsm) || null}
                  onChange={(e, newValue) =>
                    handleMaterialGSMChange(index, newValue?.value as string || "")
                  }
                  // required
                  disabled={!paper.paperType || !canEditBinderTask}
                />
                <ThemeSelect
                  label="Size"
                  options={getMaterialSizeOptions(paper.paperType, paper.gsm)}
                  value={getMaterialSizeOptions(paper.paperType, paper.gsm).find(opt => opt.value === paper.sheetSize) || null}
                  onChange={(e, newValue) =>
                    handleMaterialSizeChange(index, newValue?.value as string || "")
                  }
                  // 
                  disabled={!paper.paperType || !paper.gsm || !canEditBinderTask}
                />
                {/* <ThemeInput
                  labelName="Rate / Unit"
                  value={paper.ratePerUnit}
                  onChange={(e) => handleBinderPaperChange(index, 'ratePerUnit', e.target.value)}
                  fullWidth
                  InputProps={{ readOnly: !canEditBinderTask }}
                /> */}
                <ThemeInput
                  labelName="Wastage"
                  value={paper.wastage}
                  onChange={(e) => handleBinderPaperChange(index, 'wastage', e.target.value)}
                  type="number"
                  fullWidth
                  InputProps={{ readOnly: !canEditBinderTask }}
                />
              </Stack>
            </Box>
          ))}
          {canEditBinderTask && (
            <Box display="flex" justifyContent="flex-end">
              <ThemeButton
                onClick={handleAddBinderPaper}
                disabled={!canEditBinderTask}
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: "#6366F1",
                  borderRadius: "8px",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#4F46E5" },
                }}
              >
                Add Binder Paper
              </ThemeButton>
            </Box>
          )}
        </Box>

        {/* Binder Wasted Sheet */}
        <Box mb={3}>
          <ThemeInput
            labelName="Binder Wasted Sheet"
            placeholder="Enter number of wasted sheets"
            value={binderWastedSheet}
            // onChange={(e) => setBinderWastedSheet(e.target.value)}
            type="number"
            sx={{ width: "100%" }}
          // InputProps={{ readOnly: !canEditBinderTask }}
          />
        </Box>

        {/* Binder Remarks */}
        <Box mb={3}>
          <ThemeInput
            labelName="Binder Remarks"
            placeholder="Enter your remarks about the binding work..."
            value={binderRemarks}
            onChange={(e) => setBinderRemarks(e.target.value)}
            multiline
            rows={3}
            sx={{ width: "100%" }}
            InputProps={{ readOnly: !canEditBinderTask }}
          />
        </Box>

        {/* File Upload for Binder's Files */}
        <Box mb={3}>
          <Typography fontWeight={500} mb={1}>
            Upload Binder Files (Optional)
          </Typography>
          <FileUpload
            ref={fileUploadRef}
            folder="binder-files"
            multiple={true}
            accept="*/*"
            variant="dropzone"
            onFilesSelected={handleBinderFilesSelected}
            onFileRemoved={handleBinderFileRemoved}
            onUploadError={handleUploadError}
            showPreview={true}
            showUploadButton={false}
            autoUpload={false}
            label="Drop binder files here or click to browse"
            helperText="Upload any relevant files related to the binding process (e.g., proofs, samples)"
            disabled={!canEditBinderTask}
          />
        </Box>

        {/* View Binder Files */}
        {uploadedBinderFiles && uploadedBinderFiles.length > 0 && (
          <Box mb={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleViewBinderFiles}
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
              View All Binder Files ({uploadedBinderFiles.length})
            </Button>
          </Box>
        )}

        {/* Submit Button */}
        {singleOrder.binderStatus === "In Progress" && (

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
            disabled={submitLoading || !canEditBinderTask}
          >
            {submitLoading ? "Updating..." : "Mark As Done"}
          </ThemeButton>
        )}
      </Paper>

      {/* View Files Dialogs */}
      <ViewFilesDialog
        open={openDesignFilesDialog}
        onClose={handleCloseDesignFilesDialog}
        files={singleOrder?.approvedFiles?.map((file: any) => file) || []}
        title="Design Files"
        showDownload={true}
        showView={true}
      />
      <ViewFilesDialog
        open={openBinderFilesDialog}
        onClose={handleCloseBinderFilesDialog}
        files={uploadedBinderFiles.map((file: any) => file.path) || []}
        title="Binder Files"
        showDownload={true}
        showView={true}
      />
    </Box>
  )
}

export default BinderTaskView
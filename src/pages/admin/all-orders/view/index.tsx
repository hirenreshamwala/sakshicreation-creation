"use client"
import { useRef, useState, useEffect } from "react"
import { Box, Typography, Paper, Button, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, List, ListItem, Chip, Divider } from "@mui/material"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import StepperProgress from "@/component/common_component/stepperprogress"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import FileUpload from "@/component/reusablecomponents/FileUpload"
import { useRouter } from "next/router"
import { useAppDispatch, useAppSelector } from "@/store"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { toast } from "react-toastify"
import { useFormik } from "formik"
import * as Yup from "yup"
import AddNewQuotation from "@/component/PerformanceInvoice/AddQuotationDialog"
import { MdDownload } from "react-icons/md"
import { generateInvoicePDF } from "@/utills/generateInvoicePDF"
import { getAllMarketsThunk } from "@/store/slices/marketDataSlice"

const activeStep = 0

interface FormValues {
  companyName: string
  partyName: string
  itemName: string
  size: string
  quantity: string
  number: string
  startNumber: string
  endNumber: string
  color: string
  pType: string
  customPType: string
  remarks: string
}

const ViewOrderPage = () => {
  const fileUploadRef = useRef<any>(null)
  const quotationProofUploadRef = useRef<any>(null)
  const [openFilesDialog, setOpenFilesDialog] = useState(false)
  const [openQuotationProofDialog, setOpenQuotationProofDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quotationProofLoading, setQuotationProofLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [quoteDialog, setQuoteDialog] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [quotationHistoryDialog, setQuotationHistoryDialog] = useState(false)
  const [uploadedQuotationProofs, setUploadedQuotationProofs] = useState<any[]>([])
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { markets } = useAppSelector((state) => state.markets);
  const { id: orderId } = router.query
  const { singleOrder } = useAppSelector((state: any) => state.orders)
  const hasQuotationProof = Boolean(singleOrder?.quotationProof) || uploadedQuotationProofs.length > 0

  console.log(singleOrder, 'singleOrder?.quotationProof')
  const formik = useFormik<FormValues>({
    initialValues: {
      companyName: "",
      partyName: "",
      itemName: "",
      size: "",
      quantity: "",
      number: "",
      startNumber: "",
      endNumber: "",
      color: "",
      pType: "",
      customPType: "",
      remarks: "",
    },
    validationSchema: Yup.object({
      size: Yup.string().required("Size is required"),
      number: Yup.string()
        .required("Number selection is required")
        .oneOf(["Yes", "No"], "Invalid number selection"),
      startNumber: Yup.string().when("number", {
        is: "Yes",
        then: (schema) => schema.required("Start Number is required when Number is Yes"),
        otherwise: (schema) => schema.notRequired(),
      }),
      endNumber: Yup.string().when("number", {
        is: "Yes",
        then: (schema) => schema.required("End Number is required when Number is Yes"),
        otherwise: (schema) => schema.notRequired(),
      }),
      color: Yup.string()
        .required("Color is required")
        .oneOf(["1", "2", "3", "4", "5", "6"], "Invalid color selection"),
      pType: Yup.string()
        .required("PType is required")
        .oneOf(["Offset", "Screen Printing", "Other"], "Invalid PType selection"),
      customPType: Yup.string().when("pType", {
        is: "Other",
        then: (schema) => schema.required("Custom PType is required when PType is Other"),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    onSubmit: async (values) => {
      if (!orderId || typeof orderId !== "string") {
        toast.error("Order ID not found");
        return;
      }

      setLoading(true);
      try {
        let newFilePaths: any[] = [];
        if (fileUploadRef.current && typeof fileUploadRef.current.getSelectedFiles === "function") {
          const selectedFiles = fileUploadRef.current.getSelectedFiles() || [];
          if (selectedFiles.length > 0) {
            const uploadedFileResults = await fileUploadRef.current.uploadSelectedFiles();
            newFilePaths = uploadedFileResults.map((file: any) => ({
              path: file.path || `/${file.folder}/${file.filename}`,
              remark: "",
              uploadedAt: new Date(),
            }));
            setUploadedFiles((prev) => [...prev, ...newFilePaths]);
          }
        }

        const updateData = {
          size: values.size,
          number: values.number,
          startNumber: values.number === "Yes" ? values.startNumber : "",
          endNumber: values.number === "Yes" ? values.endNumber : "",
          color: values.color,
          pType: values.pType === "Other" ? values.customPType : values.pType,
          remarks: values.remarks,
          filePaths: [
            ...(Array.isArray(singleOrder?.filePaths)
              ? singleOrder.filePaths.map(f => typeof f === 'string' ? f : f.path)
              : []),
            ...newFilePaths.map(f => f.path)
          ],
        };

        await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap();
        toast.success("Order updated successfully");
        // Removed the automatic redirect
      } catch (error: any) {
        console.error("Error updating order:", error);
        toast.error(error.message || "Failed to update order");
      } finally {
        setLoading(false);
      }
    },
  })

  useEffect(() => {
    if (!markets.length) dispatch(getAllMarketsThunk())
  }, [])


  const handleUploadQuotationProof = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found");
      return;
    }

    setQuotationProofLoading(true);
    try {
      let newQuotationProofPaths: any[] = [];
      if (quotationProofUploadRef.current && typeof quotationProofUploadRef.current.getSelectedFiles === "function") {
        const selectedFiles = quotationProofUploadRef.current.getSelectedFiles() || [];
        if (selectedFiles.length > 0) {
          const uploadedFileResults = await quotationProofUploadRef.current.uploadSelectedFiles();
          newQuotationProofPaths = uploadedFileResults.map((file: any) => ({
            path: file.path || `/${file.folder}/${file.filename}`,
            remark: "Quotation Proof",
            uploadedAt: new Date(),
          }));
          setUploadedQuotationProofs((prev) => [...prev, ...newQuotationProofPaths]);

          // Update order with quotation proof
          const updateData = {
            quotationProof: newQuotationProofPaths[0].path
          };

          await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap();
          toast.success("Quotation proof uploaded successfully");
        } else {
          toast.error("Please select a file to upload");
        }
      }
    } catch (error: any) {
      console.error("Error uploading quotation proof:", error);
      toast.error(error.message || "Failed to upload quotation proof");
    } finally {
      setQuotationProofLoading(false);
    }
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'final': return 'success';
      case 'revised': return 'warning';
      case 'canceled': return 'error';
      default: return 'default';
    }
  };
  const handleNextStep = () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found");
      return;
    }
    router.push(`/admin/all-orders/view/designer?id=${orderId}`);
  }

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId || typeof orderId !== "string") {
        setPageLoading(false)
        return
      }

      try {
        setPageLoading(true)
        const result = await dispatch(getOrderByIdThunk(orderId)).unwrap()
      } catch (err: any) {
        console.error("Failed to fetch order:", err)
        toast.error(err.message || "Failed to load order data")
      } finally {
        setPageLoading(false)
      }
    }

    fetchOrderData()
  }, [dispatch, orderId])
  const handleDownloadInvoice = () => {
    try {
      // Get the latest quotation
      const latestQuotation = singleOrder?.quotation?.[singleOrder?.quotation?.length - 1];

      // Debug log
      console.log("Latest Quotation:", latestQuotation);
      console.log("Single Order:", singleOrder);

      // Calculate amounts based on latest quotation
      const quantity = Number(singleOrder?.qty) || 0;
      const unitPrice = Number(latestQuotation?.unitPrice) || 0;
      const subtotal = quantity * unitPrice;

      // GST settings from latest quotation
      // Agar quotation mein gst value hai (0 se bada) toh applyGST = true, warna false
      const gstValue = Number(latestQuotation?.gst) || 0;
      const applyGST = gstValue > 0;
      const gstPercentage = gstValue;

      const gstAmount = applyGST ? subtotal * (gstPercentage / 100) : 0;
      const totalAmount = subtotal + gstAmount;

      console.log("Calculated amounts:", {
        quantity,
        unitPrice,
        subtotal,
        applyGST,
        gstPercentage,
        gstAmount,
        totalAmount
      });

      const formData = {
        quotation: true,
        orderNumber: singleOrder?.orderNumber || "N/A",
        companyName: singleOrder?.companyName?.companyName || "N/A",
        remarks: singleOrder?.remarks || "",
        ownerMobileNo: singleOrder?.party?.ownerMobileNo || "",
        partyName: singleOrder?.party?.partyName || "N/A",
        addressName: `${singleOrder?.party?.address?.unitNo || ""} ${markets?.find((item) => item._id === singleOrder?.party?.address?.marketName)?.marketName || ""
          } ${markets?.find((item) => item._id === singleOrder?.party?.address?.landMark)?.landmark || ""
          } ${markets?.find((item) => item._id === singleOrder?.party?.address?.area)?.area || ""
          } ${markets?.find((item) => item._id === singleOrder?.party?.address?.pincode)?.pincode || ""
          }`.trim(),
        GSTNo: singleOrder?.party?.GSTNo || "N/A",
        servicePerformance: singleOrder?.productItem?.itemName || "N/A",
        quantity: quantity,
        unitPrice: unitPrice,
        total: subtotal, // Use calculated subtotal
        finalAmount: totalAmount, // Use calculated total
        applyGST: applyGST,
        gstPercentage: gstPercentage,
        daysAfterConfirmation: singleOrder?.daysAfterConfirmation || 0,
      };

      console.log("Final FormData for PDF:", formData);
      generateInvoicePDF(formData);
      toast.success("Quotation downloaded successfully");
    } catch (error) {
      console.error("Error downloading Quotation:", error);
      toast.error("Failed to download Quotation");
    }
  };

  useEffect(() => {
    if (singleOrder) {
      try {
        const pType = typeof singleOrder.pType === "string" && ["Offset", "Screen Printing"].includes(singleOrder.pType)
          ? singleOrder.pType
          : "Other"
        const customPType = typeof singleOrder.pType === "string" && !["Offset", "Screen Printing"].includes(singleOrder.pType)
          ? singleOrder.pType
          : ""
        const number = typeof singleOrder.number === "string" && ["Yes", "No"].includes(singleOrder.number)
          ? singleOrder.number
          : singleOrder.startNumber || singleOrder.endNumber
            ? "Yes"
            : "No"
        const color = typeof singleOrder.color === "string" && ["1", "2", "3", "4", "5", "6"].includes(singleOrder.color)
          ? singleOrder.color
          : ""

        formik.setValues({
          companyName: typeof singleOrder.companyName?.companyName === "string" ? singleOrder.companyName.companyName : "",
          partyName: typeof singleOrder.party?.partyName === "string" ? singleOrder.party.partyName : "",
          itemName: typeof singleOrder.productItem?.itemName === "string" ? singleOrder.productItem.itemName : "",
          size: typeof singleOrder.size === "string" ? singleOrder.size : "",
          quantity: typeof singleOrder.qty === "number" ? singleOrder.qty.toString() : "",
          number,
          startNumber: typeof singleOrder.startNumber === "string" ? singleOrder.startNumber : "",
          endNumber: typeof singleOrder.endNumber === "string" ? singleOrder.endNumber : "",
          color,
          pType,
          customPType,
          remarks: typeof singleOrder.remarks === "string" ? singleOrder.remarks : "",
        })
      } catch (error) {
        console.error("Error setting form values:", error)
        toast.error("Failed to initialize form values")
      }
    }
  }, [singleOrder])

  const handleViewFiles = () => {
    setOpenFilesDialog(true)
  }

  const handleViewQuotationProofs = () => {
    setOpenQuotationProofDialog(true)
  }

  const handleCloseFilesDialog = () => {
    setOpenFilesDialog(false)
  }

  const handleCloseQuotationProofDialog = () => {
    setOpenQuotationProofDialog(false)
  }

  const handleFilesSelected = (files: File[]) => {
    console.log("Files selected:", files)
  }

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error)
    toast.error(error)
  }

  if (pageLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <StepperProgress
        activeStep={0}
        orderStatus={singleOrder?.status}
      />
      <Paper
        variant="outlined"
        sx={{
          borderColor: "#12B76A",
          borderWidth: 2,
          borderRadius: 2,
          p: 2,
          mb: 2,
          background: "#fff",
        }}
      >
        <Box display="flex" alignItems="center" borderBottom={1} pb={2} mb={2}>
          <Typography fontWeight={600} fontSize={16} mr={1}>
            Order Received
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            / Placed by {singleOrder?.createdBy?.firstName || "Unknown"} {singleOrder?.createdBy?.lastName || "Unknown"} [
            {singleOrder?.createdAt ? new Date(singleOrder.createdAt).toLocaleString() : "Unknown"}]
          </Typography>
        </Box>

        <Box component="form" noValidate onSubmit={formik.handleSubmit}>
          <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={3}>
            <ThemeInput
              labelName="Company Name"
              value={formik.values.companyName}
              name="companyName"
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              disabled
            />
            <ThemeInput
              labelName="Party Name"
              value={formik.values.partyName}
              name="partyName"
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              disabled
            />
            <ThemeInput
              labelName="Item Name"
              value={formik.values.itemName}
              name="itemName"
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              disabled
            />
            <ThemeInput
              labelName="Size"
              value={formik.values.size}
              name="size"
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.size && Boolean(formik.errors.size)}
              helperText={formik.touched.size && formik.errors.size}
            />
            <ThemeInput
              labelName="Quantity"
              value={formik.values.quantity}
              name="quantity"
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              disabled
            />
          </Box>

          <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={3} flexWrap="wrap">
            <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} sx={{ width: "100%", alignItems: "flex-end" }}>
              <FormControl sx={{ flex: 1, minWidth: 120 }} error={formik.touched.number && Boolean(formik.errors.number)}>
                <InputLabel id="number-label">Number</InputLabel>
                <Select
                  labelId="number-label"
                  name="number"
                  value={formik.values.number}
                  onChange={formik.handleChange}
                  label="Number"
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
                {formik.touched.number && formik.errors.number && (
                  <Typography variant="caption" color="error">
                    {formik.errors.number}
                  </Typography>
                )}
              </FormControl>
              {formik.values.number === "Yes" && (
                <>
                  <ThemeInput
                    labelName="Start Number"
                    name="startNumber"
                    value={formik.values.startNumber}
                    onChange={formik.handleChange}
                    sx={{ flex: 1, minWidth: 120 }}
                    error={formik.touched.startNumber && Boolean(formik.errors.startNumber)}
                    helperText={formik.touched.startNumber && formik.errors.startNumber}
                  />
                  <ThemeInput
                    labelName="End Number"
                    name="endNumber"
                    value={formik.values.endNumber}
                    onChange={formik.handleChange}
                    sx={{ flex: 1, minWidth: 120 }}
                    error={formik.touched.endNumber && Boolean(formik.errors.endNumber)}
                    helperText={formik.touched.endNumber && formik.errors.endNumber}
                  />
                </>
              )}
            </Box>
            <FormControl sx={{ flex: 1, minWidth: 120 }} error={formik.touched.color && Boolean(formik.errors.color)}>
              <InputLabel id="color-label">Color</InputLabel>
              <Select
                labelId="color-label"
                name="color"
                value={formik.values.color}
                onChange={formik.handleChange}
                label="Color"
              >
                <MenuItem value="">Select</MenuItem>
                {[1, 2, 4, 6].map((num) => (
                  <MenuItem key={num} value={num.toString()}>
                    color - {num}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.color && formik.errors.color && (
                <Typography variant="caption" color="error">
                  {formik.errors.color}
                </Typography>
              )}
            </FormControl>
            <FormControl sx={{ flex: 1, minWidth: 120 }} error={formik.touched.pType && Boolean(formik.errors.pType)}>
              <InputLabel id="pType-label">PrinterType</InputLabel>
              <Select
                labelId="pType-label"
                name="pType"
                value={formik.values.pType}
                onChange={formik.handleChange}
                label="PType"
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Offset">Offset</MenuItem>
                <MenuItem value="Screen Printing">Screen Printing</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
              {formik.touched.pType && formik.errors.pType && (
                <Typography variant="caption" color="error">
                  {formik.errors.pType}
                </Typography>
              )}
            </FormControl>
            {formik.values.pType === "Other" && (
              <ThemeInput
                labelName="Custom Printing Type"
                name="customPType"
                value={formik.values.customPType}
                onChange={formik.handleChange}
                sx={{ flex: 1, minWidth: 120 }}
                error={formik.touched.customPType && Boolean(formik.errors.customPType)}
                helperText={formik.touched.customPType && formik.errors.customPType}
              />
            )}
          </Box>

          <Box mb={2}>
            <ThemeInput
              labelName="Remarks"
              value={formik.values.remarks}
              placeholder="Enter Remarks"
              name="remarks"
              onChange={formik.handleChange}
              sx={{ width: "100%" }}
            />
          </Box>

          <Box mb={2}>
            <FileUpload
              ref={fileUploadRef}
              folder="orders"
              multiple={true}
              accept="*/*"
              variant="dropzone"
              onFilesSelected={handleFilesSelected}
              onUploadError={handleUploadError}
              showPreview={false}
              showUploadButton={false}
              autoUpload={false}
              label="Attach Order Files"
              helperText="Select order documents, images, or any related files "
            />
          </Box>

          <Box mb={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleViewFiles}
              sx={{
                color: "#344054",
                borderColor: "#D0D5DD",
                fontWeight: 600,
                mb: 1,
                textTransform: "none",
                fontSize: 16,
                py: 1.2,
                background: "#fff",
                "&:hover": { background: "#f6fef9", borderColor: "#D0D5DD" },
              }}
              startIcon={
                <svg width="20" height="20" fill="none" style={{ marginRight: 4 }}>
                  <circle cx="10" cy="10" r="9" stroke="#98A2B3" strokeWidth="2" />
                  <circle cx="10" cy="10" r="3" fill="#98A2B3" />
                </svg>
              }
            >
              View Files ({Array.isArray(singleOrder?.filePaths) ? singleOrder.filePaths.length : 0})
            </Button>
          </Box>

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
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Save"}
          </ThemeButton>
        </Box>

        {/* Quotation Proof Section */}
        <Box mt={3} pt={3} borderTop={1} borderColor="#E5E7EB">
          <Typography variant="h6" fontWeight={600} mb={2}>
            Quotation Proof
          </Typography>
          {singleOrder?.quotation.length ?
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                onClick={() => setQuotationHistoryDialog(true)}
                sx={{ flex: 1 }}
              >
                View Quotation History
              </Button>

              <ThemeButton
                sx={{
                  flex: 1,
                  background: "#2196F3",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  borderRadius: 2,
                  py: 1.2,
                  "&:hover": { background: "#1976D2" },
                }}
                onClick={handleDownloadInvoice}
              >
                <MdDownload style={{ marginRight: "8px" }} />
                Download Quotation
              </ThemeButton>

              <ThemeButton
                sx={{
                  flex: 1,
                  background: "#667085",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  borderRadius: 2,
                  py: 1.2,
                }}
                onClick={() => setQuoteDialog(true)}
              >
                Generate Quotation
              </ThemeButton>
            </Box>
            : null}
          {!hasQuotationProof ? (
            <>
              <FileUpload
                ref={quotationProofUploadRef}
                folder="quotation_proofs"
                multiple={false}
                accept="*/*"
                variant="dropzone"
                onFilesSelected={handleFilesSelected}
                onUploadError={handleUploadError}
                showPreview={false}
                showUploadButton={false}
                autoUpload={false}
                label="Upload Quotation Proof"
                helperText="Upload the quotation proof document"
              />

              <ThemeButton
                fullWidth
                sx={{
                  mt: 2,
                  background: "#12B76A",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  borderRadius: 2,
                  py: 1.2,
                }}
                onClick={handleUploadQuotationProof}
                disabled={quotationProofLoading}
              >
                {quotationProofLoading ? "Uploading..." : "Upload Quotation Proof"}
              </ThemeButton>

            </>
          ) : (
            <>
              <Box mb={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleViewQuotationProofs}
                  sx={{
                    color: "#344054",
                    borderColor: "#D0D5DD",
                    fontWeight: 600,
                    mb: 1,
                    textTransform: "none",
                    fontSize: 16,
                    py: 1.2,
                    background: "#fff",
                    "&:hover": { background: "#f6fef9", borderColor: "#D0D5DD" },
                  }}
                  startIcon={
                    <svg width="20" height="20" fill="none" style={{ marginRight: 4 }}>
                      <circle cx="10" cy="10" r="9" stroke="#98A2B3" strokeWidth="2" />
                      <circle cx="10" cy="10" r="3" fill="#98A2B3" />
                    </svg>
                  }
                >
                  View Quotation Proof
                </Button>
              </Box>

              <ThemeButton
                fullWidth
                sx={{
                  mt: 2,
                  background: "#12B76A",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  borderRadius: 2,
                  py: 1.2,
                }}
                onClick={handleNextStep}
              >
                Next
              </ThemeButton>
            </>
          )}
        </Box>
      </Paper>

      <ViewFilesDialog
        open={openFilesDialog}
        onClose={handleCloseFilesDialog}
        files={
          Array.isArray(singleOrder?.filePaths)
            ? singleOrder.filePaths.map(file =>
              typeof file === 'string'
                ? file
                : file.path || `/${file.folder}/${file.filename}`
            )
            : []
        }
        title="Order Files"
        showDownload
        showView
        downloadEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/filedownload/download`}
      />

      <ViewFilesDialog
        open={openQuotationProofDialog}
        onClose={handleCloseQuotationProofDialog}
        files={
          singleOrder?.quotationProof
            ? [singleOrder.quotationProof]
            : uploadedQuotationProofs.map(proof => proof.path)
        }
        title="Quotation Proof"
        showDownload
        showView
        downloadEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/api/filedownload/download`}
      />
      <Dialog
        open={quotationHistoryDialog}
        onClose={() => setQuotationHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Quotation History
            </Typography>
            <Button onClick={() => setQuotationHistoryDialog(false)}>
              X
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {singleOrder?.quotation?.map((item, index) => (
              <Box key={item.id}>
                <ListItem alignItems="flex-start">
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Quotation - {index + 1}
                      </Typography>
                      <Chip
                        label={singleOrder?.quotationProof === "" ? "Pending" : index === singleOrder?.quotation?.length - 1 ? "Final" : "canceled"}
                        color={getStatusColor(singleOrder?.quotationProof === "" ? "Pending" : index === singleOrder?.quotation?.length - 1 ? "Final" : "canceled") as any}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="textSecondary">
                      Date: {formatDate(item.createdAt)}
                    </Typography>

                    <Typography variant="body2" color="textSecondary">
                      Amount: ₹{item.unitPrice.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total: ₹
                      {item.gst > 0
                        ? (Number(item.unitPrice) * Number(item.qty)) * (1 + Number(item.gst) / 100)
                        : (Number(item.unitPrice) * Number(item.qty))}
                    </Typography>



                    {item.notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Notes: {item.notes}
                      </Typography>
                    )}
                  </Box>
                </ListItem>
                {index < singleOrder?.quotation?.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        </DialogContent>
      </Dialog>
      <AddNewQuotation
        open={quoteDialog}
        onClose={() => setQuoteDialog(false)}
        invoiceId={undefined}
        data={singleOrder}
        orderId={orderId as string}
        isQuote={true}
        quoteUpdate={singleOrder?.quotation?.length ? true : false}
      />
    </Box>
  )
}

export default ViewOrderPage
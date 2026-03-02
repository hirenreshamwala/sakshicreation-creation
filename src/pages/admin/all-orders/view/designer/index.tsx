"use client"
import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Collapse,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from "@mui/material"
import { MdEmail, MdArrowBack, MdDelete, MdDownload } from "react-icons/md"
import { AiOutlineEye } from "react-icons/ai"
import { useRouter } from "next/router"
import { toast } from "react-toastify"
import { useAppDispatch, useAppSelector } from "@/store"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import StepperProgress from "@/component/common_component/stepperprogress"
import ThemeChip from "@/component/common_component/themechip"
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import AddNewPerformanceInvoiceDialog from "@/component/PerformanceInvoice/AddNewPerformanceInvoiceDialog"
import { performanceInvoiceService } from "@/services/performanceInvoice.service"
import { orderService } from "@/services/order.service"
import Request from "@/services/axios"
import { generateInvoicePDF } from "@/utills/generateInvoicePDF"
import { getAllMarketsThunk } from "@/store/slices/marketDataSlice"
import { formatDateToDDMMYYYY, getFirstFourChars } from "@/utills/utills"
import FileSelectionDialog from "@/component/sakshiOrder/designer/FileSelectionDialog"
import ReworkDialog from "@/component/sakshiOrder/designer/ReworkDialog"
import ApprovalDialog from "@/component/sakshiOrder/designer/ApprovalDialog"
import InvoiceValidProofDialog from "@/component/sakshiOrder/designer/InvoiceValidProofDialog"
import ProformaHistoryDialog from "@/component/sakshiOrder/designer/ProformaHistoryDialog"

const uploadFilesToServer = async (files: File[], folder: string): Promise<any[]> => {
  const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  // If you want to send folder info to backend too
  formData.append("folder", folder);

  try {
    const response = await Request.post(`${BaseURL}/api/fileUpload/multiple`, formData);

    console.log(response, 'sdgnnsdgsdg')
    return response.data.data || []; // Assuming API returns { files: [...] }
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

const ReworkEntry: React.FC<{ entry: any }> = ({ entry }) => {
  return <Box sx={{ borderBottom: "1px solid #ccc", pb: 2, mb: 2 }}>
    <Typography sx={{ color: "#333", fontSize: 14, mb: 1 }}>
      Date: {formatDateToDDMMYYYY(entry.date)}
    </Typography>
    <Typography sx={{ color: "#666", fontSize: 13, mb: 1 }}>
      Remark: {entry.remark}
    </Typography>
    {entry.files?.map((file: any, index: number) => {
      const handleViewFile = () => {
        try {
          const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383"

          if (file.path.startsWith("http")) {
            window.open(file.path, "_blank")
          } else if (file.path.startsWith("/uploads")) {
            window.open(`${BaseURL}${file.path}`, "_blank")
          } else {
            if (file.path.startsWith("design/")) {
              window.open(`${BaseURL}/uploads/${file.path}`, "_blank")
            } else if (file.path.startsWith("general/")) {
              window.open(`${BaseURL}/uploads/${file.path}`, "_blank")
            } else {
              window.open(`${BaseURL}/api/filedownload/download/${encodeURIComponent(file.path)}?view=true`, "_blank")
            }
          }
        } catch (error) {
          console.error("Error opening design file:", error)
          toast.error("Failed to open design file")
        }
      };

      return (
        <Button
          key={index}
          variant="outlined"
          startIcon={<AiOutlineEye />}
          onClick={handleViewFile}
          sx={{
            mr: 1,
            mb: 1,
            textTransform: "none",
            fontWeight: 500,
            backgroundColor: "#fff",
            borderColor: "#ccc",
            color: "#333",
          }}
        >
          {file.path?.split("/").pop() || `File ${index + 1}`}
        </Button>
      );
    })}
  </Box>;
};

const ViewOrderDesigner = () => {
  const router = useRouter()
  const { id: orderId } = router.query
  const dispatch = useAppDispatch()
  const { singleOrder }: any = useAppSelector((state) => state.orders)

  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<
    Array<{
      path: string
      remark: string
      _id: string
      isExisting?: boolean
      isNew?: boolean
      file?: File
      isDeleted?: boolean
    }>
  >([])
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [reworkOpen, setReworkOpen] = useState(false)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [fileSelectionOpen, setFileSelectionOpen] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [designFileRemarks, setDesignFileRemarks] = useState<any>({})
  const [openFilesDialog, setOpenFilesDialog] = useState(false)
  const [deletedFiles, setDeletedFiles] = useState<string[]>([])
  const [pinvoiceModal, setPInvoiceModal] = useState(false)
  const [invoiceValidProofOpen, setInvoiceValidProofOpen] = useState(false)
  const [isPerformaInvoiceSaved, setIsPerformaInvoiceSaved] = useState(false)
  const { markets } = useAppSelector((state) => state.markets);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [newSelectedDesigner, setNewSelectedDesigner] = useState<any>(null)
  const [proformaHistoryOpen, setProformaHistoryOpen] = useState(false);
  const [proformaHistory, setProformaHistory] = useState<any[]>([]);
  const [sendApprovalLoading, setSendApprovalLoading] = useState(false);
  const isEditingDisabled = singleOrder?.invoiceValidProof && singleOrder.invoiceValidProof.length > 0;

  const fetchProformaHistory = async () => {
    if (!singleOrder?.orderNumber) return;

    try {
      if (singleOrder.proformaHistory && singleOrder.proformaHistory.length > 0) {
        console.log("✅ Found proforma history in order:", singleOrder.proformaHistory);
        setProformaHistory(singleOrder.proformaHistory);
      }
    } catch (err) {
      console.error("Failed to fetch proforma history:", err);
      toast.error("Failed to load proforma history");
    }
  };

  useEffect(() => {
    if (singleOrder?.orderNumber && isPerformaInvoiceSaved) {
      fetchProformaHistory();
    }
  }, [singleOrder, isPerformaInvoiceSaved]);


  const handleUpdateDesigner = async () => {
    if (!selectedStaff) {
      toast.error("Please select a designer");
      return;
    }
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found");
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        designer: selectedStaff.value,
        designerStatus: "Pending",
        designerRemarks: singleOrder?.designer
          ? `Reassigned from ${singleOrder.designer.name || "previous designer"} to ${selectedStaff.label}`
          : `Assigned to ${selectedStaff.label}`,
        reassignHistory: singleOrder?.designer
          ? [
            ...(singleOrder?.reassignHistory || []),
            {
              fromDesigner: singleOrder.designer._id,
              fromDesignerName: singleOrder.designer.name,
              toDesigner: selectedStaff.value,
              toDesignerName: selectedStaff.label,
              reassignedAt: new Date().toISOString(),
              reason: "Manual reassignment via Update Designer",
            },
          ]
          : singleOrder?.reassignHistory || [],
      };

      await dispatch(updateOrderThunk({ id: orderId, data: updateData as any })).unwrap();
      toast.success("Designer updated successfully");
      await dispatch(getOrderByIdThunk(orderId)).unwrap();
    } catch (err) {
      toast.error("Failed to update designer");
      console.error("Failed to update designer:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchOrderData = async () => {
      if (orderId && typeof orderId === "string") {
        try {
          setPageLoading(true)
          await dispatch(getOrderByIdThunk(orderId)).unwrap()
          await orderService.markNotificationRead(orderId, "designer")

          // Check if a performa invoice already exists for this order
          const response = await performanceInvoiceService.getPerformanceInvoices()
          const existingInvoice = response.data?.find(
            (invoice: any) => invoice.orderNumber === singleOrder?.orderNumber,
          )
          if (existingInvoice) {
            setIsPerformaInvoiceSaved(true)
          } else {
            setIsPerformaInvoiceSaved(false)
          }
        } catch (err) {
          console.error("Failed to fetch order or check invoice:", err)
          toast.error("Failed to load order data")
        } finally {
          setPageLoading(false)
        }
      }
    }
    fetchOrderData()
  }, [dispatch, orderId, singleOrder?.orderNumber])

  useEffect(() => {
    if (!markets.length) dispatch(getAllMarketsThunk())
  }, [])

  useEffect(() => {
    if (singleOrder?.status === "Printer" && orderId) {
      router.push(`/admin/all-orders/view/printers?id=${orderId}`)
    }
  }, [singleOrder, orderId])

  useEffect(() => {
    if (singleOrder) {
      const mutableFiles = (singleOrder.filePaths || []).map((file: any) => ({
        ...file,
        remark: file.remark || "",
        isExisting: true, // Mark as existing file
        isDeleted: false,
      }))
      setFiles(mutableFiles)
      setRemarks(singleOrder.remarks || "")

      // Set selected staff if designer exists
      if (singleOrder.designer && singleOrder.designer._id) {
        setSelectedStaff({
          value: singleOrder.designer._id,
          label: singleOrder.designer.name || `Designer ${singleOrder.designer._id}`,
        })
      } else {
        setSelectedStaff(null)
      }

      // Initialize design file remarks
      if (singleOrder.designFiles) {
        const remarks: { [key: number]: string } = {}
        singleOrder.designFiles.forEach((file: any, index: number) => {
          remarks[index] = file.remark || ""
        })
        setDesignFileRemarks(remarks)
      }
    }
  }, [singleOrder, isPerformaInvoiceSaved])

  const handleSendClientApproval = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found");
      return;
    }

    setSendApprovalLoading(true);

    try {
      await dispatch(updateOrderThunk({
        id: orderId,
        data: {
          clientApprovalSentAt: new Date()  // આવી રીતે મોકલો – backend માં Date માં સ્ટોર થશે
        } as any
      })).unwrap();

      toast.success("Client approval sent successfully!");
      await dispatch(getOrderByIdThunk(orderId)).unwrap(); // રિફ્રેશ કરવા
    } catch (err) {
      toast.error("Failed to send for client approval");
    } finally {
      setSendApprovalLoading(false);
    }
  };

  const handleAssignClick = async () => {
    if (!selectedStaff) {
      toast.error("Please select a designer first")
      return
    }
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }
    setLoading(true)
    try {

      // Get existing files (excluding deleted ones)
      const existingFilePaths = (singleOrder?.filePaths || [])
        .filter((file: any) => !deletedFiles.includes(file.path))
        .map((file: any) => {
          const localFile = files.find((f) => f.path === file.path && f.isExisting && !f.isDeleted)
          return {
            ...file,
            remark: localFile?.remark || file.remark || "",
          }
        })

      // Combine existing and new files
      const allFilePaths = [...existingFilePaths]

      const updateData = {
        designer: selectedStaff.value,
        designerStatus: "Pending",
        status: "Designer",
        remarks: remarks,
        filePaths: allFilePaths,
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Order assigned to designer successfully")
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (err) {
      toast.error("Failed to assign designer")
      console.error("Failed to assign designer:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleReassignDesigner = async () => {
    if (!newSelectedDesigner) {
      toast.error("Please select a new designer")
      return
    }
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }

    setLoading(true)
    try {
      const updateData = {
        designer: newSelectedDesigner.value,
        designerStatus: "Pending",
        designerRemarks: `Reassigned from ${singleOrder?.designer?.name || "previous designer"} to ${newSelectedDesigner.label}`,
        reassignHistory: [
          ...(singleOrder?.reassignHistory || []),
          {
            fromDesigner: singleOrder?.designer?._id,
            fromDesignerName: singleOrder?.designer?.name,
            toDesigner: newSelectedDesigner.value,
            toDesignerName: newSelectedDesigner.label,
            reassignedAt: new Date().toISOString(),
            reason: "Manual reassignment",
          },
        ],
      }

      await dispatch(updateOrderThunk({ id: orderId, data: updateData as any })).unwrap()
      toast.success("Designer reassigned successfully")
      setReassignDialogOpen(false)
      setNewSelectedDesigner(null)
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (err) {
      toast.error("Failed to reassign designer")
      console.error("Failed to reassign designer:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = () => {
    try {
      // const fullAddress = [
      //   singleOrder?.party?.address?.unitNo || "",
      //   // singleOrder?.party?.address?.streetAddress || "",
      //   singleOrder?.party?.address?.marketName || "",
      //   singleOrder?.party?.address?.landMark || "",
      //   singleOrder?.party?.address?.area || "",
      //   singleOrder?.party?.address?.pincode || "",
      // ]
      //   .filter((part) => part?.trim() !== "")
      //   .join(", ");

      const formData = {
        orderNumber: singleOrder?.orderNumber || "N/A",
        description: singleOrder?.description || "N/A",
        companyName: singleOrder?.companyName?.companyName || "N/A",
        remarks: singleOrder?.remarks || "",
        ownerMobileNo: singleOrder?.party?.ownerMobileNo || "",
        partyName: singleOrder?.party?.partyName || "N/A",
        addressName: `${singleOrder?.party?.address?.unitNo}, ${singleOrder?.party?.address?.marketName?.marketName}, ${singleOrder?.party?.address?.area?.area} - ${singleOrder?.party?.address?.pincode?.pincode}` || "N/A",
        GSTNo: singleOrder?.party?.GSTNo || "N/A",
        servicePerformance: singleOrder?.productItem?.itemName || "N/A",
        quantity: singleOrder?.qty || 0,
        // यहाँ quotation की जगह unitPrice सीधे order से लें
        unitPrice: singleOrder?.unitPrice || 0, // या आपके data structure के अनुसार
        total: singleOrder?.total || 0,
        finalAmount: singleOrder?.finalAmount || 0,
        applyGST: singleOrder?.applyGST || false,
        gstPercentage: singleOrder?.gstPercentage || 18,
        daysAfterConfirmation: singleOrder?.daysAfterConfirmation || 0,
        paymentDate: singleOrder?.paymentDate || 0, // यदि available हो तो
        quotation: true
      };
      // console.log("DEBUG : handleDownloadInvoice : formData:", formData);


      generateInvoicePDF(formData);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  const handleEmailClick = (type: 'design' | 'invoice' = 'design') => {
    const recipientEmail = singleOrder?.party?.email || ''; // Add party.email to your data if not exists
    const contactPerson = singleOrder?.party?.contactPerson || 'Customer';
    const orderNumber = singleOrder?.orderNumber || 'N/A';
    const companyName = singleOrder?.companyName?.companyName || 'N/A';
    const partyName = singleOrder?.party?.partyName || 'N/A';
    const itemName = singleOrder?.productItem?.itemName || 'N/A';
    const quantity = singleOrder?.qty || 0;
    const totalAmount = singleOrder?.total || 0;
    const finalAmount = singleOrder?.finalAmount || 0;
    const gstPercentage = singleOrder?.gstPercentage || 0;
    const remarks = singleOrder?.remarks || 'No remarks';

    // Address formatting
    const address = [
      singleOrder?.party?.address?.unitNo || '',
      singleOrder?.party?.address?.marketName?.marketName || '',
      singleOrder?.party?.address?.area?.area || '',
      singleOrder?.party?.address?.pincode?.pincode || '',
    ].filter(part => part?.trim() !== '').join(', ') || 'N/A';

    const gstText = gstPercentage > 0 ? ` (incl. ${gstPercentage}% GST)` : '';

    // Dynamic subject based on type
    const subject = type === 'invoice'
      ? `Invoice for Order ${orderNumber} - Payment Request`
      : `Order ${orderNumber} - ${type === 'design' ? 'Design Review' : 'Approval Required'}`;

    // Dynamic body with all details
    const body = `Dear ${contactPerson},

    ${type === 'invoice' ? 'Please find the invoice details below for your approval and payment.' : `Please review the ${type} for the following order.`}

    ---
    ORDER DETAILS:
    -------------

    Order Number: ${orderNumber}
    Company Name: ${companyName}
    Party Name: ${partyName}
    Contact Person: ${contactPerson}

    Address:
    ${address}

    Remarks:
    ${remarks}

    ---
    ${type === 'invoice' ? 'Please make the payment at your earliest convenience. Let us know if you have any questions.' : 'If everything looks good, reply with your approval. Otherwise, suggest any changes.'}

    Best regards,
    Your Team
    `;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleReworkSubmit = async (remark: string, files: File[]) => {
    if (!orderId || typeof orderId !== "string") return
    setLoading(true)
    try {

      const updateData = {
        designerStatus: "Rework",
        designerRemarks: remark,
        reworkHistory: [
          ...(singleOrder?.reworkHistory || []),
          {
            remark: remark,
            files: [], // Passing empty array as files are commented
            createdAt: new Date().toISOString(),
          },
        ],
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData as any })).unwrap()
      toast.success("Order sent for rework successfully")
      setReworkOpen(false)
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      toast.error(error || "Failed to send order for rework")
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalSubmit = async (files: File[], remark: string) => {
    if (!orderId || typeof orderId !== "string") return
    setLoading(true)
    try {

      const updateData = {
        designerStatus: "Approved",
        status: "Printer",
        validproof: [], // Passing empty array as files are commented
        designFiles: singleOrder?.designFiles?.map((file: any, index: number) => ({
          ...file,
          remark: designFileRemarks[index] || file.remark,
        })),
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData as any })).unwrap()
      toast.success("Order approved successfully")
      setApprovalOpen(false)
      const updatedOrder: any = await dispatch(getOrderByIdThunk(orderId)).unwrap()

      // Open file selection modal after approval only if files exist
      const hasFiles: any = (updatedOrder.designFiles?.length > 0) || (updatedOrder.reworkFiles?.length > 0)
      if (hasFiles) {
        setFileSelectionOpen(true)
      }
    } catch (error: any) {
      toast.error(error || "Failed to approve order")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelectionSubmit = async (selectedFiles: string[]) => {
    if (!orderId || typeof orderId !== "string") return
    setLoading(true)
    try {
      const updateData = {
        approvedFiles: selectedFiles, // This will be the array of selected file paths
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData as any })).unwrap()
      toast.success(`Selected ${selectedFiles.length} files for printing`)
      setFileSelectionOpen(false)
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      toast.error(error || "Failed to save file selection")
    } finally {
      setLoading(false)
    }
  }

  const getAllAvailableFiles = () => {
    const designFiles = singleOrder?.designFiles || []
    const reworkFiles = singleOrder?.reworkFiles || []
    return {
      designFiles,
      reworkFiles,
      allFiles: [...designFiles, ...reworkFiles]
    }
  }

  const { designFiles, reworkFiles } = getAllAvailableFiles()

  const handleInvoiceValidProofSubmit = async (files: File[], remark: string) => {
    if (!orderId || typeof orderId !== "string") return
    setLoading(true)
    try {
      let invoiceProofFiles: any[] = []
      if (files.length > 0) {
        // Upload files to server
        const uploadedFiles = await uploadFilesToServer(files, "invoicevalidproof")
        invoiceProofFiles = uploadedFiles.map((fileInfo: any) => ({
          path: fileInfo.path,
          remark: remark,
          uploadedAt: new Date().toISOString(),
        }))
      } else if (remark && remark.trim().length > 0) {
        // Save remark-only proof entry to enable approval and disable generation
        invoiceProofFiles = [
          {
            path: "",
            remark: remark.trim(),
            uploadedAt: new Date().toISOString(),
          },
        ]
      }

      const updateData = {
        invoiceValidProof: invoiceProofFiles,
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData as any })).unwrap()
      toast.success("Invoice validation proof submitted successfully")
      setInvoiceValidProofOpen(false)
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      toast.error(error || "Failed to submit invoice validation proof")
    } finally {
      setLoading(false)
    }
  }

  const canAssignToDesigner = singleOrder?.designerStatus === "Pending" && !singleOrder?.designer

  const isDesignComplete =
    (singleOrder?.designerStatus === "Done" ||
      singleOrder?.designerStatus === "Approved")
  /* && singleOrder?.designFiles?.length > 0 */

  const isApproved = singleOrder?.designerStatus === "Approved"

  const visibleFiles = files.filter((file) => !file.isDeleted)

  const handleStaffChange = (event: any, newValue: any) => {
    setSelectedStaff(newValue)
  }

  // FIXED: Remove "In Progress" from this condition - approval section should be shown when Done or Approved
  const shouldShowApprovalSection =
    singleOrder?.designerStatus === "Done" ||
    singleOrder?.designerStatus === "Approved"

  const shouldShowGenerateInvoiceButton = singleOrder?.designerStatus === "Approved"

  // Email section: show after invoice is generated (saved)
  const shouldShowInvoiceProofSection = singleOrder?.designerStatus === "Approved" && isPerformaInvoiceSaved

  // Next button: show only after invoice is approved (invoiceValidProof submitted)
  const shouldShowNextButton = isEditingDisabled

  // Check if order is in Rework status (waiting for designer to resubmit)
  const isInReworkStatus = singleOrder?.designerStatus === "Rework"

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
        <StepperProgress
          activeStep={1}
          orderStatus={singleOrder?.status}
          designerStatus={singleOrder?.designerStatus}
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Button
                startIcon={<MdArrowBack />}
                onClick={() => router.push(`/admin/all-orders/view/?id=${orderId}`)}
                sx={{
                  color: "#344054",
                  fontWeight: 600,
                  textTransform: "none",
                  pb: 2,
                }}
              >
                Back to Order Received
              </Button>
              <Typography fontWeight={600} fontSize={16}>
                Designer
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={14} fontWeight={500}>
                Status:
              </Typography>
              <ThemeChip
                label={getFirstFourChars(singleOrder?.designerStatus || "Pending")}
                variant="outlined"
                sx={{
                  backgroundColor:
                    singleOrder?.designerStatus === "Approved"
                      ? "#E7F7EF"
                      : singleOrder?.designerStatus === "Done"
                        ? "#E7F7EF"
                        : singleOrder?.designerStatus === "In Progress"
                          ? "#FFF4E6"
                          : singleOrder?.designerStatus === "Rework"
                            ? "#FFF0F0"
                            : singleOrder?.designerStatus === "Pending"
                              ? "#E3F2FD"
                              : singleOrder?.designerStatus === "Assigned"
                                ? "#E3F2FD"
                                : "#F5F5F5",
                  color:
                    singleOrder?.designerStatus === "Approved"
                      ? "#12B76A"
                      : singleOrder?.designerStatus === "Done"
                        ? "#12B76A"
                        : singleOrder?.designerStatus === "In Progress"
                          ? "#F79009"
                          : singleOrder?.designerStatus === "Rework"
                            ? "#F04438"
                            : singleOrder?.designerStatus === "Pending"
                              ? "#1976D2"
                              : singleOrder?.designerStatus === "Assigned"
                                ? "#1976D2"
                                : "#666",
                }}
              />
            </Box>
          </Box>

          {singleOrder?.designerStatus === "In Progress" && singleOrder?.designer && (
            <Box
              sx={{
                backgroundColor: "#E3F2FD",
                border: "1px solid #2196F3",
                borderRadius: 2,
                p: 2,
                mb: 2,
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={600} color="#1976D2" fontSize={14}>
                    🔄 Designer is working
                  </Typography>
                  <Typography fontSize={12} color="#1976D2">
                    Designer: {singleOrder.designer.name} is currently working on this order.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setReassignDialogOpen(true)}
                  sx={{
                    borderColor: "#F79009",
                    color: "#F79009",
                    "&:hover": {
                      backgroundColor: "#FFF4E6",
                      borderColor: "#F79009",
                    },
                  }}
                >
                  Reassign Designer
                </Button>
              </Box>
            </Box>
          )}

          {singleOrder?.designerStatus === "Done" && (
            <Box
              sx={{
                backgroundColor: "#E7F7EF",
                border: "1px solid #12B76A",
                borderRadius: 2,
                p: 2,
                mb: 2,
              }}
            >
              <Typography fontWeight={600} color="#12B76A" fontSize={14}>
                ✅ Design has done
              </Typography>
              <Typography fontSize={12} color="#12B76A">
                The designer has completed the task. You can now review and send for client approval.
              </Typography>
            </Box>
          )}

          {/* NEW: Show Rework Status Banner when order is sent for rework */}
          {isInReworkStatus && (
            <Box
              sx={{
                backgroundColor: "#FFF0F0",
                border: "2px solid #F04438",
                borderRadius: 2,
                p: 2,
                mb: 2,
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight={600} color="#F04438" fontSize={16}>
                  🔄 Order Sent for Rework
                </Typography>
              </Box>
              <Typography fontSize={14} color="#B42318" mt={1}>
                Designer: {singleOrder.designer?.name} is currently working on the rework.
                Approval options will be available once the designer resubmits the work.
              </Typography>
              {singleOrder?.designerRemarks && (
                <Box mt={2} sx={{ p: 1.5, bgcolor: "#FFF", borderRadius: 1, border: "1px solid #FECDCA" }}>
                  <Typography fontSize={12} fontWeight={500} color="#666" mb={0.5}>
                    Last Rework Remark:
                  </Typography>
                  <Typography fontSize={13} color="#B42318" sx={{ fontStyle: "italic" }}>
                    "{singleOrder.designerRemarks}"
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {singleOrder?.reassignHistory && singleOrder.reassignHistory.length > 0 && (
            <Box
              sx={{
                backgroundColor: "#F3F3F4",
                p: 2,
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Typography fontWeight={600} mb={1} fontSize={14}>
                Reassignment History
              </Typography>
              {singleOrder.reassignHistory.map((entry: any, index: number) => (
                <Box key={index} sx={{ mb: 1, fontSize: 12, color: "#666" }}>
                  <Typography fontSize={12}>
                    {new Date(entry.reassignedAt).toLocaleString()}: Reassigned from {entry.fromDesignerName} to{" "}
                    {entry.toDesignerName}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
            <Box flex={1} minWidth={240}>
              <ThemeInput
                labelName="Order No"
                value={singleOrder.orderNumber || "N/A"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box flex={1} minWidth={240}>
              <ThemeInput
                labelName="Company Name"
                value={singleOrder.companyName?.companyName || "N/A"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box flex={1} minWidth={240}>
              <ThemeInput
                labelName="Party Name"
                value={singleOrder.party?.partyName || "N/A"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box flex={1} minWidth={240}>
              <ThemeInput
                labelName="Whatsapp Number"
                value={singleOrder.party?.ownerWhatsAppNo || "N/A"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box flex={1} minWidth={240}>
              <ThemeInput
                labelName="Item Name"
                value={singleOrder.productItem?.itemName || "N/A"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box flex={1} minWidth={240}>
              <ThemeInput
                labelName="Printing Type"
                value={singleOrder?.pType || "N/A"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box flex={1} minWidth={240}>
              <ThemeInput
                labelName="Binding Type"
                value={singleOrder?.bindingType?.name || "N/A"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box flex={1} minWidth={240}>
              <ThemeInput
                labelName="Binding Page"
                value={singleOrder?.bindingPage || "N/A"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box flex={1} minWidth={240}>
              <ThemeInput
                labelName="Booklet Folder Type"
                value={singleOrder?.bookletFolderType || "N/A"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box flex={1} minWidth={240} display="flex" alignItems="center" gap={2}>
              <Box flex={1}>
                <RoleStaffSelect
                  label="Select Designers"
                  name="designerRole"
                  value={selectedStaff}
                  onChange={handleStaffChange}
                  onStaffChange={handleStaffChange}
                  roleFilter="Designer"
                  showStaff={true}
                />
              </Box>
              <ThemeButton
                onClick={handleUpdateDesigner}
                disabled={loading || !selectedStaff || isEditingDisabled}
                sx={{
                  background: selectedStaff && !isEditingDisabled ? "#1976D2" : "#ccc",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  borderRadius: 2,
                  py: 1,
                  px: 2,
                  "&:hover": {
                    background: selectedStaff && !isEditingDisabled ? "#1565C0" : "#ccc",
                  },
                }}
              >
                {loading ? "Updating..." : "Update Designer"}
              </ThemeButton>
            </Box>
          </Box>

          <Box mb={2}>
            <ThemeInput
              labelName="Remarks"
              placeholder="Enter Remarks"
              multiline
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              InputProps={{ readOnly: !canAssignToDesigner }}
            />
          </Box>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<AiOutlineEye />}
            onClick={() => setOpenFilesDialog(true)}
            sx={{
              fontWeight: 600,
              color: "#344054",
              borderColor: "#D0D5DD",
              textTransform: "none",
              background: "#fff",
              "&:hover": { background: "#f6fef9" },
              mb: 2,
            }}
          >
            View All Files ({visibleFiles.length})
          </Button>
          {canAssignToDesigner && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                mb: 2,
              }}
            >
              <ThemeButton
                sx={{
                  background: selectedStaff ? "#12B76A" : "#ccc",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 2,
                  py: 1,
                  "&:hover": {
                    background: selectedStaff ? "#079455" : "#ccc",
                  },
                  width: "100%",
                  maxWidth: 400,
                }}
                onClick={handleAssignClick}
                disabled={!selectedStaff || loading}
              >
                {loading ? "Assigning..." : "Assign To Designer →"}
              </ThemeButton>
            </Box>
          )}

          <Collapse in={shouldShowApprovalSection} timeout="auto" unmountOnExit>
            <Box mt={4}>
              {isDesignComplete && (
                <>

                  {singleOrder?.reworkHistory && singleOrder.reworkHistory.length > 0 && (
                    <Box
                      sx={{
                        background: "#F3F3F4",
                        p: 3,
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 15 }}>Rework History</Typography>
                      {singleOrder.reworkHistory.map((entry: any, index: number) => (
                        <ReworkEntry key={index} entry={entry} />
                      ))}
                    </Box>
                  )}

                  {singleOrder?.reworkFiles && singleOrder.reworkFiles.length > 0 && (
                    <Box
                      sx={{
                        background: "#FFF4E6",
                        p: 3,
                        borderRadius: 2,
                        mb: 2,
                        border: "1px solid #F79009",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 15, color: "#B54708" }}>
                          Rework Files by Designer
                        </Typography>
                        <Chip
                          label={`${singleOrder.reworkFiles.length} files`}
                          size="small"
                          sx={{ backgroundColor: "#F79009", color: "white" }}
                        />
                      </Box>

                      <Stack spacing={2}>
                        {singleOrder.reworkFiles.map((file: any, index: number) => {
                          const handleViewReworkFile = () => {
                            try {
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
                            } catch (error) {
                              console.error("Error opening rework file:", error);
                              toast.error("Failed to open rework file");
                            }
                          };

                          const fileName = file.path?.split("/").pop() || `Rework_File_${index + 1}`;

                          return (
                            <Box
                              key={index}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                p: 2,
                                backgroundColor: "white",
                                borderRadius: 1,
                                border: "1px solid #e0e0e0"
                              }}
                            >
                              <Button
                                variant="outlined"
                                startIcon={<AiOutlineEye />}
                                onClick={handleViewReworkFile}
                                sx={{
                                  minWidth: 200,
                                  textTransform: "none",
                                  fontWeight: 500,
                                  backgroundColor: "#fff",
                                  borderColor: "#F79009",
                                  color: "#B54708",
                                  "&:hover": {
                                    backgroundColor: "#FFF4E6",
                                    borderColor: "#F79009",
                                  },
                                }}
                              >
                                {fileName}
                              </Button>

                              <Box sx={{ flex: 1 }}>
                                {file.remark && (
                                  <>
                                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#666" }}>
                                      Remarks:
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, color: "#666" }}>
                                      {file.remark}
                                    </Typography>
                                  </>
                                )}
                                {file.uploadedAt && (
                                  <Typography sx={{ fontSize: 11, color: "#999", mt: 0.5 }}>
                                    Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                  <Box display="flex" gap={2} mb={2} width="100%">
                    {/* Generate Proforma Invoice */}
                    {!isEditingDisabled && (
                      <ThemeButton
                        sx={{
                          flex: 1,
                          background: "#B100FF",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 16,
                          borderRadius: 2,
                          py: 1.2,
                          "&:hover": { background: "#8B00CC" },
                        }}
                        onClick={() => setPInvoiceModal(true)}
                      >
                        Generate Proforma Invoice
                      </ThemeButton>
                    )}

                    {/* View History */}
                    <ThemeButton
                      sx={{
                        flex: 1,
                        background: "#9C27B0",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 16,
                        borderRadius: 2,
                        py: 1.2,
                        "&:hover": { background: "#7B1FA2" },
                      }}
                      onClick={() => setProformaHistoryOpen(true)}
                    >
                      View History
                    </ThemeButton>

                    {/* Approve Invoice (visible after invoice generated) */}
                    {isPerformaInvoiceSaved && !isEditingDisabled && (
                      <ThemeButton
                        sx={{
                          flex: 1,
                          background: "#12B76A",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 16,
                          borderRadius: 2,
                          py: 1.2,
                          "&:hover": { background: "#079455" },
                        }}
                        onClick={() => setInvoiceValidProofOpen(true)}
                      >
                        Approve Invoice
                      </ThemeButton>
                    )}

                    {/* Download Invoice (Only when disabled) */}
                    {isEditingDisabled && (
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
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                        onClick={handleDownloadInvoice}
                      >
                        <MdDownload />
                        Download Invoice
                      </ThemeButton>
                    )}
                  </Box>

                  <Collapse in={shouldShowInvoiceProofSection} timeout="auto" unmountOnExit>
                    <Typography fontWeight={600} mb={2}>
                      Send Invoice for Approval via
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={4}>
                      <Box
                        onClick={handleEmailClick}
                        sx={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          border: "1px solid #D0D5DD",
                          borderRadius: 2,
                          px: 2,
                          py: 1.2,
                          backgroundColor: "#fff",
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "#F9FAFB" },
                        }}
                      >
                        <MdEmail size={18} color="#F04438" />
                        <Typography fontWeight={500} fontSize={14} color="#344054">
                          Email
                        </Typography>
                      </Box>

                    </Stack>
                    <Button
                      fullWidth
                      onClick={() => router.push(`/admin/all-orders/view/printers/?id=${orderId}`)}
                      sx={{
                        background: "#12B76A",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 16,
                        borderRadius: 2,
                        py: 1.2,
                        "&:hover": { background: "#079455" },
                      }}
                    >
                      Next
                    </Button>
                  </Collapse>
                  {!isApproved && (
                    <>
                      <Typography fontWeight={600} mb={2}>
                        Send for Approval via
                      </Typography>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={4}>
                        <Box
                          onClick={handleEmailClick}
                          sx={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                            border: "1px solid #D0D5DD",
                            borderRadius: 2,
                            px: 2,
                            py: 1.2,
                            backgroundColor: "#fff",
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "#F9FAFB" },
                          }}
                        >
                          <MdEmail size={18} color="#F04438" />
                          <Typography fontWeight={500} fontSize={14} color="#344054">
                            Email
                          </Typography>
                        </Box>

                      </Stack>
                      <Stack direction="row" spacing={2}>
                        <ThemeButton
                          onClick={handleSendClientApproval}
                          disabled={sendApprovalLoading || singleOrder?.clientApprovalSentAt}
                          sx={{
                            background: singleOrder?.clientApprovalSentAt ? "#6B7280" : "#10B981", // ગ્રે જો પહેલાં મોકલાયેલું હોય
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 16,
                            borderRadius: 2,
                            py: 1.2,
                            width: "100%",
                            "&:hover": {
                              background: singleOrder?.clientApprovalSentAt ? "#6B7280" : "#059669",
                            },
                          }}
                        >
                          {sendApprovalLoading
                            ? "Sending..."
                            : singleOrder?.clientApprovalSentAt
                              ? `Sent on ${formatDateToDDMMYYYY(singleOrder.clientApprovalSentAt)}`
                              : "Send Client Approval"}
                        </ThemeButton>
                        <ThemeButton
                          sx={{
                            background: "#6366F1",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 16,
                            borderRadius: 2,
                            py: 1.2,
                            width: "100%",
                            "&:hover": { background: "#4F46E5" },
                          }}
                          onClick={() => setApprovalOpen(true)}
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Approved"}
                        </ThemeButton>
                        <ThemeButton
                          sx={{
                            background: "#F04438",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 16,
                            borderRadius: 2,
                            py: 1.2,
                            width: "100%",
                            "&:hover": { background: "#D92D20" },
                          }}
                          onClick={() => setReworkOpen(true)}
                        >
                          Re-work
                        </ThemeButton>
                      </Stack>
                    </>
                  )}
                </>
              )}
            </Box>
          </Collapse>
          <FileSelectionDialog
            open={fileSelectionOpen}
            onClose={() => setFileSelectionOpen(false)}
            onSubmit={handleFileSelectionSubmit}
            loading={loading}
            designFiles={designFiles}
            reworkFiles={reworkFiles}
          />
          <Collapse in={shouldShowGenerateInvoiceButton} timeout="auto" unmountOnExit>
            <Box mt={4}>
              <Typography fontWeight={600} mb={2} color="#12B76A">
                ✅ Design Approved
              </Typography>
              {singleOrder?.validproof && singleOrder.validproof.length > 0 && (
                <Box mb={3}>
                  <Typography fontWeight={500} mb={1}>
                    Validation Proof Files
                  </Typography>
                  {singleOrder.validproof.map((file: any, index: number) => {
                    const handleViewValidProof = () => {
                      try {
                        const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383"

                        if (file.path.startsWith("http")) {
                          window.open(file.path, "_blank")
                        } else if (file.path.startsWith("/uploads")) {
                          window.open(`${BaseURL}${file.path}`, "_blank")
                        } else {
                          if (file.path.startsWith("design/")) {
                            window.open(`${BaseURL}/uploads/${file.path}`, "_blank")
                          } else if (file.path.startsWith("general/")) {
                            window.open(`${BaseURL}/uploads/${file.path}`, "_blank")
                          } else {
                            window.open(`${BaseURL}/api/filedownload/download/${encodeURIComponent(file.path)}?view=true`, "_blank")
                          }
                        }
                      } catch (error) {
                        console.error("Error opening design file:", error)
                        toast.error("Failed to open design file")
                      }
                    };

                    return (
                      <Button
                        key={index}
                        variant="outlined"
                        startIcon={<AiOutlineEye />}
                        onClick={handleViewValidProof}
                        sx={{
                          mr: 1,
                          mb: 1,
                          textTransform: "none",
                          fontWeight: 500,
                          backgroundColor: "#fff",
                          borderColor: "#12B76A",
                          color: "#12B76A",
                        }}
                      >
                        {file.path?.split("/").pop() || `Proof ${index + 1}`}
                      </Button>
                    );
                  })}
                </Box>
              )}
              <Box display="flex" gap={2} mb={2} width="100%">
                {/* Generate Proforma Invoice */}
                {!isEditingDisabled && (
                  <ThemeButton
                    sx={{
                      flex: 1,
                      background: "#B100FF",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 16,
                      borderRadius: 2,
                      py: 1.2,
                      "&:hover": { background: "#8B00CC" },
                    }}
                    onClick={() => setPInvoiceModal(true)}
                  >
                    Generate Proforma Invoice
                  </ThemeButton>
                )}

                {/* View History */}
                <ThemeButton
                  sx={{
                    flex: 1,
                    background: "#9C27B0",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 2,
                    py: 1.2,
                    "&:hover": { background: "#7B1FA2" },
                  }}
                  onClick={() => setProformaHistoryOpen(true)}
                >
                  View History
                </ThemeButton>

                {/* Approve Invoice (visible after invoice generated) */}
                {isPerformaInvoiceSaved && !isEditingDisabled && (
                  <ThemeButton
                    sx={{
                      flex: 1,
                      background: "#12B76A",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 16,
                      borderRadius: 2,
                      py: 1.2,
                      "&:hover": { background: "#079455" },
                    }}
                    onClick={() => setInvoiceValidProofOpen(true)}
                  >
                    Approve Invoice
                  </ThemeButton>
                )}

                {/* Download Invoice (Only when disabled) */}
                {isEditingDisabled && (
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                    onClick={handleDownloadInvoice}
                  >
                    <MdDownload />
                    Download Invoice
                  </ThemeButton>
                )}
              </Box>

              {/* Email section - shown after invoice is generated */}
              <Collapse in={shouldShowInvoiceProofSection} timeout="auto" unmountOnExit>
                <Typography fontWeight={600} mb={2}>
                  Send Invoice for Approval via
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
                  <Box
                    onClick={handleEmailClick}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      border: "1px solid #D0D5DD",
                      borderRadius: 2,
                      px: 2,
                      py: 1.2,
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#F9FAFB" },
                    }}
                  >
                    <MdEmail size={18} color="#F04438" />
                    <Typography fontWeight={500} fontSize={14} color="#344054">
                      Email
                    </Typography>
                  </Box>
                </Stack>
              </Collapse>

              {/* Next button - shown only after invoice is approved (Approve Invoice submitted) */}
              <Collapse in={shouldShowNextButton} timeout="auto" unmountOnExit>
                <Button
                  fullWidth
                  onClick={() => router.push(`/admin/all-orders/view/printers/?id=${orderId}`)}
                  sx={{
                    background: "#12B76A",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 2,
                    py: 1.2,
                    mt: 2,
                    "&:hover": { background: "#079455" },
                  }}
                >
                  Next →
                </Button>
              </Collapse>
            </Box>
          </Collapse>
        </Paper>

        <Dialog open={reassignDialogOpen} onClose={() => setReassignDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography fontWeight={600} fontSize={18}>
              Reassign Designer
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography fontSize={14} color="#666" mb={2}>
                Current Designer: {singleOrder?.designer?.name}
              </Typography>

              <RoleStaffSelect
                label="Select New Designer"
                name="newDesigner"
                value={newSelectedDesigner}
                onChange={(event: any, newValue: any) => setNewSelectedDesigner(newValue)}
                onStaffChange={(event: any, newValue: any) => setNewSelectedDesigner(newValue)}
                roleFilter="Designer"
                showStaff={true}
              />

              <Typography fontSize={12} color="#F79009" mt={2}>
                ⚠️ Reassigning will reset the designer status to "Pending" and the new designer will start fresh.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setReassignDialogOpen(false)
                setNewSelectedDesigner(null)
              }}
              sx={{ color: "#666" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignDesigner}
              disabled={!newSelectedDesigner || loading}
              sx={{
                backgroundColor: "#F79009",
                color: "#fff",
                "&:hover": { backgroundColor: "#E6820A" },
                "&:disabled": { backgroundColor: "#ccc" },
              }}
            >
              {loading ? "Reassigning..." : "Reassign Designer"}
            </Button>
          </DialogActions>
        </Dialog>

        <ReworkDialog
          open={reworkOpen}
          onClose={() => setReworkOpen(false)}
          onSubmit={handleReworkSubmit}
          loading={loading}
        />
        <ApprovalDialog
          open={approvalOpen}
          onClose={() => setApprovalOpen(false)}
          onSubmit={handleApprovalSubmit}
          loading={loading}
        />

        <ViewFilesDialog
          open={openFilesDialog}
          onClose={() => setOpenFilesDialog(false)}
          files={visibleFiles.filter((f) => f.isExisting).map((file: any) => file.path) || []}
          title="Original Order Files"
          showDownload={true}
          showView={true}
        />
        <InvoiceValidProofDialog
          open={invoiceValidProofOpen}
          onClose={() => setInvoiceValidProofOpen(false)}
          onSubmit={handleInvoiceValidProofSubmit}
          loading={loading}
        />
      </Box>
      <AddNewPerformanceInvoiceDialog
        open={pinvoiceModal}
        onClose={() => setPInvoiceModal(false)}
        invoiceId={undefined}
        data={singleOrder}
        orderId={orderId as string}
        onInvoiceSaved={() => setIsPerformaInvoiceSaved(true)}
      />
      <ProformaHistoryDialog
        open={proformaHistoryOpen}
        onClose={() => setProformaHistoryOpen(false)}
        history={proformaHistory}
      />
    </>
  )
}

export default ViewOrderDesigner

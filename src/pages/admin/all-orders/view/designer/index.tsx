"use client"
import type React from "react"
import { useRef, useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Collapse,
  IconButton,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material"
import { MdEmail, MdRemoveRedEye, MdArrowBack, MdClose, MdEdit, MdDelete, MdDownload } from "react-icons/md"
import { AiOutlineEye } from "react-icons/ai"
import { FaWhatsapp } from "react-icons/fa6"
import { useRouter } from "next/router"
import { toast } from "react-toastify"
import { useAppDispatch, useAppSelector } from "@/store"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { deleteFileThunk } from "@/store/slices/fileUploadSlice"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import StepperProgress from "@/component/common_component/stepperprogress"
import ThemeChip from "@/component/common_component/themechip"
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import FileUpload from "@/component/reusablecomponents/FileUpload"
import AddNewPerformanceInvoiceDialog from "@/component/PerformanceInvoice/AddNewPerformanceInvoiceDialog"
import { performanceInvoiceService } from "@/services/performanceInvoice.service"
import Request from "@/services/axios"
import { generateInvoicePDF } from "@/utills/generateInvoicePDF"

// Helper function to upload files to server

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


const DesignFile: React.FC<{
  file: any
  index: number
  onRemarkChange: (index: number, remark: string) => void
  onRedesign: (index: number) => void
  onDelete: (index: number) => void
  canEdit: boolean
}> = ({ file, index, onRemarkChange, onRedesign, onDelete, canEdit }) => {
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
        } else {
          window.open(`${BaseURL}/api/filedownload/download/${encodeURIComponent(file.path)}?view=true`, "_blank")
        }
      }
    } catch (error) {
      console.error("Error opening file:", error)
      toast.error("Failed to open file")
    }
  }

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end" mb={2}>
      <Button
        variant="outlined"
        startIcon={<AiOutlineEye />}
        onClick={handleViewFile}
        sx={{
          minWidth: 160,
          height: 45,
          textTransform: "none",
          fontWeight: 600,
          backgroundColor: "#fff",
          borderColor: "#ccc",
          color: "#333",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
      >
        {file.path?.split("/").pop() || `Design File ${index + 1}`}
      </Button>
      <Box flex={1} width="100%">
        <Typography fontSize={14} fontWeight={500} mb={0.5}>
          Design Remarks
        </Typography>
        <TextField
          placeholder="Remarks…."
          fullWidth
          size="small"
          variant="outlined"
          value={file.remark || ""}
          onChange={(e) => onRemarkChange(index, e.target.value)}
          InputProps={{ style: { backgroundColor: "#fff" }, readOnly: !canEdit }}
        />
      </Box>
      {canEdit && (
        <Box display="flex" gap={1}>
          <IconButton
            onClick={() => onRedesign(index)}
            sx={{
              color: "#1976D2",
              "&:hover": { backgroundColor: "#E3F2FD" },
            }}
          >
            <MdEdit />
          </IconButton>
          <IconButton
            onClick={() => onDelete(index)}
            sx={{
              color: "#F04438",
              "&:hover": { backgroundColor: "#FEF2F2" },
            }}
          >
            <MdDelete />
          </IconButton>
        </Box>
      )}
    </Stack>
  )
}

const ReworkEntry: React.FC<{ entry: any }> = ({ entry }) => (
  <Box sx={{ borderBottom: "1px solid #ccc", pb: 2, mb: 2 }}>
    <Typography sx={{ color: "#333", fontSize: 14, mb: 1 }}>
      Date: {new Date(entry.createdAt).toLocaleString()}
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
  </Box>
);

const ReworkDialog = ({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (remark: string, files: File[]) => void
  loading: boolean
}) => {
  const [reworkRemark, setReworkRemark] = useState("")
  const fileUploadRef = useRef<any>(null)

  const handleSubmit = async () => {
    if (!reworkRemark.trim()) {
      toast.error("Please provide a remark for rework")
      return
    }
    let selectedFiles: File[] = []
    if (fileUploadRef.current) {
      selectedFiles = fileUploadRef.current.getSelectedFiles() || []
    }
    onSubmit(reworkRemark, selectedFiles)
    setReworkRemark("")
  }

  const handleClose = () => {
    setReworkRemark("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handleClose} size="small" sx={{ mr: 1 }}>
            <MdArrowBack />
          </IconButton>
          <Typography fontWeight={600} fontSize={18}>
            Re-work
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box pt={1}>
          <ThemeInput
            labelName="Re-work Remark"
            placeholder="Enter Remark"
            fullWidth
            value={reworkRemark}
            onChange={(e) => setReworkRemark(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box mb={2}>
            <Typography fontWeight={500} fontSize={14} mb={1}>
              Attach Reference Files (Optional)
            </Typography>
            <FileUpload
              ref={fileUploadRef}
              folder="orders"
              multiple={true}
              accept="*/*"
              variant="dropzone"
              onFilesSelected={() => { }}
              onUploadError={(error) => toast.error(error)}
              showPreview={false}
              showUploadButton={true} // Changed to true
              autoUpload={true} // Changed to true
              label="Attach Order Files"
              helperText="Select order documents, images, or any related files "
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ background: "#F04438", "&:hover": { background: "#D92D20" } }}
        >
          {loading ? "Sending..." : "Send For Rework"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const ApprovalDialog = ({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (files: File[], remark: string) => void
  loading: boolean
}) => {
  const [approvalRemark, setApprovalRemark] = useState("")
  const fileUploadRef = useRef<any>(null)

  const handleSubmit = async () => {
    let selectedFiles: File[] = []
    if (fileUploadRef.current) {
      selectedFiles = fileUploadRef.current.getSelectedFiles() || []
    }
    if (selectedFiles.length === 0) {
      toast.error("Please upload validation proof file")
      return
    }
    onSubmit(selectedFiles, approvalRemark)
    setApprovalRemark("")
  }

  const handleClose = () => {
    setApprovalRemark("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handleClose} size="small" sx={{ mr: 1 }}>
            <MdArrowBack />
          </IconButton>
          <Typography fontWeight={600} fontSize={18}>
            Upload Validation Proof
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box pt={1}>
          <ThemeInput
            labelName="Approval Remark (Optional)"
            placeholder="Enter approval remark"
            fullWidth
            value={approvalRemark}
            onChange={(e) => setApprovalRemark(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box mb={2}>
            <Typography fontWeight={500} fontSize={14} mb={1}>
              Upload Validation Proof *
            </Typography>
            <FileUpload
              ref={fileUploadRef}
              folder="orders"
              multiple={true}
              accept="*/*"
              variant="dropzone"
              onFilesSelected={() => {}}
              onUploadError={(error) => toast.error(error)}
              showPreview={false}
              showUploadButton={false}
              autoUpload={false}
              label="Drop validation proof files here"
              helperText="Upload proof files for design approval"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? "Uploading..." : "Approve Design"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const RedesignDialog = ({
  open,
  onClose,
  onSubmit,
  loading,
  currentFile,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (file: File, remark: string) => void
  loading: boolean
  currentFile: any
}) => {
  const [redesignRemark, setRedesignRemark] = useState("")
  const fileUploadRef = useRef<any>(null)

  const handleSubmit = async () => {
    let selectedFiles: File[] = []
    if (fileUploadRef.current) {
      selectedFiles = fileUploadRef.current.getSelectedFiles() || []
    }
    if (selectedFiles.length === 0) {
      toast.error("Please upload a redesigned file")
      return
    }
    onSubmit(selectedFiles[0], redesignRemark)
    setRedesignRemark("")
  }

  const handleClose = () => {
    setRedesignRemark("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handleClose} size="small" sx={{ mr: 1 }}>
            <MdArrowBack />
          </IconButton>
          <Typography fontWeight={600} fontSize={18}>
            Redesign File: {currentFile?.path?.split("/").pop()}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box pt={1}>
          <ThemeInput
            labelName="Redesign Remark (Optional)"
            placeholder="Enter redesign remark"
            fullWidth
            value={redesignRemark}
            onChange={(e) => setRedesignRemark(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box mb={2}>
            <Typography fontWeight={500} fontSize={14} mb={1}>
              Upload Redesigned File *
            </Typography>
            <FileUpload
              ref={fileUploadRef}
              folder="design"
              multiple={false}
              accept="*/*"
              variant="dropzone"
              onFilesSelected={() => { }}
              onUploadError={(error) => toast.error(error)}
              showPreview={true}
              showUploadButton={true} // Changed to true
              autoUpload={true} // Changed to true
              label="Drop redesigned file here"
              helperText="Upload the redesigned version of this file"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? "Uploading..." : "Replace File"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const InvoiceValidProofDialog = ({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (files: File[], remark: string) => void
  loading: boolean
}) => {
  const [invoiceProofRemark, setInvoiceProofRemark] = useState("")
  const fileUploadRef = useRef<any>(null)

  const handleSubmit = async () => {
    let selectedFiles: File[] = []
    if (fileUploadRef.current) {
      selectedFiles = fileUploadRef.current.getSelectedFiles() || []
    }
    if (selectedFiles.length === 0) {
      toast.error("Please upload invoice validation proof file")
      return
    }
    onSubmit(selectedFiles, invoiceProofRemark)
    setInvoiceProofRemark("")
  }

  const handleClose = () => {
    setInvoiceProofRemark("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handleClose} size="small" sx={{ mr: 1 }}>
            <MdArrowBack />
          </IconButton>
          <Typography fontWeight={600} fontSize={18}>
            Upload Invoice Validation Proof
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box pt={1}>
          <ThemeInput
            labelName="Invoice Proof Remark (Optional)"
            placeholder="Enter invoice proof remark"
            fullWidth
            value={invoiceProofRemark}
            onChange={(e) => setInvoiceProofRemark(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box mb={2}>
            <Typography fontWeight={500} fontSize={14} mb={1}>
              Upload Invoice Validation Proof *
            </Typography>
            <FileUpload
              ref={fileUploadRef}
              folder="orders"
              multiple={true}
              accept="*/*"
              variant="dropzone"
              onFilesSelected={() => {}}
              onUploadError={(error) => toast.error(error)}
              showPreview={false}
              showUploadButton={false}
              autoUpload={false}
              label="Drop invoice validation proof files here"
              helperText="Upload proof files for invoice validation"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? "Uploading..." : "Submit Invoice Proof"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const ViewOrderDesigner = () => {
  const fileUploadRef = useRef<any>(null)
  const router = useRouter()
  const { id: orderId } = router.query
  const dispatch = useAppDispatch()
  const { singleOrder } = useAppSelector((state) => state.orders)
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
  const [redesignOpen, setRedesignOpen] = useState(false)
  const [currentRedesignFile, setCurrentRedesignFile] = useState<any>(null)
  const [currentRedesignIndex, setCurrentRedesignIndex] = useState<number>(-1)
  const [remarks, setRemarks] = useState("")
  const [designFileRemarks, setDesignFileRemarks] = useState<{
    [key: number]: string
  }>({})
  const [newFileRemarks, setNewFileRemarks] = useState<{
    [key: string]: string
  }>({})
  const [openFilesDialog, setOpenFilesDialog] = useState(false)
  const [openDesignFilesDialog, setOpenDesignFilesDialog] = useState(false)
  const [deletedFiles, setDeletedFiles] = useState<string[]>([])
  const [pinvoiceModal, setPInvoiceModal] = useState(false)
  const [invoiceValidProofOpen, setInvoiceValidProofOpen] = useState(false)
  const [isPerformaInvoiceSaved, setIsPerformaInvoiceSaved] = useState(false)

  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [newSelectedDesigner, setNewSelectedDesigner] = useState<any>(null)
  const isEditingDisabled = singleOrder?.invoiceValidProof && singleOrder.invoiceValidProof.length > 0;

  useEffect(() => {
    const fetchOrderData = async () => {
      if (orderId && typeof orderId === "string") {
        try {
          setPageLoading(true)
          await dispatch(getOrderByIdThunk(orderId)).unwrap()

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

  // Handle file remark changes for original order files
  const handleFileRemarkChange = (index: number, value: string) => {
    const updatedFiles = [...files]
    const file = updatedFiles[index]
    // Create a new object to avoid read-only property issues
    updatedFiles[index] = {
      ...file,
      remark: value,
    }
    setFiles(updatedFiles)
    // Also update newFileRemarks for new files
    if (file.isNew) {
      setNewFileRemarks((prev) => ({
        ...prev,
        [file.path]: value,
      }))
    }
  }

  // Handle design file remark changes
  const handleDesignRemarkChange = (index: number, remark: string) => {
    setDesignFileRemarks((prev) => ({
      ...prev,
      [index]: remark,
    }))
  }

  // Handle redesign file
  const handleRedesignFile = (index: number) => {
    setCurrentRedesignFile(singleOrder.designFiles[index])
    setCurrentRedesignIndex(index)
    setRedesignOpen(true)
  }

  // Handle delete design file
  const handleDeleteDesignFile = async (index: number) => {
    if (!orderId || typeof orderId !== "string") return
    setLoading(true)
    try {
      const updatedDesignFiles = [...(singleOrder.designFiles || [])]
      updatedDesignFiles.splice(index, 1)
      const updateData = {
        designFiles: updatedDesignFiles,
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Design file deleted successfully")
      // Refresh order data
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      toast.error(error || "Failed to delete design file")
    } finally {
      setLoading(false)
    }
  }

  // Handle redesign submission
  const handleRedesignSubmit = async (file: File, remark: string) => {
    if (!orderId || typeof orderId !== "string") return
    setLoading(true)
    try {
      // Upload the file to server
      const uploadedFiles = await uploadFilesToServer([file], "design")

      if (uploadedFiles.length === 0) {
        throw new Error("File upload failed")
      }

      const uploadedFile = uploadedFiles[0]

      const updatedDesignFiles = [...(singleOrder.designFiles || [])]
      updatedDesignFiles[currentRedesignIndex] = {
        path: uploadedFile.path,
        remark: remark || designFileRemarks[currentRedesignIndex] || "",
        uploadedAt: new Date().toISOString(),
      }

      const updateData = {
        designFiles: updatedDesignFiles,
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Design file updated successfully")
      setRedesignOpen(false)
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      toast.error(error || "Failed to update design file")
    } finally {
      setLoading(false)
    }
  }

  const handleFilesSelected = (selectedFiles: File[]) => {
    const newFileList = selectedFiles.map((file) => ({
      path: file.name,
      remark: "",
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      isNew: true,
      isDeleted: false,
    }))
    setFiles([...files, ...newFileList])
    const remarks: { [key: string]: string } = {}
    selectedFiles.forEach((file) => {
      remarks[file.name] = ""
    })
    setNewFileRemarks((prev) => ({ ...prev, ...remarks }))
  }

  const handleDeleteFile = async (index: number) => {
    const fileToDelete = files[index]
    if (fileToDelete.isNew) {
      const updatedFiles = files.filter((_, i) => i !== index)
      setFiles(updatedFiles)
      if (newFileRemarks[fileToDelete.path]) {
        const updatedRemarks = { ...newFileRemarks }
        delete updatedRemarks[fileToDelete.path]
        setNewFileRemarks(updatedRemarks)
      }
      if (fileUploadRef.current && fileToDelete.file) {
        fileUploadRef.current.removeFile(fileToDelete.file)
      }
      toast.success("File removed successfully")
    } else if (fileToDelete.isExisting) {
      try {
        setLoading(true)
        const pathParts = fileToDelete.path.split("/")
        const filename = pathParts.pop() || ""
        const folder = pathParts.join("/") || "orders"
        await dispatch(deleteFileThunk({ folder, filename })).unwrap()
        const updatedFiles = [...files]
        updatedFiles[index] = {
          ...fileToDelete,
          isDeleted: true,
        }
        setFiles(updatedFiles)
        setDeletedFiles((prev) => [...prev, fileToDelete.path])
        toast.success("File deleted successfully")
      } catch (error: any) {
        console.error("Failed to delete file:", error)
        toast.error(error || "Failed to delete file")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleFileUploadRemove = (removedFile: File) => {
    const updatedFiles = files.filter((file) => !(file.isNew && file.file && file.file.name === removedFile.name))
    setFiles(updatedFiles)
    const updatedRemarks = { ...newFileRemarks }
    delete updatedRemarks[removedFile.name]
    setNewFileRemarks(updatedRemarks)
  }

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error)
    toast.error(error)
  }

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
      let newFilePaths: any[] = []

      // Get selected files from FileUpload component
      if (fileUploadRef.current) {
        const selectedFiles = fileUploadRef.current.getSelectedFiles()
        if (selectedFiles.length > 0) {
          // Upload files to server
          const uploadedFiles = await uploadFilesToServer(selectedFiles, "orders")

          // Create file path objects with remarks
          newFilePaths = uploadedFiles.map((fileInfo: any, index: number) => ({
            path: fileInfo.path,
            remark: newFileRemarks[selectedFiles[index].name] || "",
            uploadedAt: new Date().toISOString(),
          }))
        }
      }

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
      const allFilePaths = [...existingFilePaths, ...newFilePaths]

      const updateData = {
        designer: selectedStaff.value,
        designerStatus: "Pending",
        status: "Designer",
        remarks: remarks,
        filePaths: allFilePaths, // This now includes both existing and newly uploaded files
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

      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
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
      const fullAddress = [
        singleOrder?.party?.address?.unitNo || "",
        singleOrder?.party?.address?.streetAddress || "",
        singleOrder?.party?.address?.marketName || "",
        singleOrder?.party?.address?.landMark || "",
        singleOrder?.party?.address?.area || "",
        singleOrder?.party?.address?.pincode || "",
      ]
        .filter((part) => part.trim() !== "")
        .join(", ");

      const formData = {
        orderNumber: singleOrder?.orderNumber || "N/A",
        companyName: singleOrder?.companyName?.companyName || "N/A",
        remarks: singleOrder?.remarks || "",
        ownerMobileNo: singleOrder?.party?.ownerMobileNo || "",
        partyName: singleOrder?.party?.partyName || "N/A",
        addressName: fullAddress || "N/A",
        GSTNo: singleOrder?.party?.GSTNo || "N/A",
        servicePerformance: singleOrder?.productItem?.itemName || "N/A",
        quantity: singleOrder?.qty || 0,
        unitPrice: singleOrder?.unitPrice || 0,
        total: singleOrder?.total || 0,
        finalAmount: singleOrder?.finalAmount || 0,
        applyGST: singleOrder?.applyGST || false,
        gstPercentage: singleOrder?.gstPercentage || 18,
        daysAfterConfirmation: singleOrder?.daysAfterConfirmation || 0,
      };

      generateInvoicePDF(formData);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };


  const handleEmailClick = () => {
    const subject = `Order ${singleOrder?.orderNumber} - Design Review`
    const body = `Dear ${singleOrder?.party?.contactPerson},\n\nPlease review the design for order ${singleOrder?.orderNumber}.\n\nBest regards`
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, "_blank")
  }

  const handleWhatsAppClick = () => {
    const phoneNumber = singleOrder?.party?.ownerWhatsAppNo
    if (phoneNumber) {
      const message = `Hello ${singleOrder?.party?.contactPerson}, your order ${singleOrder?.orderNumber} design is ready for review.`
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")
    } else {
      toast.error("WhatsApp number not available")
    }
  }

  const handleReworkSubmit = async (remark: string, files: File[]) => {
    if (!orderId || typeof orderId !== "string") return
    setLoading(true)
    try {
      let reworkFiles: any[] = []
      if (files.length > 0) {
        // Upload files to server
        const uploadedFiles = await uploadFilesToServer(files, "rework")
        reworkFiles = uploadedFiles.map((fileInfo: any) => ({
          path: fileInfo.path,
          remark: remark,
          uploadedAt: new Date().toISOString(),
        }))
      }

      const updateData = {
        designerStatus: "Rework",
        designerRemarks: remark,
        reworkHistory: [
          ...(singleOrder?.reworkHistory || []),
          {
            remark: remark,
            files: reworkFiles,
            createdAt: new Date().toISOString(),
          },
        ],
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
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
      let validproofFiles: any[] = []
      if (files.length > 0) {
        // Upload files to server
        const uploadedFiles = await uploadFilesToServer(files, "validproof")
        validproofFiles = uploadedFiles.map((fileInfo: any) => ({
          path: fileInfo.path,
          remark: remark,
          uploadedAt: new Date().toISOString(),
        }))
      }

      const updateData = {
        designerStatus: "Approved",
        status: "Designer",
        validproof: validproofFiles,
        designFiles: singleOrder?.designFiles?.map((file: any, index: number) => ({
          ...file,
          remark: designFileRemarks[index] || file.remark,
        })),
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Order approved successfully")
      setApprovalOpen(false)
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      toast.error(error || "Failed to approve order")
    } finally {
      setLoading(false)
    }
  }

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
      }

      const updateData = {
        invoiceValidProof: invoiceProofFiles,
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success("Invoice validation proof submitted successfully")
      setInvoiceValidProofOpen(false)
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      toast.error(error || "Failed to submit invoice validation proof")
    } finally {
      setLoading(false)
    }
  }

  const getFileNameFromPath = (path: string) => {
    return path.split("/").pop() || "File"
  }

  const canAssignToDesigner = singleOrder?.designerStatus === "Pending" && !singleOrder?.designer

  const isDesignComplete =
    (singleOrder?.designerStatus === "In Progress" ||
      singleOrder?.designerStatus === "Done" ||
      singleOrder?.designerStatus === "Rework" ||
      singleOrder?.designerStatus === "Approved") &&
    singleOrder?.designFiles?.length > 0

  const isApproved = singleOrder?.designerStatus === "Approved"

  const visibleFiles = files.filter((file) => !file.isDeleted)

  const handleStaffChange = (event: any, newValue: any) => {
    setSelectedStaff(newValue)
  }

  const renderDesignFileWithDesigner = (file: any, index: number) => {
    const handleViewDesignFile = () => {
      try {
        const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383"

        if (file.path.startsWith("http")) {
          window.open(file.path, "_blank")
        } else if (file.path.startsWith("/uploads")) {
          window.open(`${BaseURL}${file.path}`, "_blank")
        } else {
          if (file.path.startsWith("design/")) {
            window.open(`${BaseURL}/uploads/${file.path}`, "_blank")
          } else {
            window.open(`${BaseURL}/api/filedownload/download/${encodeURIComponent(file.path)}?view=true`, "_blank")
          }
        }
      } catch (error) {
        console.error("Error opening design file:", error)
        toast.error("Failed to open design file")
      }
    }

    return (
      <Box key={index} sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography fontWeight={600} fontSize={14}>
            Design File {index + 1}
          </Typography>
          {file.designerName && (
            <Chip
              label={`By: ${file.designerName}`}
              size="small"
              sx={{
                backgroundColor: "#E3F2FD",
                color: "#1976D2",
                fontWeight: 500,
              }}
            />
          )}
        </Box>

        <Box display="flex" gap={2} alignItems="center" mb={2}>
          <Button
            variant="outlined"
            startIcon={<MdRemoveRedEye />}
            onClick={handleViewDesignFile}
            sx={{
              fontWeight: 600,
              color: "#344054",
              borderColor: "#D0D5DD",
              textTransform: "none",
              background: "#fff",
              "&:hover": { background: "#f6fef9" },
            }}
          >
            {getFileNameFromPath(file.path)}
          </Button>

          {file.uploadedAt && (
            <Typography fontSize={12} color="#666">
              Uploaded: {new Date(file.uploadedAt).toLocaleString()}
            </Typography>
          )}
        </Box>

        <ThemeInput
          placeholder="Design file remarks..."
          value={designFileRemarks[index] || file.remark || ""}
          onChange={(e) => handleDesignRemarkChange(index, e.target.value)}
          InputProps={{ readOnly: isApproved }}
          fullWidth
          multiline
          rows={2}
        />

        {!isApproved && (
          <Box display="flex" gap={1} mt={2}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => handleDeleteDesignFile(index)}
              startIcon={<MdDelete />}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>
    )
  }

  const shouldShowApprovalSection =
    singleOrder?.designerStatus === "In Progress" ||
    singleOrder?.designerStatus === "Done" ||
    singleOrder?.designerStatus === "Approved" ||
    singleOrder?.designerStatus === "Rework"

  const shouldShowGenerateInvoiceButton = singleOrder?.designerStatus === "Approved"

  const shouldShowInvoiceProofSection = singleOrder?.designerStatus === "Approved" && isPerformaInvoiceSaved

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
                label={singleOrder?.designerStatus || "Pending"}
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
                            : singleOrder?.designerStatus === "Assigned"
                              ? "#1976D2"
                              : "#666",
                }}
              />
            </Box>
          </Box>

          {singleOrder?.designerStatus === "Pending" && singleOrder?.designer && (
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
                    🔄 Working in Progress to Design
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
                labelName="Item Name"
                value={singleOrder.productItem?.itemName || "N/A"}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box flex={1} minWidth={240}>
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
          </Box>
          {canAssignToDesigner && (
            <Box mb={2}>
              <FileUpload
                ref={fileUploadRef}
                folder="orders"
                multiple={true}
                accept="*/*"
                variant="dropzone"
                onFilesSelected={handleFilesSelected}
                onFileRemoved={handleFileUploadRemove}
                onUploadError={handleUploadError}
                showPreview={false}
                showUploadButton={false} // Changed to false to prevent auto-upload
                autoUpload={false} // Changed to false to handle upload manually
                label="Click to select files or drag and drop"
                helperText="Select order documents, images, or any related files"
              />
            </Box>
          )}
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
          <Typography fontWeight={600} mb={1}>
            Attached Files
          </Typography>
          <Stack spacing={2} mb={2}>
            {visibleFiles.map((file, index) => (
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" key={file._id}>
                <Box flex={1} minWidth={180}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<MdRemoveRedEye />}
                    sx={{
                      fontWeight: 600,
                      color: "#344054",
                      borderColor: "#D0D5DD",
                      textTransform: "none",
                      background: "#fff",
                      "&:hover": { background: "#f6fef9" },
                    }}
                    onClick={() => {
                      if (file.isExisting) {
                        const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383"
                        let viewUrl

                        if (file.path.startsWith("http")) {
                          viewUrl = file.path
                        } else if (file.path.startsWith("/uploads")) {
                          viewUrl = `${BaseURL}${file.path}`
                        } else {
                          viewUrl = `${BaseURL}/api/filedownload/download/${encodeURIComponent(file.path)}?view=true`
                        }

                        window.open(viewUrl, "_blank")
                      } else if (file.isNew) {
                        toast.info("File will be available after assignment")
                      }
                    }}
                  >
                    {getFileNameFromPath(file.path)}
                  </Button>
                </Box>
                <Box flex={3} minWidth={300}>
                  <ThemeInput
                    placeholder="Remarks...."
                    value={file.remark || ""}
                    onChange={(e) => handleFileRemarkChange(index, e.target.value)}
                    InputProps={{ readOnly: !canAssignToDesigner }}
                  />
                </Box>
                {canAssignToDesigner && (
                  <Box>
                    <IconButton
                      onClick={() => handleDeleteFile(index)}
                      disabled={loading}
                      sx={{
                        color: "#F04438",
                        "&:hover": { backgroundColor: "#FEF2F2" },
                        "&:disabled": { color: "#ccc" },
                      }}
                    >
                      <MdClose />
                    </IconButton>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
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
                  <Typography fontWeight={600} mb={2}>
                    Design Files
                  </Typography>
                  {singleOrder.designFiles?.map((file: any, index: number) =>
                    renderDesignFileWithDesigner(file, index),
                  )}

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AiOutlineEye />}
                    onClick={() => setOpenDesignFilesDialog(true)}
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
                    View All Design Files ({singleOrder?.designFiles?.length || 0})
                  </Button>

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
                        <Box
                          onClick={handleWhatsAppClick}
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
                            justifyContent: "center",
                            backgroundColor: "#fff",
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "#F9FAFB" },
                          }}
                        >
                          <FaWhatsapp size={18} color="#12B76A" />
                          <Typography fontWeight={500} fontSize={14} color="#344054">
                            WhatsApp
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={2}>
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
              <Box display="flex" gap={2} mb={2}>
                <ThemeButton
                  fullWidth
                  sx={{
                    background: isEditingDisabled ? "#ccc" : "#B100FF",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 2,
                    py: 1.2,
                    "&:hover": { background: isEditingDisabled ? "#ccc" : "#8B00CC" },
                  }}
                  onClick={() => setPInvoiceModal(true)}
                  disabled={isEditingDisabled}
                >
                  {isEditingDisabled ? "Invoice Already Generated" : "Generate Proforma Invoice"}
                </ThemeButton>
                {isEditingDisabled && (
                  <ThemeButton
                    fullWidth
                    sx={{
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
                    Download Invoice
                  </ThemeButton>
                )}
              </Box>

              <Collapse in={shouldShowInvoiceProofSection} timeout="auto" unmountOnExit>
                <Box mb={3}>
                  <Typography fontWeight={500} mb={1}>
                    Invoice Validation Proof Files
                  </Typography>
                  {singleOrder?.invoiceValidProof && singleOrder.invoiceValidProof.length > 0
                    ? singleOrder.invoiceValidProof.map((file: any, index: number) => {
                      const handleViewInvoiceProof = () => {
                        try {
                          const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383"

                          if (file.path.startsWith("http")) {
                            window.open(file.path, "_blank")
                          } else if (file.path.startsWith("/uploads")) {
                            window.open(`${BaseURL}${file.path}`, "_blank")
                          } else {
                            if (file.path.startsWith("design/")) {
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
                          onClick={handleViewInvoiceProof}
                          sx={{
                            mr: 1,
                            mb: 1,
                            textTransform: "none",
                            fontWeight: 500,
                            backgroundColor: "#fff",
                            borderColor: "#6366F1",
                            color: "#6366F1",
                          }}
                        >
                          {file.path?.split("/").pop() || `Invoice Proof ${index + 1}`}
                        </Button>
                      );
                    })
                    : isPerformaInvoiceSaved && (
                      <ThemeButton
                        fullWidth
                        sx={{
                          background: "#6366F1",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 16,
                          borderRadius: 2,
                          py: 1.2,
                          "&:hover": { background: "#4F46E5" },
                        }}
                        onClick={() => setInvoiceValidProofOpen(true)}
                        disabled={loading}
                      >
                        Add Invoice Approve Proof
                      </ThemeButton>
                    )}
                </Box>
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
                  <Box
                    onClick={handleWhatsAppClick}
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
                      justifyContent: "center",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#F9FAFB" },
                    }}
                  >
                    <FaWhatsapp size={18} color="#12B76A" />
                    <Typography fontWeight={500} fontSize={14} color="#344054">
                      WhatsApp
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  fullWidth
                  onClick={() => router.push(`/admin/all-orders/view/printers/?id=${orderId}`)}
                  disabled={!(singleOrder?.invoiceValidProof && singleOrder.invoiceValidProof.length > 0)}
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
        <RedesignDialog
          open={redesignOpen}
          onClose={() => setRedesignOpen(false)}
          onSubmit={handleRedesignSubmit}
          loading={loading}
          currentFile={currentRedesignFile}
        />
        <ViewFilesDialog
          open={openFilesDialog}
          onClose={() => setOpenFilesDialog(false)}
          files={visibleFiles.filter((f) => f.isExisting).map((file: any) => file.path) || []}
          title="Original Order Files"
          showDownload={true}
          showView={true}
        />
        <ViewFilesDialog
          open={openDesignFilesDialog}
          onClose={() => setOpenDesignFilesDialog(false)}
          files={singleOrder?.designFiles?.map((file: any) => file.path) || []}
          title="Design Files"
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
    </>
  )
}

export default ViewOrderDesigner
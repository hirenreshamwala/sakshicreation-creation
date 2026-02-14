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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  Divider,
} from "@mui/material"
import { MdEmail, MdRemoveRedEye, MdArrowBack, MdClose, MdDelete, MdDownload } from "react-icons/md"
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
import { getAllMarketsThunk } from "@/store/slices/marketDataSlice"
import { formatDateToDDMMYYYY, getFirstFourChars } from "@/utills/utills"

const FileSelectionDialog = ({
  open,
  onClose,
  onSubmit,
  loading,
  designFiles = [],
  reworkFiles = [],
}: {
  open: boolean
  onClose: () => void
  onSubmit: (selectedFiles: string[]) => void
  loading: boolean
  designFiles: any[]
  reworkFiles: any[]
}) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      let filesToSelect: string[] = [];

      // अगर rework files हैं तो केवल rework की सबसे last file select करें
      if (reworkFiles.length > 0) {
        // सबसे last rework file
        const lastReworkFile = reworkFiles[reworkFiles.length - 1];
        if (lastReworkFile?.path) {
          filesToSelect.push(lastReworkFile.path);
        }
      }
      // अगर rework files नहीं हैं और design files हैं
      else if (designFiles.length > 0) {
        // सबसे last design file
        const lastDesignFile = designFiles[designFiles.length - 1];
        if (lastDesignFile?.path) {
          filesToSelect.push(lastDesignFile.path);
        }
      }

      setSelectedFiles(filesToSelect);
    }
  }, [open, designFiles, reworkFiles])

  const handleFileToggle = (filePath: string) => {
    // अगर rework files हैं तो design files को toggle नहीं करने दें
    if (reworkFiles.length > 0) {
      // यह check करें कि toggle की जा रही file rework file है या नहीं
      const isReworkFile = reworkFiles.some(file => file.path === filePath);
      if (!isReworkFile) {
        toast.error("Cannot select design files when rework files are available");
        return;
      }
    }

    setSelectedFiles(prev =>
      prev.includes(filePath)
        ? prev.filter(path => path !== filePath)
        : [...prev, filePath]
    )
  }


  const handleSelectAll = () => {
    let allFilePaths: string[] = [];

    // अगर rework files हैं तो केवल rework files select करें
    if (reworkFiles.length > 0) {
      allFilePaths = reworkFiles.map(file => file.path);
    }
    // अगर rework files नहीं हैं तो design files select करें
    else {
      allFilePaths = designFiles.map(file => file.path);
    }

    setSelectedFiles(allFilePaths);
  }


  const handleDeselectAll = () => {
    setSelectedFiles([]);
  }

  const handleSubmit = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file for printing");
      return;
    }
    onSubmit(selectedFiles);
  }

  const handleViewFile = (file: any) => {
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
      console.error("Error opening file:", error)
      toast.error("Failed to open file")
    }
  }

  return (
    <Dialog open={open} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton size="small" sx={{ mr: 1 }}>
            <MdArrowBack />
          </IconButton>
          <Typography fontWeight={600} fontSize={18}>
            Select Files for Printing
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box pt={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography fontWeight={500}>
              Select files to send for printing ({selectedFiles.length} selected)
            </Typography>
            <Box display="flex" gap={1}>
              <Button size="small" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button size="small" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </Box>
          </Box>

          {/* Design Files Section */}
          {designFiles.length > 0 && (
            <Box mb={3}>
              <Typography fontWeight={600} fontSize={16} mb={2} color="#1976D2">
                Design Files ({designFiles.length})
              </Typography>
              <Stack spacing={1}>
                {designFiles.map((file, index) => (
                  <Box
                    key={`design-${index}`}
                    sx={{
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      backgroundColor: selectedFiles.includes(file.path) ? "#E3F2FD" : "white",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedFiles.includes(file.path)}
                            onChange={() => handleFileToggle(file.path)}
                            color="primary"
                          />
                        }
                        label=""
                      />
                      <Box flex={1}>
                        <Typography fontWeight={500} fontSize={14}>
                          {file.path?.split("/").pop() || `Design File ${index + 1}`}
                        </Typography>
                        {file.remark && (
                          <Typography fontSize={12} color="#666" mt={0.5}>
                            {file.remark}
                          </Typography>
                        )}
                        {file.uploadedAt && (
                          <Typography fontSize={11} color="#999" mt={0.5}>
                            Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AiOutlineEye />}
                        onClick={() => handleViewFile(file)}
                      >
                        View
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Rework Files Section */}
          {reworkFiles.length > 0 && (
            <Box mb={3}>
              <Typography fontWeight={600} fontSize={16} mb={2} color="#F79009">
                Rework Files ({reworkFiles.length})
              </Typography>
              <Stack spacing={1}>
                {reworkFiles.map((file, index) => (
                  <Box
                    key={`rework-${index}`}
                    sx={{
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      backgroundColor: selectedFiles.includes(file.path) ? "#FFF4E6" : "white",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedFiles.includes(file.path)}
                            onChange={() => handleFileToggle(file.path)}
                            color="primary"
                          />
                        }
                        label=""
                      />
                      <Box flex={1}>
                        <Typography fontWeight={500} fontSize={14}>
                          {file.path?.split("/").pop() || `Rework File ${index + 1}`}
                        </Typography>
                        {file.remark && (
                          <Typography fontSize={12} color="#666" mt={0.5}>
                            {file.remark}
                          </Typography>
                        )}
                        {file.uploadedAt && (
                          <Typography fontSize={11} color="#999" mt={0.5}>
                            Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AiOutlineEye />}
                        onClick={() => handleViewFile(file)}
                      >
                        View
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {designFiles.length === 0 && reworkFiles.length === 0 && (
            <Typography textAlign="center" color="#666" py={4}>
              No files available for selection
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {/* <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button> */}
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || selectedFiles.length === 0}
        >
          {loading ? "Processing..." : `Confirm Selection (${selectedFiles.length} files)`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
export default FileSelectionDialog
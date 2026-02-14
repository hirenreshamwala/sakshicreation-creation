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
    /*
    let selectedFiles: File[] = []
    if (fileUploadRef.current) {
      selectedFiles = fileUploadRef.current.getSelectedFiles() || []
    }
    if (selectedFiles.length === 0) {
      toast.error("Please upload a redesigned file")
      return
    }
    onSubmit(selectedFiles[0], redesignRemark)
    */
    onSubmit(null as any, redesignRemark)
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
          {/* File Upload for Redesign - Commented as per new requirement */}
          {/* 
          <Box mb={2}>
            <Typography fontWeight={500} fontSize={14} mb={1}>
              Upload Redesigned File *
            </Typography>
            <FileUpload
              ref={fileUploadRef}
              folder="design"
              multiple={false}
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
          */}
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

export default RedesignDialog

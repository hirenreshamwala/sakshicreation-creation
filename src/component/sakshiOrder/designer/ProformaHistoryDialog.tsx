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

const ProformaHistoryDialog = ({
  open,
  onClose,
  history
}: {
  open: boolean;
  onClose: () => void;
  history: any[];
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // console.log("DEBUG : ProformaHistoryDialog : history:", history);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography fontWeight={600} fontSize={18}>
            Proforma Invoice History
          </Typography>
          <IconButton onClick={onClose} size="small">
            <MdClose />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {history.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              No history available for this proforma invoice
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {history.map((entry, index) => (
              <ListItem
                key={index}
                divider={index < history.length - 1}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  py: 2
                }}
              >
                <Box width="100%" display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="textSecondary" fontWeight={600}>
                    Version {index + 1}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(entry.createdAt)}
                  </Typography>
                </Box>

                <Box width="100%" display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={1} mt={1}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Unit Price</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      ₹{Number(entry.unitPrice || 0).toFixed(2)}
                    </Typography>

                  </Box>

                  <Box>
                    <Typography variant="caption" color="textSecondary">Total</Typography>
                    <Typography variant="body2" fontWeight={500}>₹{Number(entry.total || 0)?.toFixed(2) || 0}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="textSecondary">GST %</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {entry.gstPercentage || 0}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Final Amount</Typography>
                    <Typography variant="body2" fontWeight={500}>₹{Number(entry.finalAmount || 0)?.toFixed(2) || 0}</Typography>
                  </Box>

                  {/* <Box>
                    <Typography variant="caption" color="textSecondary">GST Applied</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {entry.applyGST ? 'Yes' : 'No'}
                    </Typography>
                  </Box> */}

                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProformaHistoryDialog

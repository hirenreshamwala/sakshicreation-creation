"use client"
import { useEffect, useState } from "react"
import { Box, Typography, Paper, Button, CircularProgress, Stack, IconButton, FormControlLabel, Switch, Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material"
import { MdEmail } from "react-icons/md"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import StepperProgress from "@/component/common_component/stepperprogress"
import { useRouter } from "next/router"
import { useAppDispatch, useAppSelector } from "@/store"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { toast } from "react-toastify"
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import { useFormik } from "formik"
import * as Yup from "yup"
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { downloadVisitingCardPDF } from "@/utills/utills"
import { ArrowBack, Download } from "@mui/icons-material"
import moment from "moment"
import ThemeSelect from "@/component/common_component/themeselect"
import { getAllMaterialsThunk } from "@/store/slices/materialSlice"
import { getAllBinderTypesThunk } from "@/store/slices/binderTypeSlice"
import { orderService } from "@/services/order.service"
import { FaEye } from "react-icons/fa6"
import { getAllStaffThunk } from "@/store/slices/staffSlice"

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
  materialId?: string; // Add materialId to track the selected material
};

// Rate View Dialog Component
const BinderRateDialog = ({ open, onClose, binderId, binderName }: { open: boolean; onClose: () => void; binderId: string; binderName: string }) => {
  const { staffList: staff, error } = useAppSelector((state) => state.staff)
  const dispatch = useAppDispatch()
  const [binderRates, setBinderRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!staff?.length) dispatch(getAllStaffThunk())
  }, []);

  useEffect(() => {
    if (open && binderId) {
      fetchBinderRates();
    }
  }, [open, binderId]);

  const fetchBinderRates = async () => {
    setLoading(true);
    try {
      // Find the selected binder from staff list
      const selectedBinder = staff.find((s: any) => s._id === binderId);
      if (selectedBinder && selectedBinder.rates) {
        setBinderRates(selectedBinder.rates);
      } else {
        setBinderRates([]);
      }
    } catch (error) {
      console.error("Error fetching binder rates:", error);
      toast.error("Failed to load binder rates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={600}>
          {binderName} - Rate List
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : binderRates.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Typography fontWeight={600}>Size</Typography></TableCell>
                <TableCell><Typography fontWeight={600}>Pages</Typography></TableCell>
                <TableCell><Typography fontWeight={600}>Rate</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {binderRates.map((rate, index) => (
                <TableRow key={index}>
                  <TableCell>{rate.size || 'N/A'}</TableCell>
                  <TableCell>{rate.page || 'N/A'}</TableCell>
                  <TableCell>{rate.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box py={4} textAlign="center">
            <Typography color="textSecondary">No rates found for this binder</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const BinderForm = () => {
  const router = useRouter()
  const { id: orderId } = router.query
  const dispatch = useAppDispatch()
  const { singleOrder }: any = useAppSelector((state) => state.orders)
  const { binderTypes } = useAppSelector((state) => state.binderType);
  const { materials } = useAppSelector(state => state.materials);
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [selectedBinderStaff, setSelectedBinderStaff] = useState<any>(null)
  const [openBinderFilesDialog, setOpenBinderFilesDialog] = useState(false)
  const [uploadedBinderFiles, setUploadedBinderFiles] = useState<any[]>([])
  const [openDesignFilesDialog, setOpenDesignFilesDialog] = useState(false)
  const [binderPapers, setBinderPapers] = useState<PaperField[]>([])

  // Rate Dialog State
  const [rateDialogOpen, setRateDialogOpen] = useState(false)

  const getSelectedOption = (value: string, options: OptionType[]) => {
    return options.find((option) => option.value === value) || null;
  };

  const formik = useFormik({
    initialValues: {
      issuedDate: "",
      receivedDate: "",
      binderRemarks: "",
      size: "",
      binding: false, // Boolean
      bindingType: "", // String _id
      qty: "",
      subPaper: "",
      usedPaper: "",
      rateBook: "",
      totalAmount: "",
      gsm: "",
      gst: "",
      ratePerUnit: "",
      rowPaperSize: "",
      rowPaperUser: "",
      startNumber: "",
      endNumber: "",
      totalNumbering: "",
      numberingAmount: "",
    },
    validationSchema: Yup.object({
      issuedDate: Yup.string(),
      receivedDate: Yup.string()
        .test("is-greater-or-equal", "Received Date must be on or after Issued Date", function (value) {
          const { issuedDate } = this.parent
          if (!issuedDate || !value) return true
          return new Date(value) >= new Date(issuedDate)
        }),
      binderRemarks: Yup.string(),
      size: Yup.string(),
      // binding: Yup.boolean().required("Binding is required"),
      // bindingType: Yup.string().when('binding', {
      //   is: true,
      //   then: (schema) => schema.required("Binding Type is required"),
      //   otherwise: (schema) => schema.notRequired(),
      // }),
      qty: Yup.number().typeError("Must be a number"),
      subPaper: Yup.string(),
      usedPaper: Yup.string(),
      rateBook: Yup.string(),
      totalAmount: Yup.string(),
      gsm: Yup.string(),
      rowPaperSize: Yup.string(),
      rowPaperUser: Yup.string(),
      startNumber: Yup.string(),
      endNumber: Yup.string(),
      totalNumbering: Yup.string(),
      numberingAmount: Yup.string(),
      binderPapers: Yup.array().of(
        Yup.object().shape({
          numberOfSheetsUsed: Yup.string(),
          sheetSize: Yup.string(),
          paperType: Yup.string(),
          gsm: Yup.string(),
          ratePerUnit: Yup.string(),
        })
      ),
    }),
    onSubmit: async (values) => {
      if (!orderId || typeof orderId !== "string") {
        toast.error("Order ID not found")
        return
      }
      if (!selectedBinderStaff) {
        toast.error("Please select a binder to assign.")
        return
      }

      setLoading(true)
      try {
        const updateData = {
          binder: selectedBinderStaff.value,
          binderStatus: "Pending",
          status: "Binder",
          issuedDate: values.issuedDate,
          binderRemarks: values.binderRemarks,
          size: values.size,
          binding: values.binding, // Boolean
          bindingType: values.binding ? values.bindingType : null, // Conditional
          qty: values.qty,
          subPaper: values.subPaper,
          usedPaper: values.usedPaper,
          rateBook: values.rateBook,
          totalAmount: values.totalAmount,
          gsm: values.gsm,
          gst: values.gst,
          ratePerUnit: values.ratePerUnit,
          rowPaperSize: values.rowPaperSize,
          rowPaperUser: values.rowPaperUser,
          startNumber: values.startNumber,
          endNumber: values.endNumber,
          totalNumbering: values.totalNumbering,
          numberingAmount: values.numberingAmount,
          binderPapers: binderPapers,
        }

        await dispatch(updateOrderThunk({ id: orderId, data: updateData as any })).unwrap()
        toast.success("Order assigned to Binder successfully!")
        await dispatch(getOrderByIdThunk(orderId)).unwrap()
      } catch (error: any) {
        console.error("Error assigning to binder:", error)
        toast.error(error?.message || "Failed to assign to binder")
      } finally {
        setLoading(false)
      }
    },
  })
  // Auto-calculate Total Amount = (qty * rateBook)
  useEffect(() => {
    const qty = parseFloat(formik.values.qty) || 0;
    const rateBook = parseFloat(formik.values.rateBook) || 0;
    const baseTotal = qty * rateBook;
    formik.setFieldValue("totalAmount", baseTotal.toString());
  }, [formik.values.qty, formik.values.rateBook]);
  // Auto-calculate Numbering Amount = Total Amount + Total Numbering
  useEffect(() => {
    const totalAmt = parseFloat(formik.values.totalAmount) || 0;
    const totNum = parseFloat(formik.values.totalNumbering) || 0;
    const numAmt = totalAmt + totNum;
    formik.setFieldValue("numberingAmount", numAmt.toString());
  }, [formik.values.totalAmount, formik.values.totalNumbering]);
  useEffect(() => {
    const fetchOrderData = async () => {
      if (orderId && typeof orderId === "string") {
        try {
          setPageLoading(true)
          await dispatch(getOrderByIdThunk(orderId)).unwrap()
          await orderService.markNotificationRead(orderId, "binder")
          await dispatch(getAllStaffThunk()) // Fetch all staff for rates
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

  useEffect(() => {
    if (!materials.length) dispatch(getAllMaterialsThunk());
    if (!binderTypes.length) dispatch(getAllBinderTypesThunk());
  }, [dispatch, materials.length, binderTypes.length])

  useEffect(() => {
    if (singleOrder) {
      // Safely convert binding to boolean: handles boolean false/true, string "false"/"true", undefined/null/empty as false
      const bindingValue = !!singleOrder.binding && singleOrder.binding !== "false";
      formik.setValues({
        issuedDate: singleOrder.issuedDate
          ? new Date(singleOrder.issuedDate).toISOString()?.split("T")[0]
          : new Date().toISOString()?.split("T")[0],
        receivedDate: singleOrder.receivedDate ? new Date(singleOrder.receivedDate).toISOString()?.split("T")[0] : "",
        binderRemarks: singleOrder.binderRemarks || singleOrder.remarks || "",
        size: singleOrder.size || "",
        binding: bindingValue,
        bindingType: singleOrder.bindingType?._id || "",
        qty: singleOrder.qty?.toString() || "",
        subPaper: singleOrder.subPaper || "",
        usedPaper: singleOrder.usedPaper || "",
        rateBook: singleOrder.rateBook || "",
        totalAmount: singleOrder.totalAmount || "",
        gsm: singleOrder.gsm || "",
        gst: singleOrder.gst || "",
        ratePerUnit: singleOrder.ratePerUnit || "",
        rowPaperSize: singleOrder.rowPaperSize || "",
        rowPaperUser: singleOrder.rowPaperUser || "",
        startNumber: singleOrder.startNumber || "",
        endNumber: singleOrder.endNumber || "",
        totalNumbering: singleOrder.totalNumbering || "",
        numberingAmount: singleOrder.numberingAmount || "",
        // binderRemarks: singleOrder.binderRemarks || ""
      })

      if (singleOrder.binder && singleOrder.binder._id) {
        setSelectedBinderStaff({
          value: singleOrder.binder._id,
          label: singleOrder.binder.name || `Binder ${singleOrder.binder._id}`,
        })
      } else {
        setSelectedBinderStaff(null)
      }

      // Initialize binder papers
      const printerPaperCount = singleOrder.printerPapers?.length || 0
      if (singleOrder.binderPapers && singleOrder.binderPapers.length > 0) {
        setBinderPapers(singleOrder.binderPapers)
      } else {
        setBinderPapers([{
          paperName: `Paper-${printerPaperCount + 1}`,
          numberOfSheetsUsed: "",
          sheetSize: "",
          paperType: "",
          gsm: "",
          ratePerUnit: ""
        }])
      }

      setUploadedBinderFiles(singleOrder.binderFiles || [])
    }
  }, [singleOrder])

  const handleBinderStaffChange = (event: any, newValue: any) => {
    setSelectedBinderStaff(newValue)
  }

  const handleHoldToggle = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }
    setLoading(true)
    try {
      const newStatus = singleOrder?.status === "Hold" ? "Binder" : "Hold"
      const updateData: any = { status: newStatus }

      if (newStatus !== "Hold" && singleOrder?.binderStatus === "Hold") {
        updateData.binderStatus = "Pending"
      }

      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
      toast.success(`Order ${newStatus === "Hold" ? "put on hold" : "unheld"} successfully`)
      await dispatch(getOrderByIdThunk(orderId)).unwrap()
    } catch (error: any) {
      console.error("Error toggling hold status:", error)
      toast.error(error?.message || "Failed to toggle hold status")
    } finally {
      setLoading(false)
    }
  }

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
      prev.filter((file) => !(file.isNew && file.file && file.file.name === removedFile.name)),
    )
  }

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error)
    toast.error(error)
  }

  const handleAssignToBookletFolder = () => {
    router.push(`/admin/all-orders/view/booklet-folder/?id=${orderId}`)
  }

  const handleProceedToDelivery = () => {
    router.push(`/admin/all-orders/view/dilevery/?id=${orderId}`)
  }

  const handleViewUploadedBinderFiles = () => {
    setOpenBinderFilesDialog(true)
  }

  const handleAddBinderPaper = () => {
    const printerPaperCount = singleOrder?.printerPapers?.length || 0
    const binderPaperCount = binderPapers.length
    setBinderPapers([...binderPapers, {
      paperName: `Paper-${printerPaperCount + binderPaperCount + 1}`,
      numberOfSheetsUsed: "",
      sheetSize: "",
      paperType: "",
      gsm: "",
      ratePerUnit: ""
    }])
  }

  const handleBinderPaperChange = (index: number, field: keyof PaperField, value: string) => {
    const updatedPapers = [...binderPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      [field]: value.trim() === "" ? null : value // Convert empty strings to null
    };
    setBinderPapers(updatedPapers);
  };


  const handleDeleteBinderPaper = (index: number) => {
    if (binderPapers.length === 1) {
      toast.error("At least one paper field is required")
      return
    }
    const updatedPapers = binderPapers.filter((_, i) => i !== index)
    setBinderPapers(updatedPapers)
  }

  // Get unique material names
  // Get unique material names (using _id)
  const materialNameOptions = materials.map(material => ({
    value: material._id, // Use _id as value
    label: material.materialName,
  }));

  // Get GSM options for a specific material (_id)
  const getMaterialGSMOptions = (materialId: string) => {
    const findName = materials.find((m: any) => m._id === materialId);
    const filteredMaterials = materials.filter(m => m.materialName === findName?.materialName);
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
    const updatedPapers: any = [...binderPapers];
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
    const updatedPapers: any = [...binderPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      gsm: id || null, // Use null for empty values
      sheetSize: null,
    };
    setBinderPapers(updatedPapers);
  };

  // Handle size selection
  const handleMaterialSizeChange = (index: number, id: string) => {
    const updatedPapers: any = [...binderPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      sheetSize: id || null, // store _id
    };
    setBinderPapers(updatedPapers);
  };


  const handleDownload = () => {
    const data = {
      ...singleOrder,
      odNo: singleOrder.orderNumber,
      size: singleOrder.size,
      date: moment(singleOrder.issuedDate).format('DD-MM-YYYY'),
      quantity: singleOrder.qty,
      binding: singleOrder.binding,
      col: singleOrder.color,
      printer: `${singleOrder.printer.firstName} ${singleOrder.printer.lastName}`,
      remark: singleOrder.remarks,
      rate: singleOrder.rate,
      partyName: singleOrder?.party?.partyName || "",
      address: "",
    };

    downloadVisitingCardPDF(data);
  };

  // Email functionality implementation
  const handleEmailClick = (type: 'binder' = 'binder') => {
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
    const subject = `Order ${orderNumber} - Binder Work Completed`;

    // Dynamic body with all details
    const body = `Dear ${contactPerson},

Binder work for the following order has been completed. Please review the details and proceed to the next step (Booklet & Folder Binder or Delivery).

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
Please let us know if you have any questions or need adjustments.

Best regards,
Your Team
`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const handleViewRateClick = () => {
    if (!selectedBinderStaff) {
      toast.error("Please select a binder first");
      return;
    }
    setRateDialogOpen(true);
  };

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

  const isHeld = singleOrder?.status === "Hold"
  const isBinderAssigned = !!singleOrder?.binder
  const isBinderStatusDone = singleOrder?.binderStatus === "Done"
  const isBinderStatusInProgress = singleOrder?.binderStatus === "In Progress"
  const isPrinterStatusDone = singleOrder?.printerStatus === "Done"
  const areFieldsReadOnly = isHeld || isBinderStatusDone || isBinderStatusInProgress

  return (
    <>
      <Box>
        <Typography fontWeight={600} fontSize={18} mb={2}>
          {singleOrder.party?.partyName || "Party Name"}
        </Typography>
        <StepperProgress
          activeStep={3}
          orderStatus={singleOrder?.status}
          designerStatus={singleOrder?.designerStatus}
          printerStatus={singleOrder?.printerStatus}
        />
        <Paper
          variant="outlined"
          sx={{
            borderColor: "#12B76A",
            borderWidth: 2,
            borderRadius: 2,
            mt: 2,
            p: 2,
            background: "#fff",
          }}
        >
          <Typography fontWeight={600} fontSize={16} mb={2}>
            Binder
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
          {isBinderStatusInProgress && (
            <Box mb={3} sx={{ p: 2, bgcolor: "#E3F2FD", borderRadius: 2, border: "1px solid #2196F3" }}>
              <Typography fontWeight={500} fontSize={14} mb={1} color="#1976D2">
                🔄 Binder is working
              </Typography>
              <Typography fontSize={13} color="#1976D2">
                Binder is currently working on this order.
              </Typography>
            </Box>
          )}
          {isBinderStatusDone && (
            <Box mb={3} sx={{ p: 2, bgcolor: "#E8F5E8", borderRadius: 2, border: "1px solid #4CAF50" }}>
              <Typography fontWeight={500} fontSize={14} mb={1} color="#4CAF50">
                ✅ Binder Work Completed
              </Typography>
              <Typography fontSize={13} color="#666">
                This binder task has been marked as done.
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <ThemeButton
              variant="contained"
              onClick={handleViewRateClick}
              startIcon={<FaEye />}
              disabled={!selectedBinderStaff}
            >
              View Rate
            </ThemeButton>
          </Box>
          <Box display="flex" gap={2} mb={2} width={"100%"} justifyContent={"space-between"}>
            <ThemeInput
              labelName="Order Number"
              value={singleOrder.orderNumber || "N/A"}
              sx={{ flex: 1 }}
              InputProps={{ readOnly: true }}
            />
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
              labelName="Whatsapp Number"
              value={singleOrder.party?.ownerWhatsAppNo || "N/A"}
              sx={{ flex: 1 }}
              InputProps={{ readOnly: true }}
            />

            <RoleStaffSelect
              label="Assign to Binder"
              name="binderStaff"
              value={selectedBinderStaff}
              onChange={handleBinderStaffChange}
              onStaffChange={handleBinderStaffChange}
              roleFilter="Binder"
              showStaff={true}
              disabled={areFieldsReadOnly || isBinderAssigned}
            />
          </Box>
          <Box display="flex" gap={2} mb={2} justifyContent={"space-between"}>
            <ThemeInput
              labelName="Item Name"
              value={singleOrder.productItem?.itemName || "N/A"}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            {/* <ThemeInput
              labelName="Issued Date"
              type="date"
              name="issuedDate"
              value={formik.values.issuedDate}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
              error={formik.touched.issuedDate && Boolean(formik.errors.issuedDate)}
              helperText={formik.touched.issuedDate && (formik.errors.issuedDate as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.issuedDate }}
            />
            <ThemeInput
              labelName="Received Date"
              type="date"
              name="receivedDate"
              value={formik.values.receivedDate}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
              error={formik.touched.receivedDate && Boolean(formik.errors.receivedDate)}
              helperText={formik.touched.receivedDate && (formik.errors.receivedDate as string)}
              InputProps={{ readOnly: true }}
            /> */}
            <ThemeInput
              labelName="Item Size"
              name="size"
              value={formik.values.size}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.size && Boolean(formik.errors.size)}
              helperText={formik.touched.size && (formik.errors.size as string)}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Item Qty"
              name="qty"
              value={formik.values.qty}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.qty && Boolean(formik.errors.qty)}
              helperText={formik.touched.qty && (formik.errors.qty as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.qty }}
            />
          </Box>
          <Box display="flex" gap={2} mb={2} justifyContent={"space-between"}>
            {/* <ThemeInput
              labelName="Pages / item"
              name="pagesPerBook"
              value={formik.values.pagesPerBook}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.pagesPerBook && Boolean(formik.errors.pagesPerBook)}
              helperText={formik.touched.pagesPerBook && (formik.errors.pagesPerBook as string)}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Binding"
              name="binding"
              value={formik.values.binding}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.binding && Boolean(formik.errors.binding)}
              helperText={formik.touched.binding && (formik.errors.binding as string)}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Used Paper"
              name="usedPaper"
              value={formik.values.usedPaper}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.usedPaper && Boolean(formik.errors.usedPaper)}
              helperText={formik.touched.usedPaper && (formik.errors.usedPaper as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.usedPaper }}
            /> */}
            {/* Binding Switch and Conditional Select */}
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.binding}
                  onChange={(e) => formik.setFieldValue("binding", e.target.checked)}
                  color="primary"
                  disabled={areFieldsReadOnly}
                />
              }
              label="Binding"
              sx={{ flex: 1, justifyContent: "flex-start" }}
            />
            {formik.values.binding && (
              <Box sx={{ width: 1 }} >
                <ThemeSelect
                  label="Binding Type"
                  value={getSelectedOption(formik.values.bindingType, binderTypes?.map((item) => ({ value: item?._id, label: item?.name })) || [])}
                  options={binderTypes?.map((item) => ({ value: item?._id, label: item?.name })) || []}
                  onChange={(_, v) => formik.setFieldValue("bindingType", v ? v.value : "")}
                  // required
                  disabled={areFieldsReadOnly}
                  sx={{ flex: 1 }}
                />
              </Box>
            )}
            <ThemeInput
              labelName="Rate / book"
              name="rateBook"
              value={formik.values.rateBook}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.rateBook && Boolean(formik.errors.rateBook)}
              helperText={formik.touched.rateBook && (formik.errors.rateBook as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.rateBook }}
            />
            <ThemeInput
              labelName="Total Amount"
              name="totalAmount"
              value={formik.values.totalAmount}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.totalAmount && Boolean(formik.errors.totalAmount)}
              helperText={formik.touched.totalAmount && (formik.errors.totalAmount as string)}
              InputProps={{ readOnly: true }}
            />
          </Box>
          <Box display="flex" gap={2} mb={2} justifyContent={"space-between"}>
            <ThemeInput
              labelName="Start Number"
              name="startNumber"
              value={formik.values.startNumber}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.startNumber && Boolean(formik.errors.startNumber)}
              helperText={formik.touched.startNumber && (formik.errors.startNumber as string)}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="End Number"
              name="endNumber"
              value={formik.values.endNumber}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.endNumber && Boolean(formik.errors.endNumber)}
              helperText={formik.touched.endNumber && (formik.errors.endNumber as string)}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Total Numbering"
              name="totalNumbering"
              value={formik.values.totalNumbering}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.totalNumbering && Boolean(formik.errors.totalNumbering)}
              helperText={formik.touched.totalNumbering && (formik.errors.totalNumbering as string)}
            />
            <ThemeInput
              labelName="Final Amount with Numbering"
              name="numberingAmount"
              value={formik.values.numberingAmount}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.numberingAmount && Boolean(formik.errors.numberingAmount)}
              helperText={formik.touched.numberingAmount && (formik.errors.numberingAmount as string)}
              InputProps={{ readOnly: true }}
            />
            {(isBinderStatusDone || isBinderStatusInProgress) && (
              <ThemeInput
                labelName="Binder Wasted Sheet"
                value={singleOrder?.binderWastedSheet?.toString() || "0"}
                type="number"
                sx={{ flex: 1 }}
                InputProps={{ readOnly: true }}
              />
            )}
          </Box>
          <ThemeInput
            sx={{ mb: 2 }}
            labelName="Remarks"
            placeholder="Enter Remarks"
            fullWidth
            multiline
            rows={3}
            name="binderRemarks" // ✅ name change करें
            value={formik.values.binderRemarks} // ✅ value change करें
            onChange={formik.handleChange}
            error={formik.touched.binderRemarks && Boolean(formik.errors.binderRemarks)} // ✅ error change करें
            helperText={formik.touched.binderRemarks && (formik.errors.binderRemarks as string)} // ✅ helperText change करें
          />
          {/* Commented out GSM, Raw Paper Size, Raw Paper No of Sheet Used fields */}
          {/* <Box display="flex" gap={2} mb={2} justifyContent={"space-between"}>
            <ThemeInput
              labelName="GSM"
              name="gsm"
              value={formik.values.gsm}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.gsm && Boolean(formik.errors.gsm)}
              helperText={formik.touched.gsm && (formik.errors.gsm as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.gsm }}
            />
            <ThemeInput
              labelName="Raw Paper Size"
              name="rowPaperSize"
              value={formik.values.rowPaperSize}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.rowPaperSize && Boolean(formik.errors.rowPaperSize)}
              helperText={formik.touched.rowPaperSize && (formik.errors.rowPaperSize as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.rowPaperSize }}
            />
            <ThemeInput
              labelName="Raw Paper No of Sheet Used"
              name="rowPaperUser"
              value={formik.values.rowPaperUser}
              onChange={formik.handleChange}
              sx={{ flex: 1 }}
              error={formik.touched.rowPaperUser && Boolean(formik.errors.rowPaperUser)}
              helperText={formik.touched.rowPaperUser && (formik.errors.rowPaperUser as string)}
              InputProps={{ readOnly: areFieldsReadOnly || !!singleOrder.rowPaperUser }}
            />
          </Box> */}
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
                  {!areFieldsReadOnly && (
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
                  <ThemeSelect
                    label="Paper Type"
                    options={materialNameOptions}
                    value={materialNameOptions.find(opt => opt.value === paper.paperType) || null}
                    onChange={(e, newValue) =>
                      handleMaterialNameChange(index, newValue?.value as string || "")
                    }
                  // required
                  // disabled={areFieldsReadOnly}
                  />

                  <ThemeSelect
                    label="GSM"
                    options={getMaterialGSMOptions(paper.paperType) as any}
                    value={getMaterialGSMOptions(paper.paperType).find(opt => opt.value === paper.gsm) || null as any}
                    onChange={(e, newValue) =>
                      handleMaterialGSMChange(index, newValue?.value as string || "")
                    }
                  // required
                  // disabled={!paper.paperType || areFieldsReadOnly}
                  />

                  <ThemeSelect
                    label="Size"
                    options={getMaterialSizeOptions(paper.paperType, paper.gsm)}
                    value={getMaterialSizeOptions(paper.paperType, paper.gsm).find(opt => opt.value === paper.sheetSize) || null}
                    onChange={(e, newValue) =>
                      handleMaterialSizeChange(index, newValue?.value as string || "")
                    }
                  // required
                  // disabled={!paper.paperType || !paper.gsm || areFieldsReadOnly}
                  />

                  <ThemeInput
                    labelName="Number of Sheets Used"
                    value={paper.numberOfSheetsUsed}
                    onChange={(e) => handleBinderPaperChange(index, 'numberOfSheetsUsed', e.target.value)}
                    fullWidth
                    // required
                    // error={!paper.numberOfSheetsUsed && formik.submitCount > 0}
                    // helperText={!paper.numberOfSheetsUsed && formik.submitCount > 0 ? "This field is required" : ""}
                    InputProps={{ readOnly: areFieldsReadOnly }}
                  />
                  {/* <ThemeInput
                    labelName="Rate / Unit"
                    value={paper.ratePerUnit}
                    onChange={(e) => handleBinderPaperChange(index, 'ratePerUnit', e.target.value)}
                    fullWidth
                    // required
                    // error={!paper.ratePerUnit && formik.submitCount > 0}
                    // helperText={!paper.ratePerUnit && formik.submitCount > 0 ? "This field is required" : ""}
                    InputProps={{ readOnly: areFieldsReadOnly }}
                  /> */}
                </Stack>
              </Box>
            ))}
            {!areFieldsReadOnly && (
              <Box display="flex" justifyContent="flex-end">
                <ThemeButton
                  onClick={handleAddBinderPaper}
                  disabled={areFieldsReadOnly}
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

          <Box sx={{ display: "flex", gap: 2, flexDirection: "row" }}>
            {!isBinderStatusDone && (
              <ThemeButton
                sx={{
                  background: areFieldsReadOnly || !selectedBinderStaff ? "#ccc" : "#12B76A",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 2,
                  py: 1.2,
                  width: "100%",
                  "&:hover": {
                    background: areFieldsReadOnly || !selectedBinderStaff ? "#ccc" : "#079455",
                  },
                }}
                onClick={() => formik.handleSubmit()}
                disabled={areFieldsReadOnly || loading || !selectedBinderStaff}
              >
                {loading || formik.isSubmitting ? "Assigning..." : "Assign to Binder →"}
              </ThemeButton>
            )}
            <ThemeButton
              sx={{
                background: isHeld ? "#6366F1" : "#F04438",
                color: "#fff",
                fontWeight: 600,
                fontSize: 18,
                borderRadius: 2,
                py: 1.2,
                width: "100%",
                "&:hover": { background: isHeld ? "#4F46E5" : "#D92D20" },
              }}
              onClick={handleHoldToggle}
              disabled={loading}
            >
              {loading ? "Processing..." : isHeld ? "Unhold" : "Hold"}
            </ThemeButton>
          </Box>



          {isBinderStatusDone && (
            <Box mt={4}>
              <Stack direction='row' mb={2} gap={2}>
                <Typography fontWeight={600} color="#12B76A">
                  ✅ Binder Work Done
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Download />}
                  onClick={handleDownload}
                >
                  Download PDF
                </Button>
              </Stack>
              <Typography fontWeight={600} mb={2}>
                Send for Next Step Approval via
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={4}>
                <Box
                  onClick={() => handleEmailClick('binder')}
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
                  sx={{
                    background: isHeld ? "#ccc" : "#6366F1",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 2,
                    py: 1.2,
                    width: "100%",
                    "&:hover": { background: isHeld ? "#ccc" : "#4F46E5" },
                  }}
                  onClick={handleAssignToBookletFolder}
                  disabled={isHeld || loading}
                >
                  Assign to Booklet & Folder Binder
                </ThemeButton>
                <ThemeButton
                  sx={{
                    background: isHeld ? "#ccc" : "#12B76A",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 2,
                    py: 1.2,
                    width: "100%",
                    "&:hover": { background: isHeld ? "#ccc" : "#079455" },
                  }}
                  onClick={handleProceedToDelivery}
                  disabled={isHeld || loading}
                >
                  Proceed to Delivery
                </ThemeButton>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
      <ViewFilesDialog
        open={openDesignFilesDialog}
        onClose={() => setOpenDesignFilesDialog(false)}
        files={singleOrder?.approvedFiles?.map((file: any) => file) || []}
        title="Designer Files"
        showDownload={true}
        showView={true}
      />

      {/* Binder Rate Dialog */}
      <BinderRateDialog
        open={rateDialogOpen}
        onClose={() => setRateDialogOpen(false)}
        binderId={selectedBinderStaff?.value}
        binderName={selectedBinderStaff?.label}
      />
    </>
  )
}

export default BinderForm
"use client"
import { useRef, useEffect, useState } from "react"
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  IconButton
} from "@mui/material"
import { MdEmail } from "react-icons/md"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeButton from "@/component/common_component/themebutton"
import StepperProgress from "@/component/common_component/stepperprogress"
import { useRouter } from "next/router"
import { useAppDispatch, useAppSelector } from "@/store"
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice"
import { toast } from "react-toastify"
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect"
import FileUpload from "@/component/reusablecomponents/FileUpload"
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog"
import { useFormik } from "formik"
import * as Yup from "yup"
import { AiOutlineEye } from "react-icons/ai"
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ThemeCheckbox from "@/component/common_component/themecheckbox"
import { Download } from "@mui/icons-material"
import { downloadBookletPDF } from "@/utills/utills"
import moment from "moment"
import { getAllMaterialsThunk } from "@/store/slices/materialSlice"
import ThemeSelect from "@/component/common_component/themeselect"
import { getAllInventoryThunk } from "@/store/slices/inventorySlice"

type OptionType = {
  label: string
  value: string | number
}

type PaperField = {
  paperName: string
  numberOfSheetsUsed: string
  sheetSize: string
  paperType: string
  gsm: string
  ratePerUnit: string
}

const BookletFolderBinderForm = () => {
  const router = useRouter()
  const { id: orderId } = router.query
  const dispatch = useAppDispatch()
  const { singleOrder } = useAppSelector((state) => state.orders)
  const fileUploadRef = useRef<any>(null)
  const { materials } = useAppSelector(state => state.materials);
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [selectedBookletBinder, setSelectedBookletBinder] = useState<OptionType | null>(null)
  const [openBookletFilesDialog, setOpenBookletFilesDialog] = useState(false)
  const [uploadedBookletFiles, setUploadedBookletFiles] = useState<any[]>([])
  const [openDesignFilesDialog, setOpenDesignFilesDialog] = useState(false)
  const [openBinderFilesDialog, setOpenBinderFilesDialog] = useState(false)
  const [bookletPapers, setBookletPapers] = useState<PaperField[]>([])
  const { allInventory } = useAppSelector(state => state.inventory);
  const formik = useFormik({
    initialValues: {
      issuedDate: new Date().toISOString()?.split("T")[0],
      receivedDate: "",
      remarks: "",
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
      bookletPapers: [],
    },
    validationSchema: Yup.object({
      issuedDate: Yup.string().required("Issued Date is required"),
      receivedDate: Yup.string()
        .test("is-greater-or-equal", "Received Date must be on or after Issued Date", function (value) {
          const { issuedDate } = this.parent
          if (!issuedDate || !value) return true
          return new Date(value) >= new Date(issuedDate)
        }),
      remarks: Yup.string().required("Remarks are required"),
      size: Yup.string().required("Size is required"),
      qty: Yup.number()
        .typeError("Must be a number")
        .required("Quantity is required")
        .min(1, "Must be at least 1"),
      isLamination: Yup.string().required("Lamination selection is required"),
      laminationType: Yup.string().when("isLamination", (isLamination, schema) => {
        return isLamination === "Yes"
          ? schema.required("Lamination type is required when lamination is selected")
          : schema.nullable()
      }),
      uv: Yup.string().required("UV selection is required"),
      bookletPapers: Yup.array()
        .of(
          Yup.object({
            paperName: Yup.string().required("Paper Name is required"),
            numberOfSheetsUsed: Yup.string().required("Number of Sheets Used is required"),
            sheetSize: Yup.string().required("Sheet Size is required"),
            paperType: Yup.string().required("Paper Type is required"),
            gsm: Yup.string().required("GSM is required"),
            ratePerUnit: Yup.string().required("Rate / Unit is required"),
          })
        )
        .min(1, "At least one booklet paper is required"),
    }),
    onSubmit: async (values) => {
      if (!orderId || typeof orderId !== "string") {
        toast.error("Order ID not found")
        return
      }

      if (singleOrder?.status === "Hold") {
        toast.error("Order is on hold. Please unhold to assign to booklet binder.")
        return
      }

      if (!selectedBookletBinder) {
        toast.error("Please select a booklet binder to assign.")
        return
      }

      setLoading(true)
      try {
        let newBookletFiles: any[] = []
        if (fileUploadRef.current) {
          const selectedFiles = fileUploadRef.current.getSelectedFiles()
          if (selectedFiles.length > 0) {
            newBookletFiles = selectedFiles.map((file: File) => ({
              path: `booklet-files/${file.name}`,
              remark: values.remarks,
              uploadedAt: new Date().toISOString(),
            }))
          }
        }

        const allBookletFiles = [...(singleOrder?.bookletBinderFiles || []), ...newBookletFiles.filter((f) => !f.isNew)]

        const updateData = {
          bookletBinder: selectedBookletBinder.value,
          bookletBinderStatus: "Pending",
          status: "Booklet & Folder Binder",
          issuedDate: values.issuedDate,
          receivedDate: values.receivedDate,
          bookletBinderRemarks: values.remarks,
          size: values.size,
          qty: Number(values.qty),
          isLamination: values.isLamination === "Yes",
          laminationType: values.isLamination === "Yes" ? values.laminationType : "",
          uv: values.uv,
          numberOfSheetUsed: values.numberOfSheetUsed,
          sheetSize: values.sheetSize,
          paperType: values.paperType,
          gsm: values.gsm,
          ratePerUnit: values.ratePerUnit,
          isPasting: values.isPasting,
          isCutting: values.isCutting,
          isCreasing: values.isCreasing,
          isFoil: values.isFoil,
          isPunching: values.isPunching,
          bookletBinderFiles: allBookletFiles,
          bookletPapers: bookletPapers,
        }

        await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap()
        toast.success("Order assigned to Booklet Binder successfully!")
        await dispatch(getOrderByIdThunk(orderId)).unwrap()
      } catch (error: any) {
        console.error("Error assigning to booklet binder:", error)
        toast.error(error?.message || "Failed to assign to booklet binder")
      } finally {
        setLoading(false)
      }
    },
  })

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

  useEffect(() => {
    if (!materials.length) dispatch(getAllMaterialsThunk());
    if (!allInventory.length) dispatch(getAllInventoryThunk())
  }, [])


  useEffect(() => {
    if (singleOrder) {
      formik.setValues({
        issuedDate: singleOrder.issuedDate
          ? new Date(singleOrder.issuedDate).toISOString()?.split("T")[0]
          : new Date().toISOString()?.split("T")[0],
        receivedDate: singleOrder.receivedDate ? new Date(singleOrder.receivedDate).toISOString()?.split("T")[0] : "",
        remarks: singleOrder.bookletBinderRemarks || singleOrder.remarks || "",
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
        bookletPapers: singleOrder.bookletPapers || [],
      })

      if (singleOrder.bookletBinder && singleOrder.bookletBinder._id) {
        setSelectedBookletBinder({
          value: singleOrder.bookletBinder._id,
          label: singleOrder.bookletBinder.name || `Booklet Binder ${singleOrder.bookletBinder._id}`,
        })
      } else {
        setSelectedBookletBinder(null)
      }

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

      setUploadedBookletFiles(singleOrder.bookletBinderFiles || [])
    }
  }, [singleOrder])

  const handleBookletBinderChange = (event: any, newValue: OptionType | null) => {
    setSelectedBookletBinder(newValue)
  }

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
      lamination: singleOrder.isLamination ? "Yes" : "No",
      haste: "",
      gst: "",
      partyName: singleOrder?.party?.partyName || "",
      address: "",
    };

    downloadBookletPDF(data, materials, allInventory);
  };

  const handleHoldToggle = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found")
      return
    }

    setLoading(true)
    try {
      const newStatus = singleOrder?.status === "Hold" ? "Booklet & Folder Binder" : "Hold"

      const updateData: any = { status: newStatus }
      if (newStatus !== "Hold" && singleOrder?.bookletBinderStatus === "Hold") {
        updateData.bookletBinderStatus = "Pending"
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

  const handleProceedToDelivery = () => {
    router.push(`/admin/all-orders/view/dilevery/?id=${orderId}`)
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
    formik.setFieldValue('bookletPapers', updatedPapers)
  }

  const handleDeleteBookletPaper = (index: number) => {
    if (bookletPapers.length === 1) {
      toast.error("At least one paper field is required")
      return
    }
    const updatedPapers = bookletPapers.filter((_, i) => i !== index)
    setBookletPapers(updatedPapers)
    formik.setFieldValue('bookletPapers', updatedPapers)
  }

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
    const updatedPapers = [...bookletPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      paperType: id, // store _id
      gsm: "",       // reset gsm
      sheetSize: "", // reset size
    };
    setBookletPapers(updatedPapers);
  };

  // Handle GSM selection
  const handleMaterialGSMChange = (index: number, id: string) => {
    const updatedPapers = [...bookletPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      gsm: id,       // store _id
      sheetSize: "", // reset size
    };
    setBookletPapers(updatedPapers);
  };

  // Handle size selection
  const handleMaterialSizeChange = (index: number, id: string) => {
    const updatedPapers = [...bookletPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      sheetSize: id, // store _id
    };
    setBookletPapers(updatedPapers);
  };

  // Email functionality implementation
  const handleEmailClick = (type: 'booklet' = 'booklet') => {
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
    const subject = `Order ${orderNumber} - Booklet Binder Work Completed`;
   
    // Dynamic body with all details
    const body = `Dear ${contactPerson},

Booklet binder work for the following order has been completed. Please review the details and proceed to the next step (Delivery).

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

  const isHeld = singleOrder?.status === "Hold";
  const isBookletBinderAssigned = !!singleOrder?.bookletBinder;
  const isBookletBinderStatusPending = singleOrder?.bookletBinderStatus === "Pending";
  const isBookletBinderStatusInProgress = singleOrder?.bookletBinderStatus === "In Progress";
  const isBookletBinderStatusDone = singleOrder?.bookletBinderStatus === "Done";
  const isPrinterStatusDone = singleOrder?.printerStatus === "Done";
  const isBinderStatusDone = singleOrder?.binderStatus === "Done" || singleOrder?.binderStatus === "Pending"; // Allow skipped binder
  const areFieldsReadOnly = isHeld || isBookletBinderStatusInProgress || isBookletBinderStatusDone;

  return (
    <>
      <Box className="p-4 border rounded-md">
        <Typography fontWeight={600} fontSize={18} mb={2}>
          {singleOrder.party?.partyName || "Party Name"}
        </Typography>

        <StepperProgress
          activeStep={4}
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
            Booklet Folder Binding
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

          {isBookletBinderStatusDone && (
            <Box mb={3} sx={{ p: 2, bgcolor: "#E8F5E8", borderRadius: 2, border: "1px solid #4CAF50" }}>
              <Typography fontWeight={500} fontSize={14} mb={1} color="#4CAF50">
                ✅ Booklet Binder Work Completed
              </Typography>
              <Typography fontSize={13} color="#666">
                This booklet binder task has been marked as done.
              </Typography>
            </Box>
          )}

          <Stack spacing={2} mb={2}>
            {/* Basic Details */}
            <Stack direction="row" spacing={2}>
              <ThemeInput
                labelName="Company Name"
                value={singleOrder.companyName?.companyName || "N/A"}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <ThemeInput
                labelName="Party Name"
                value={singleOrder.party?.partyName || "N/A"}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <ThemeInput
                labelName="Order Number"
                value={singleOrder.orderNumber || "N/A"}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <RoleStaffSelect
                label="Assign to Booklet Binder"
                name="bookletBinderStaff"
                value={selectedBookletBinder}
                onChange={handleBookletBinderChange}
                onStaffChange={handleBookletBinderChange}
                roleFilter="Booklet & Folder Binder"
                showStaff={true}
                disabled={areFieldsReadOnly || isBookletBinderAssigned}
                fullWidth
              />
            </Stack>





            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <ThemeInput
                labelName="Item Name"
                value={singleOrder.productItem?.itemName || "N/A"}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <ThemeInput
                labelName="Issued Date"
                type="date"
                name="issuedDate"
                value={formik.values.issuedDate}
                onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={formik.touched.issuedDate && Boolean(formik.errors.issuedDate)}
                helperText={formik.touched.issuedDate && formik.errors.issuedDate}
                InputProps={{ readOnly: areFieldsReadOnly }}
              />
              <ThemeInput
                labelName="Received Date"
                type="date"
                name="receivedDate"
                value={formik.values.receivedDate}
                onChange={formik.handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={formik.touched.receivedDate && Boolean(formik.errors.receivedDate)}
                helperText={formik.touched.receivedDate && formik.errors.receivedDate}
                InputProps={{ readOnly: areFieldsReadOnly }}
              />
              <ThemeInput
                labelName="Size"
                name="size"
                value={formik.values.size}
                onChange={formik.handleChange}
                fullWidth
                error={formik.touched.size && Boolean(formik.errors.size)}
                helperText={formik.touched.size && formik.errors.size}
                InputProps={{ readOnly: areFieldsReadOnly }}
              />
            </Stack>
            <Box>
              <Grid container spacing={2} alignItems="center">
                {/* Quantity */}
                <Grid item xs={12} sm={3}>
                  <ThemeInput
                    labelName="Quantity"
                    name="qty"
                    value={formik.values.qty}
                    onChange={formik.handleChange}
                    fullWidth
                    error={formik.touched.qty && Boolean(formik.errors.qty)}
                    helperText={formik.touched.qty && formik.errors.qty}
                    InputProps={{ readOnly: areFieldsReadOnly }}
                  />

                </Grid>


                {/* Lamination */}
                <Grid item xs={12} sm={3}>
                  <FormControl component="fieldset" disabled={areFieldsReadOnly}>
                    <FormLabel component="legend">Lamination</FormLabel>
                    <RadioGroup
                      row
                      name="isLamination"
                      value={formik.values.isLamination}
                      onChange={(e) => {
                        formik.handleChange(e)
                        if (e.target.value === "No") {
                          formik.setFieldValue("laminationType", "")
                        }
                      }}
                    >
                      <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                      <FormControlLabel value="No" control={<Radio />} label="No" />
                    </RadioGroup>
                    {formik.touched.isLamination && formik.errors.isLamination && (
                      <Typography color="error" variant="caption">
                        {formik.errors.isLamination}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                {/* Lamination Type → Only show when Lamination = Yes */}
                {formik.values.isLamination === "Yes" && (
                  <Grid item xs={12} sm={3}>
                    <FormControl component="fieldset" disabled={areFieldsReadOnly}>
                      <FormLabel component="legend">Lamination Type</FormLabel>
                      <RadioGroup
                        row
                        name="laminationType"
                        value={formik.values.laminationType}
                        onChange={formik.handleChange}
                      >
                        <FormControlLabel value="Matte" control={<Radio />} label="Matte" />
                        <FormControlLabel value="Gloss" control={<Radio />} label="Gloss" />
                      </RadioGroup>
                      {formik.touched.laminationType && formik.errors.laminationType && (
                        <Typography color="error" variant="caption">
                          {formik.errors.laminationType}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                )}

                {/* UV */}
                <Grid item xs={12} sm={3}>
                  <FormControl component="fieldset" disabled={areFieldsReadOnly}>
                    <FormLabel component="legend">UV</FormLabel>
                    <RadioGroup
                      row
                      name="uv"
                      value={formik.values.uv}
                      onChange={formik.handleChange}
                    >
                      <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                      <FormControlLabel value="No" control={<Radio />} label="No" />
                    </RadioGroup>
                    {formik.touched.uv && formik.errors.uv && (
                      <Typography color="error" variant="caption">
                        {formik.errors.uv}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
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

            {/* Booklet Papers */}
            <Box mb={3}>
              <Typography fontWeight={600} mb={2}>
                Booklet Papers
              </Typography>
              {bookletPapers.map((paper, index) => (
                <Box key={`booklet-${index}`} mb={2} p={2} border={1} borderRadius={2} borderColor="#ddd">
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography fontWeight={600}>{paper.paperName}</Typography>
                    {!areFieldsReadOnly && (
                      <IconButton
                        onClick={() => handleDeleteBookletPaper(index)}
                        disabled={bookletPapers.length === 1}
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
                      onChange={(e) => handleBookletPaperChange(index, 'numberOfSheetsUsed', e.target.value)}
                      fullWidth
                      InputProps={{ readOnly: areFieldsReadOnly }}
                    />
                    <ThemeSelect
                      label="Paper Type"
                      options={materialNameOptions}
                      value={materialNameOptions.find(opt => opt.value === paper.paperType) || null}
                      onChange={(e, newValue) =>
                        handleMaterialNameChange(index, newValue?.value as string || "")
                      }
                      required
                      disabled={areFieldsReadOnly}
                    />

                    <ThemeSelect
                      label="GSM"
                      options={getMaterialGSMOptions(paper.paperType)}
                      value={getMaterialGSMOptions(paper.paperType).find(opt => opt.value === paper.gsm) || null}
                      onChange={(e, newValue) =>
                        handleMaterialGSMChange(index, newValue?.value as string || "")
                      }
                      required
                      disabled={!paper.paperType || areFieldsReadOnly}
                    />

                    <ThemeSelect
                      label="Size"
                      options={getMaterialSizeOptions(paper.paperType, paper.gsm)}
                      value={getMaterialSizeOptions(paper.paperType, paper.gsm).find(opt => opt.value === paper.sheetSize) || null}
                      onChange={(e, newValue) =>
                        handleMaterialSizeChange(index, newValue?.value as string || "")
                      }
                      required
                      disabled={!paper.paperType || !paper.gsm || areFieldsReadOnly}
                    />
                    <ThemeInput
                      labelName="Rate / Unit"
                      value={paper.ratePerUnit}
                      onChange={(e) => handleBookletPaperChange(index, 'ratePerUnit', e.target.value)}
                      fullWidth
                      InputProps={{ readOnly: areFieldsReadOnly }}
                    />
                  </Stack>
                </Box>
              ))}
              {!areFieldsReadOnly && (
                <Box display="flex" justifyContent="flex-end">
                  <ThemeButton
                    onClick={handleAddBookletPaper}
                    disabled={areFieldsReadOnly}
                    startIcon={<AddIcon />}
                    sx={{
                      backgroundColor: "#6366F1",
                      borderRadius: "8px",
                      color: "#fff",
                      "&:hover": { backgroundColor: "#4F46E5" }, // Hover effect
                    }}
                  >
                    Add Booklet Paper
                  </ThemeButton>
                </Box>
              )}
            </Box>



            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              {/*  <ThemeInput
              labelName="Number of Sheets Used"
              name="numberOfSheetUsed"
              value={formik.values.numberOfSheetUsed}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.numberOfSheetUsed && Boolean(formik.errors.numberOfSheetUsed)}
              helperText={formik.touched.numberOfSheetUsed && formik.errors.numberOfSheetUsed}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Sheet Size"
              name="sheetSize"
              value={formik.values.sheetSize}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.sheetSize && Boolean(formik.errors.sheetSize)}
              helperText={formik.touched.sheetSize && formik.errors.sheetSize}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Paper Type"
              name="paperType"
              value={formik.values.paperType}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.paperType && Boolean(formik.errors.paperType)}
              helperText={formik.touched.paperType && formik.errors.paperType}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="GSM"
              name="gsm"
              value={formik.values.gsm}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.gsm && Boolean(formik.errors.gsm)}
              helperText={formik.touched.gsm && formik.errors.gsm}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Rate / Unit"
              name="ratePerUnit"
              value={formik.values.ratePerUnit}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.ratePerUnit && Boolean(formik.errors.ratePerUnit)}
              helperText={formik.touched.ratePerUnit && formik.errors.ratePerUnit}
              InputProps={{ readOnly: areFieldsReadOnly }}
            /> */}
              {(isBookletBinderStatusDone || isBookletBinderStatusInProgress) && (
                <ThemeInput
                  labelName="Booklet Binder Wasted Sheet"
                  value={singleOrder?.bookletBinderWastedSheet?.toString() || "0"}
                  type="number"
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              )}
            </Stack>

            <Stack direction="row" spacing={2} justifyContent="space-between" flexWrap="wrap">
              <ThemeCheckbox
                label="Pasting"
                name="isPasting"
                checked={formik.values.isPasting}
                onChange={formik.handleChange}
                size="small"
                disabled={areFieldsReadOnly}
              />
              <ThemeCheckbox
                label="Cutting"
                name="isCutting"
                checked={formik.values.isCutting}
                onChange={formik.handleChange}
                size="small"
                disabled={areFieldsReadOnly}
              />
              <ThemeCheckbox
                label="Creasing"
                name="isCreasing"
                checked={formik.values.isCreasing}
                onChange={formik.handleChange}
                size="small"
                disabled={areFieldsReadOnly}
              />
              <ThemeCheckbox
                label="Foil"
                name="isFoil"
                checked={formik.values.isFoil}
                onChange={formik.handleChange}
                size="small"
                disabled={areFieldsReadOnly}
              />
              <ThemeCheckbox
                label="Punching"
                name="isPunching"
                checked={formik.values.isPunching}
                onChange={formik.handleChange}
                size="small"
                disabled={areFieldsReadOnly}
              />
            </Stack>
            <ThemeInput
              labelName="Remarks"
              placeholder="Enter remarks here"
              fullWidth
              multiline
              rows={3}
              name="remarks"
              value={formik.values.remarks}
              onChange={formik.handleChange}
              error={formik.touched.remarks && Boolean(formik.errors.remarks)}
              helperText={formik.touched.remarks && formik.errors.remarks}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />

            <Box mb={2}>
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
                helperText="Upload any relevant files related to the booklet binding process"
                disabled={areFieldsReadOnly}
              />
            </Box>

            <Button
              variant="outlined"
              fullWidth
              onClick={handleViewDesignFiles}
              sx={{
                color: "#344054",
                borderColor: "#D0D5DD",
                fontWeight: 600,
                fontSize: 16,
                py: 1.2,
                background: "#fff",
                "&:hover": { background: "#f6fef9" },
              }}
              startIcon={<AiOutlineEye />}
            >
              View Designer Files ({singleOrder?.approvedFiles?.length || 0})
            </Button>

            <Button
              variant="outlined"
              fullWidth
              onClick={handleViewBinderFiles}
              sx={{
                color: "#344054",
                borderColor: "#D0D5DD",
                fontWeight: 600,
                fontSize: 16,
                py: 1.2,
                background: "#fff",
                "&:hover": { background: "#f6fef9" },
              }}
              startIcon={<AiOutlineEye />}
            >
              View Binder Files ({singleOrder?.binderFiles?.length || 0})
            </Button>


            <Box sx={{ display: "flex", gap: 2, flexDirection: "row" }}>
              {/* {isBookletBinderStatusPending && ( */}
              <ThemeButton
                sx={{
                  background: areFieldsReadOnly || !selectedBookletBinder ? "#ccc" : "#12B76A",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 18,
                  borderRadius: 2,
                  py: 1.2,
                  width: "100%",
                  "&:hover": {
                    background: areFieldsReadOnly || !selectedBookletBinder ? "#ccc" : "#079455",
                  },
                }}
                onClick={() => formik.handleSubmit()}
                disabled={areFieldsReadOnly || loading || !selectedBookletBinder}
              >
                {loading || formik.isSubmitting ? "Assigning..." : "Assign to Booklet Binder →"}
              </ThemeButton>
              {/* )} */}

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

            {isBookletBinderStatusDone && singleOrder?.bookletBinderFiles && singleOrder.bookletBinderFiles.length > 0 && (
              <Box mt={3}>
                <Typography fontWeight={600} mb={1}>
                  Booklet Binder Uploaded Files
                </Typography>
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
                    "&:hover": { background: "#f6fef9" },
                  }}
                  startIcon={<AiOutlineEye />}
                >
                  View All Booklet Uploaded Files ({singleOrder.bookletBinderFiles.length})
                </Button>
              </Box>
            )}

            {isBookletBinderStatusDone && (
              <Box mt={4}>
                <Stack direction='row' mb={2} gap={2}>
                  <Typography fontWeight={600} color="#12B76A">
                    ✅ Booklet Binder Work Done
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
                    onClick={() => handleEmailClick('booklet')}
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
              </Box>
            )}
          </Stack>
        </Paper>
      </Box>

      <ViewFilesDialog
        open={openBookletFilesDialog}
        onClose={handleCloseBookletFilesDialog}
        files={uploadedBookletFiles.map((file: any) => file.path) || []}
        title="Booklet Binder Files"
        showDownload={true}
        showView={true}
      />

      <ViewFilesDialog
        open={openDesignFilesDialog}
        onClose={handleCloseDesignFilesDialog}
        files={singleOrder?.approvedFiles?.map((file: any) => file) || []}
        title="Designer Files"
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
    </>
  )
}

export default BookletFolderBinderForm

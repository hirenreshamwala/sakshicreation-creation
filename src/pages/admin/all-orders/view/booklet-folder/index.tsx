"use client"
import { useEffect, useState } from "react"
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
import { useFormik } from "formik"
import * as Yup from "yup"
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ThemeCheckbox from "@/component/common_component/themecheckbox"
import { Download } from "@mui/icons-material"
import { downloadBookletPDF } from "@/utills/utills"
import moment from "moment"
import { getAllMaterialsThunk } from "@/store/slices/materialSlice"
import ThemeSelect from "@/component/common_component/themeselect"
import { getAllInventoryThunk } from "@/store/slices/inventorySlice"
import { orderService } from "@/services/order.service"

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
  materialName?: string
}

const BookletFolderBinderForm = () => {
  const router = useRouter()
  const { id: orderId } = router.query
  const dispatch = useAppDispatch()
  const { singleOrder }: any = useAppSelector((state) => state.orders)
  const { materials } = useAppSelector(state => state.materials);
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [selectedBookletBinder, setSelectedBookletBinder] = useState<OptionType | null>(null)
  const [bookletPapers, setBookletPapers] = useState<PaperField[]>([])
  const { allInventory } = useAppSelector(state => state.inventory);

  const formik: any = useFormik({
    initialValues: {
      issuedDate: new Date().toISOString()?.split("T")[0],
      receivedDate: "",
      // remarks: "",
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
      bookletBinderRemarks: "",
      punchingType: "",
    },
    validationSchema: Yup.object({
      issuedDate: Yup.string().required("Issued Date is required"),
      receivedDate: Yup.string()
        .test("is-greater-or-equal", "Received Date must be on or after Issued Date", function (value) {
          const { issuedDate } = this.parent
          if (!issuedDate || !value) return true
          return new Date(value) >= new Date(issuedDate)
        }),
      bookletBinderRemarks: Yup.string().required("Remarks are required"),
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
      punchingType: Yup.string()
        .when('isPunching', {
          is: true,
          then: (schema) => schema.required("Punching type is required when punching is selected"),
          otherwise: (schema) => schema.notRequired(),
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
        const updateData = {
          bookletBinder: selectedBookletBinder.value,
          bookletBinderStatus: "Pending",
          status: "Booklet & Folder Binder",
          issuedDate: values.issuedDate,
          receivedDate: values.receivedDate,
          bookletBinderRemarks: values.bookletBinderRemarks,
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
          bookletPapers: bookletPapers,
          punchingType: values.isPunching ? values.punchingType : "",
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
          await orderService.markNotificationRead(orderId, "bookletBinder")
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
        bookletBinderRemarks: singleOrder.bookletBinderRemarks || singleOrder.remarks || "",
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
        punchingType: singleOrder.punchingType || "",
        bookletPapers: singleOrder.bookletPapers || [],
        // bookletBinderRemarks: singleOrder.bookletBinderRemarks || "",
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
        const normalizedBookletPapers = singleOrder.bookletPapers.map((paper: any) => {
          const selectedMaterial = materials?.find((m: any) => m._id === paper.paperType)
          return {
            ...paper,
            materialName: paper.materialName || selectedMaterial?.materialName || paper.paperType || "",
          }
        })
        setBookletPapers(normalizedBookletPapers)
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
    }
  }, [singleOrder, materials])

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

  const handleProceedToDelivery = () => router.push(`/admin/all-orders/view/dilevery/?id=${orderId}`)

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

  const materialNameOptions = materials
    .filter((material, index, self) =>
      index === self.findIndex(m => m.materialName === material.materialName)
    )
    .map(material => ({
      value: material._id, // Use _id as value
      label: material.materialName,
    }));

  const getMaterialOptionByValueOrLabel = (valueOrLabel?: string | null) => {
    if (!valueOrLabel) return null;
    return (
      materialNameOptions.find(opt => opt.value === valueOrLabel) ||
      materialNameOptions.find(opt => opt.label === valueOrLabel) ||
      null
    );
  };

  const getPaperTypeGroupKey = (paper: any) => {
    if (paper.materialName) return paper.materialName;
    if (paper.paperType) return paper.paperType;
    return "unspecified";
  };

  // // Get GSM options for a specific material (_id)
  // const getMaterialGSMOptions = (materialId: string) => {
  //   const filteredMaterials = materials.filter(m => m._id === materialId);
  //   return Array.from(
  //     new Set(filteredMaterials.map(m => m.materialGSM.toString()))
  //   ).map(gsm => {
  //     const gsmMaterial = filteredMaterials.find(m => m.materialGSM.toString() === gsm);
  //     return {
  //       value: gsmMaterial?._id, // Use _id for GSM too
  //       label: `${gsm} GSM`,
  //     };
  //   });
  // };

  // // Get size options for a specific material + GSM
  // const getMaterialSizeOptions = (materialId: string, materialGSM: string) => {
  //   const filteredMaterials = materials.filter(
  //     m => m._id === materialGSM
  //   );
  //   return filteredMaterials.map(m => ({
  //     value: m._id, // Each size option tied to material _id
  //     label: m.materialSize,
  //   }));
  // };

  const getMaterialGSMOptions = (materialId: string) => {
    const selectedMaterial = materials?.find(m => m?._id === materialId);
    if (!selectedMaterial) return [];

    const filtered = materials?.filter(m => m?.materialName === selectedMaterial.materialName);
    const uniqueGSMs = filtered?.filter((m, index, self) => 
      index === self.findIndex(item => item.materialGSM === m.materialGSM)
    );
    return uniqueGSMs?.map(m => ({
      value: m?._id,
      label: `${m?.materialGSM} GSM`
    }));
  };

  const getMaterialSizeOptions = (materialId: string, gsmId: string) => {
    const selectedMaterial = materials?.find(m => m?._id === materialId);
    const selectedGSM = materials?.find(m => m?._id === gsmId);
    if (!selectedMaterial || !selectedGSM) return [];

    const filtered = materials?.filter(m => 
      m?.materialName === selectedMaterial.materialName && 
      m?.materialGSM === selectedGSM.materialGSM
    );

    const uniqueSizes = filtered?.filter((m, index, self) => 
      index === self.findIndex(item => 
        item.materialSize?.trim().toUpperCase() === m.materialSize?.trim().toUpperCase()
      )
    );

    return uniqueSizes?.map(size => ({
      value: size?._id,
      label: size?.materialSize
    }));
  };

  // Handle material name selection
  const handleMaterialNameChange = (index: number, id: string) => {
    const selectedOption = getMaterialOptionByValueOrLabel(id);
    const updatedPapers = [...bookletPapers];
    updatedPapers[index] = {
      ...updatedPapers[index],
      materialName: selectedOption?.label || id,
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
                labelName="Order Number"
                value={singleOrder.orderNumber || "N/A"}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <ThemeInput
                labelName="Job Name"
                value={singleOrder.jobName || "N/A"}
                fullWidth
                InputProps={{ readOnly: true }}
              />
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
                labelName="Whatsapp Number"
                value={singleOrder.party?.ownerWhatsAppNo || "N/A"}
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
                labelName="Booklet Folder Type"
                value={singleOrder.bookletFolderType || "N/A"}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <ThemeInput
                labelName="Size"
                name="size"
                value={formik.values.size}
                onChange={formik.handleChange}
                fullWidth
                error={formik.touched.size && Boolean(formik.errors.size)}
                helperText={formik.touched.size && formik.errors.size}
                InputProps={{ readOnly: true }}
              />
              <ThemeInput
                labelName="Quantity"
                name="qty"
                value={formik.values.qty}
                onChange={formik.handleChange}
                fullWidth
                // disabled
                error={formik.touched.qty && Boolean(formik.errors.qty)}
                helperText={formik.touched.qty && formik.errors.qty}
                InputProps={{ readOnly: true }}
              />
            </Stack>
            <ThemeInput
              labelName="Remarks"
              placeholder="Enter remarks here"
              fullWidth
              multiline
              rows={3}
              name="bookletBinderRemarks" // ✅ name change करें
              value={formik.values.bookletBinderRemarks} // ✅ value change करें
              onChange={formik.handleChange}
              error={formik.touched.bookletBinderRemarks && Boolean(formik.errors.bookletBinderRemarks)} // ✅ error change करें
              helperText={formik.touched.bookletBinderRemarks && formik.errors.bookletBinderRemarks} // ✅ helperText change करें
            />
            <Box>
              <Grid container spacing={2} alignItems="center">
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

            {/* Booklet Papers */}
            <Box mb={3}>
              <Typography fontWeight={600} mb={2}>
                Booklet Papers
              </Typography>
              {/* Booklet Papers Section with Grouping */}
              {(() => {
                const grouped = bookletPapers.reduce((acc: any, paper: any, index: number) => {
                  const type = getPaperTypeGroupKey(paper);
                  if (!acc[type]) acc[type] = [];
                  acc[type].push({ ...paper, originalIndex: index });
                  return acc;
                }, {});

                return Object.entries(grouped).map(([paperType, fields]: [string, any], groupIndex) => (
                  <Box key={groupIndex} mb={3} p={2} border={1} borderRadius={2} borderColor="#ddd">
                  

                    {fields.map((paper: any, fieldIndex: number) => (
                      <Box key={fieldIndex} sx={{ position: 'relative', mb: fieldIndex < fields.length - 1 ? 2 : 0 }}>
                        <Stack direction="row" spacing={2} >
                      <ThemeSelect
                        label="Paper Type"
                        options={materialNameOptions}
                        value={getMaterialOptionByValueOrLabel(paperType === "unspecified" ? "" : paperType)}
                        onChange={(e, newValue) => {
                          fields.forEach((f: any) => handleMaterialNameChange(f.originalIndex, newValue?.value as string || ""));
                        }}
                        required
                        disabled={areFieldsReadOnly}
                        // sx={{ width: { xs: '100%', sm: '40%' } }}
                      />                          <ThemeSelect
                            label="GSM"
                            options={getMaterialGSMOptions(paper.paperType)}
                            value={getMaterialGSMOptions(paper.paperType).find(opt => opt.value === paper.gsm) || null}
                            onChange={(e, newValue) =>
                              handleMaterialGSMChange(paper.originalIndex, newValue?.value as string || "")
                            }
                            required
                            disabled={!paper.paperType || areFieldsReadOnly}
                          />

                          <ThemeSelect
                            label="Size"
                            options={getMaterialSizeOptions(paper.paperType, paper.gsm)}
                            value={getMaterialSizeOptions(paper.paperType, paper.gsm).find(opt => opt.value === paper.sheetSize) || null}
                            onChange={(e, newValue) =>
                              handleMaterialSizeChange(paper.originalIndex, newValue?.value as string || "")
                            }
                            required
                            disabled={!paper.paperType || !paper.gsm || areFieldsReadOnly}
                          />

                          <ThemeInput
                            labelName="Number of Sheets Used"
                            value={paper.numberOfSheetsUsed}
                            onChange={(e) => handleBookletPaperChange(paper.originalIndex, 'numberOfSheetsUsed', e.target.value)}
                            fullWidth
                            InputProps={{ readOnly: areFieldsReadOnly }}
                          />
                          {!areFieldsReadOnly && (
                            <IconButton
                              onClick={() => handleDeleteBookletPaper(paper.originalIndex)}
                              disabled={bookletPapers.length === 1}
                              sx={{
                                color: '#F04438',
                                '&:hover': { backgroundColor: '#FEE2E2' },
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                ));
              })()}
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
              {formik.values.isPunching && (
                <Box sx={{ mt: 2 }}>
                  <ThemeInput
                    labelName="Punching Type"
                    placeholder="Enter punching type (e.g., Round, Square, Slot, etc.)"
                    name="punchingType"
                    value={formik.values.punchingType}
                    onChange={formik.handleChange}
                    fullWidth
                    error={formik.touched.punchingType && Boolean(formik.errors.punchingType)}
                    helperText={formik.touched.punchingType && formik.errors.punchingType}
                    InputProps={{ readOnly: areFieldsReadOnly }}
                  />
                </Box>
              )}
            </Stack>
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
    </>
  )
}

export default BookletFolderBinderForm

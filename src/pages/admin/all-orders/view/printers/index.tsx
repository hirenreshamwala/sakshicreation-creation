"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { MdEmail } from "react-icons/md";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeButton from "@/component/common_component/themebutton";
import StepperProgress from "@/component/common_component/stepperprogress";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useAppDispatch, useAppSelector } from "@/store";
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice";
import { getAllBinderTypesThunk } from "@/store/slices/binderTypeSlice";
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog";
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ThemeSelect from "@/component/common_component/themeselect";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";
import { orderService } from "@/services/order.service";

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
};

const PrinterForm = () => {
  const router = useRouter();
  const { id: orderId } = router.query;
  const dispatch = useAppDispatch();
  const { singleOrder }:any = useAppSelector((state) => state.orders);
  const { binderTypes } = useAppSelector((state) => state.binderType);
  const { materials } = useAppSelector(state => state.materials);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [openFilesDialog, setOpenFilesDialog] = useState(false);
  const [selectedPrinterStaff, setSelectedPrinterStaff] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [paperFields, setPaperFields] = useState<any>([]);

  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      if (orderId && typeof orderId === "string") {
        try {
          setPageLoading(true);
          await dispatch(getOrderByIdThunk(orderId)).unwrap();
          await orderService.markNotificationRead(orderId, "printer");
        } catch (err) {
          console.error("Failed to fetch order:", err);
          toast.error("Failed to load order data");
        } finally {
          setPageLoading(false);
        }
      }
    };
    fetchOrderData();
  }, [dispatch, orderId]);

  useEffect(() => {
    if (!materials.length) dispatch(getAllMaterialsThunk());
    if (!binderTypes.length) dispatch(getAllBinderTypesThunk());
  }, [dispatch, materials.length, binderTypes.length]);
  // Initialize formik values and selected staff when singleOrder changes
  useEffect(() => {
    if (singleOrder) {
      // Safely convert binding to boolean: handles boolean false/true, string "false"/"true", undefined/null/empty as false
      const bindingValue = !!singleOrder.binding && singleOrder.binding !== "false";
      const bookletFolderValue = !!singleOrder.bookletFolder && singleOrder.bookletFolder !== "false";
      formik.setValues({
        companyName: singleOrder.companyName?.companyName || "",
        partyName: singleOrder.party?.partyName || "",
        itemName: singleOrder.productItem?.itemName || "",
        qty: singleOrder.qty?.toString() || "",
        size: singleOrder.size || "",
        binding: bindingValue,
        bindingType: singleOrder.bindingType?._id || "",
        bindingPage: singleOrder.bindingPage || "",
        bookletFolder: bookletFolderValue,
        bookletFolderType: singleOrder.bookletFolderType || "",
        color: singleOrder.color || "",
        color1: singleOrder.color1 || "",
        color2: singleOrder.color2 || "",
        pType: singleOrder.pType || "",
        printingrate: singleOrder.printingrate || "",
        gsm: singleOrder.gsm || "",
        rowPaperSize: singleOrder.rowPaperSize || "",
        rowPaperUser: singleOrder.rowPaperUser || "",
        printerRemarks: singleOrder.printerRemarks || "",
      });

      if (singleOrder.printer && singleOrder.printer._id) {
        setSelectedPrinterStaff({
          value: singleOrder.printer._id,
          label: singleOrder.printer.name || `Printer ${singleOrder.printer._id}`,
        });
      } else {
        setSelectedPrinterStaff(null);
      }

      // Initialize paper fields from order data
      if (singleOrder.printerPapers && singleOrder.printerPapers.length > 0) {
        setPaperFields(singleOrder.printerPapers);
      } else {
        // Default first paper field
        setPaperFields([{
          paperName: "Paper-1",
          numberOfSheetsUsed: null,
          sheetSize: null,
          paperType: null,
          gsm: null,
          paperSize: null,
        }]);
      }
    }
  }, [singleOrder]);
  const getSelectedOption = (value: string, options: OptionType[]) => {
    return options.find((option) => option.value === value) || null;
  };
  const formik = useFormik({
    initialValues: {
      companyName: "",
      partyName: "",
      itemName: "",
      qty: "",
      size: "",
      binding: false,
      bindingType: "",
      bindingPage: "",
      bookletFolder: false,
      bookletFolderType: "",
      color: "",
      color1: "",
      color2: "",
      pType: "",
      printingrate: "",
      gsm: "",
      rowPaperSize: "",
      rowPaperUser: "",
      printerRemarks: "",
    },
    validationSchema: Yup.object({
      size: Yup.string().required("Size is required"),
      printerPapers: Yup.array().of(
        Yup.object().shape({
          numberOfSheetsUsed: Yup.string().required("Number of Sheets Used is required"),
          sheetSize: Yup.string().required("Sheet Size is required"),
          paperType: Yup.string().required("Paper Type is required"),
          gsm: Yup.string().required("GSM is required"),
        })
      ),
    }),
    onSubmit: async (values) => {
      if (!orderId || typeof orderId !== "string") {
        toast.error("Order ID not found");
        return;
      }
      if (singleOrder?.status === "Hold") {
        toast.error("Order is on hold. Please unhold to assign to printer.");
        return;
      }
      if (!selectedPrinterStaff) {
        toast.error("Please select a printer to assign.");
        return;
      }
      setLoading(true);
      try {
        const updateData = {
          size: values.size,
          binding: values.binding,
          bindingType: values.binding ? values.bindingType : null,
          bindingPage: values.bindingPage,
          bookletFolder: values.bookletFolder,
          bookletFolderType: values.bookletFolder ? values.bookletFolderType : null,
          pType: values.pType,
          printingrate: values.printingrate,
          gsm: values.gsm,
          rowPaperSize: values.rowPaperSize,
          rowPaperUser: values.rowPaperUser,
          printerRemarks: values.printerRemarks,
          printer: selectedPrinterStaff.value,
          printerStatus: "Pending",
          status: "Printer",
          printerPapers: paperFields.map((paper:any) => ({
            ...paper,
          })),
        };
        await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap();
        toast.success(`Order assigned to Printer successfully`);
        await dispatch(getOrderByIdThunk(orderId)).unwrap();
      } catch (error: any) {
        console.error("Error updating order:", error);
        toast.error(error?.message || "Failed to update order");
      } finally {
        setLoading(false);
      }
    },
  });

  const materialNameOptions = Array.from(
    new Set(materials.map(material => material.materialName))
  ).map(name => {
    const materialObj = materials.find(m => m.materialName === name)!;
    return {
      value: materialObj._id,
      label: name
    };
  });

  const getMaterialGSMOptions = (materialName: string) => {
    const filteredMaterials = materials.filter(material => material._id === materialName);
    return Array.from(
      new Set(filteredMaterials.map(material => material.materialGSM.toString()))
    ).map(gsm => {
      const materialObj = filteredMaterials.find(m => m.materialGSM.toString() === gsm)!;
      return {
        value: materialObj._id,
        label: `${gsm} GSM`
      };
    });
  };

  const getMaterialSizeOptions = (materialName: string, materialGSM: string) => {
    const filteredMaterials = materials.filter(
      material =>
        material._id === materialName
    );
    return Array.from(
      new Set(filteredMaterials.map(material => material.materialSize))
    ).map(size => {
      const materialObj = filteredMaterials.find(m => m.materialSize === size)!;
      return {
        value: materialObj._id,
        label: size
      };
    });
  };

  const handleMaterialNameChange = (index: number, value: string) => {
    const updatedFields = [...paperFields];
    updatedFields[index] = {
      ...updatedFields[index],
      materialName: value,
      paperType: value,
      gsm: "",
      materialSize: "",
    };
    setPaperFields(updatedFields);
  };

  const handleMaterialGSMChange = (index: number, value: string) => {
    const updatedFields = [...paperFields];
    updatedFields[index] = {
      ...updatedFields[index],
      gsm: value,
      materialSize: "",
    };
    setPaperFields(updatedFields);
  };

  const handleMaterialSizeChange = (index: number, value: string) => {
    const updatedFields = [...paperFields];
    updatedFields[index] = {
      ...updatedFields[index],
      materialSize: value,
      sheetSize: value
    };
    setPaperFields(updatedFields);
  };

  const handleHoldToggle = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found");
      return;
    }
    setLoading(true);
    try {
      const newStatus = singleOrder?.status === "Hold" ? "Printer" : "Hold";
      const updateData: any = { status: newStatus };
      if (newStatus !== "Hold" && singleOrder?.printerStatus === "Hold") {
        updateData.printerStatus = "Pending";
      }
      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap();
      toast.success(`Order ${newStatus === "Hold" ? "put on hold" : "unheld"} successfully`);
      await dispatch(getOrderByIdThunk(orderId)).unwrap();
    } catch (error: any) {
      console.error("Error toggling hold status:", error);
      toast.error(error?.message || "Failed to toggle hold status");
    } finally {
      setLoading(false);
    }
  };

  const handlePrinterStaffChange = (event: any, newValue: any) => {
    setSelectedPrinterStaff(newValue);
  };

  const handleAssignToBinder = () => {
    router.push(`/admin/all-orders/view/binder/?id=${orderId}`);
  };

  const handleAssignToBookletBinder = async () => {
    if (!orderId || typeof orderId !== "string") {
      toast.error("Order ID not found");
      return;
    }
    if (singleOrder?.status === "Hold") {
      toast.error("Order is on hold. Please unhold to assign to booklet binder.");
      return;
    }
    if (!selectedPrinterStaff) {
      toast.error("Please select a printer before assigning to booklet binder.");
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        status: "Booklet & Folder Binder",
        bookletBinderStatus: "Pending",
        bookletBinder: null,
        printerStatus: singleOrder?.printerStatus === "Pending" ? "Done" : singleOrder?.printerStatus,
        binderStatus: singleOrder?.binderStatus || "Pending",
      };

      await dispatch(updateOrderThunk({ id: orderId, data: updateData as any })).unwrap();
      toast.success("Order assigned to Booklet & Folder Binder successfully");
      router.push(`/admin/all-orders/view/booklet-folder/?id=${orderId}`);
    } catch (error: any) {
      console.error("Error assigning to booklet binder:", error);
      toast.error(error?.message || "Failed to assign to booklet binder");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToDelivery = () => {
    router.push(`/admin/all-orders/view/dilevery/?id=${orderId}`);
  };

  const handleAddPaperField = () => {
    setPaperFields([...paperFields, {
      paperName: `Paper-${paperFields.length + 1}`,
      numberOfSheetsUsed: "",
      sheetSize: "",
      paperType: "",
      gsm: "",
    }]);
  };

  const handlePaperFieldChange = (index: number, field: keyof PaperField, value: string) => {
    const updatedFields = [...paperFields];
    updatedFields[index] = {
      ...updatedFields[index],
      [field]: value
    };
    setPaperFields(updatedFields);
  };

  const handleDeletePaperField = (index: number) => {
    if (paperFields.length === 1) {
      toast.error("At least one paper field is required");
      return;
    }
    const updatedFields = paperFields.filter((_:any, i:any) => i !== index);
    setPaperFields(updatedFields);
  };

  const handleEmailClick = (type: 'printer' = 'printer') => {
    const recipientEmail = singleOrder?.party?.email || '';
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

    const address = [
      singleOrder?.party?.address?.unitNo || '',
      singleOrder?.party?.address?.marketName?.marketName || '',
      singleOrder?.party?.address?.area?.area || '',
      singleOrder?.party?.address?.pincode?.pincode || '',
    ].filter(part => part?.trim() !== '').join(', ') || 'N/A';

    const gstText = gstPercentage > 0 ? ` (incl. ${gstPercentage}% GST)` : '';
    const subject = `Order ${orderNumber} - Printer Work Completed`;

    const body = `Dear ${contactPerson},

Printer work for the following order has been completed. Please review the details and proceed to the next step (Binder or Delivery).

---
ORDER DETAILS:
-------------

Order Number: ${orderNumber}
Company Name: ${companyName}
Party Name: ${partyName}
Contact Person: ${contactPerson}

Item: ${itemName}
Quantity: ${quantity}
Unit Price: ₹${(totalAmount / quantity).toLocaleString()} ${gstText}
Total Amount: ₹${totalAmount.toLocaleString()} ${gstText}
Final Amount: ₹${finalAmount.toLocaleString()}

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
    );
  }

  if (!singleOrder) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>No order data found</Typography>
      </Box>
    );
  }

  const isHeld = singleOrder?.status === "Hold";
  const isPrinterAssigned = !!singleOrder?.printer;
  const isPrinterStatusPending = singleOrder?.printerStatus === "Pending";
  const isPrinterStatusDone = singleOrder?.printerStatus === "Done";
  const isPrinterStatusInProgress = singleOrder?.printerStatus === "In Progress";

  const areFieldsReadOnly = isHeld || isPrinterStatusDone || isPrinterStatusInProgress;

  return (
    <>
      <Box>
        <Typography fontWeight={600} fontSize={18} mb={3}>
          {singleOrder.party?.partyName || "Party"}
        </Typography>
        <StepperProgress
          activeStep={2}
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
          <Typography fontWeight={600} fontSize={16} mb={3}>
            Printer
          </Typography>
          <Stack direction="row" spacing={2} mb={3}>
            <ThemeInput
              labelName="Company Name"
              value={formik.values.companyName}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <ThemeInput
              labelName="Party Name"
              value={formik.values.partyName}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <ThemeInput
              labelName="Whatsapp Number"
              value={singleOrder.party?.ownerWhatsAppNo || "N/A"}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <ThemeInput
              labelName="Item Name"
              value={formik.values.itemName}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <RoleStaffSelect
              label="Select Printer"
              name="printerRole"
              value={selectedPrinterStaff}
              onChange={handlePrinterStaffChange}
              onStaffChange={handlePrinterStaffChange}
              roleFilter="Printer"
              showStaff={true}
              disabled={areFieldsReadOnly || isPrinterAssigned}
            />
          </Stack>

          <Stack direction="row" spacing={2} mb={3}>
            <ThemeInput
              labelName="Item Size"
              value={formik.values.size}
              name="size"
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.size && Boolean(formik.errors.size)}
              helperText={formik.touched.size && formik.errors.size}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Item Quantity"
              value={formik.values.qty}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <ThemeInput
              labelName="Printing Type"
              value={formik.values.pType}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Stack>
          <Stack direction="row" spacing={2} mb={2}>
            <ThemeInput
              labelName="Binding Type"
              value={binderTypes.find(b => b._id === formik.values.bindingType)?.name || formik.values.bindingType}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <ThemeInput
              labelName="Binding Page"
              value={formik.values.bindingPage}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <ThemeInput
              labelName="Booklet/Folder Type"
              value={formik.values.bookletFolderType}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Stack>
          <Stack direction="row" spacing={2} mb={2}>
            <ThemeInput
              labelName="Color"
              value={`Color - ${formik.values.color}`}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            {formik.values.color1 && (
              <ThemeInput
                labelName="COLOR1"
                value={formik.values.color1}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            )}
            {formik.values.color2 && (
              <ThemeInput
                labelName="COLOR2"
                value={formik.values.color2}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            )}
            <ThemeInput
              labelName="Printing Rate"
              name="printingrate"
              value={formik.values.printingrate}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.printingrate && Boolean(formik.errors.printingrate)}
              helperText={formik.touched.printingrate && formik.errors.printingrate}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            {(isPrinterStatusDone || isPrinterStatusInProgress) && (
              <ThemeInput
                labelName="Printer Wasted Sheet"
                value={singleOrder?.printerWastedSheet?.toString() || "0"}
                type="number"
                fullWidth
                InputProps={{ readOnly: true }}
              />
            )}
          </Stack>

          <Box mb={3}>
            <ThemeInput
              labelName="Printer Remarks"
              placeholder="Enter Remarks"
              fullWidth
              multiline
              rows={2}
              name="printerRemarks"
              value={formik.values.printerRemarks}
              onChange={formik.handleChange}
              error={formik.touched.printerRemarks && Boolean(formik.errors.printerRemarks)}
              helperText={formik.touched.printerRemarks && formik.errors.printerRemarks}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
          </Box>
          
          {paperFields?.map((paper:any, index:any) => (
            <Box key={index} mb={3} p={2} border={1} borderRadius={2} borderColor="#ddd">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography fontWeight={600}>
                  {paper.paperName}
                </Typography>
                {!areFieldsReadOnly && (
                  <IconButton
                    onClick={() => handleDeletePaperField(index)}
                    disabled={paperFields.length === 1}
                    sx={{
                      color: '#F04438',
                      '&:hover': { backgroundColor: '#FEE2E2' },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
              <Stack direction="row" spacing={2}>
                <ThemeSelect
                  label="Paper Type"
                  options={materialNameOptions}
                  value={materialNameOptions.find(opt => opt.value === paper.paperType) || null}
                  onChange={(e, newValue) => handleMaterialNameChange(index, newValue?.value as string || "")}
                  required
                  disabled={areFieldsReadOnly}
                />
                <ThemeSelect
                  label="GSM"
                  options={getMaterialGSMOptions(paper.paperType)}
                  value={getMaterialGSMOptions(paper.paperType).find(opt => opt.value === paper.gsm) || null}
                  onChange={(e, newValue) => handleMaterialGSMChange(index, newValue?.value as string || "")}
                  required
                  disabled={!paper.paperType || areFieldsReadOnly}
                />
                <ThemeSelect
                  label="Size"
                  options={getMaterialSizeOptions(paper.paperType, paper.gsm)}
                  value={getMaterialSizeOptions(paper.paperType, paper.gsm).find(opt => opt.value === paper.materialSize) || null}
                  onChange={(e, newValue) => handleMaterialSizeChange(index, newValue?.value as string || "")}
                  required
                  disabled={!paper.paperType || areFieldsReadOnly}
                />
                <ThemeInput
                  labelName="Paper No. Of Sheet Used"
                  name="numberOfSheetsUsed"
                  type="number"
                  value={paper.numberOfSheetsUsed || ""}
                  onChange={(e) =>
                    setPaperFields((prev:any) =>
                      prev.map((p:any, i:any) =>
                        i === index ? { ...p, numberOfSheetsUsed: e.target.value } : p
                      )
                    )
                  }
                  fullWidth
                  InputProps={{ readOnly: areFieldsReadOnly }}
                />
              </Stack>
            </Box>
          ))}

          {!areFieldsReadOnly && (
            <Box mb={3} display="flex" justifyContent="flex-end">
              <ThemeButton
                onClick={handleAddPaperField}
                disabled={areFieldsReadOnly}
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: "#6366F1",
                  borderRadius: "8px",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#4F46E5" },
                }}
              >
                Add Paper
              </ThemeButton>
            </Box>
          )}

          <Typography fontWeight={600} mb={2}>
            Send for Next Step Approval via
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={4}>
            <Box
              onClick={() => handleEmailClick('printer')}
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

          {singleOrder?.approvedFiles && singleOrder.approvedFiles.length > 0 && (
            <Stack direction="row" gap={2} mb={3}>
              <ThemeButton
                variant="outlined"
                fullWidth
                onClick={() => setOpenFilesDialog(true)}
                sx={{
                  color: "#344054",
                  borderColor: "#D0D5DD",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: 16,
                  background: "#fff",
                  "&:hover": { background: "#f6fef9" },
                }}
                startIcon={
                  <svg width="20" height="20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="#98A2B3" strokeWidth="2" />
                    <circle cx="10" cy="10" r="3" fill="#98A2B3" />
                  </svg>
                }
              >
                View Design Files ({singleOrder.approvedFiles.length})
              </ThemeButton>
            </Stack>
          )}

          <Box sx={{ display: "flex", gap: 2, flexDirection: "row" }}>
            <ThemeButton
              sx={{
                background: areFieldsReadOnly ? "#ccc" : "#12B76A",
                color: "#fff",
                fontWeight: 600,
                fontSize: 18,
                borderRadius: 2,
                py: 1.2,
                width: "100%",
                "&:hover": { background: areFieldsReadOnly ? "#ccc" : "#079455" },
              }}
              onClick={formik.handleSubmit}
              disabled={areFieldsReadOnly || loading || !selectedPrinterStaff}
            >
              {loading ? "Assigning..." : `Assign To Printer →`}
            </ThemeButton>
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

          {isPrinterStatusDone && (
            <Box mt={4}>
              <Typography fontWeight={600} mb={2} color="#12B76A">
                ✅ Printer Work Done
              </Typography>

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
                  onClick={handleAssignToBinder}
                  disabled={isHeld || loading}
                >
                  Assign to Binder
                </ThemeButton>
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
                  onClick={handleAssignToBookletBinder}
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
        open={openFilesDialog}
        onClose={() => setOpenFilesDialog(false)}
        files={singleOrder?.designFiles?.map((file: any) => file.path) || []}
        title="Design Files"
        showDownload={true}
        showView={true}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  )
}

export default PrinterForm

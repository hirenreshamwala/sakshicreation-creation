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
} from "@mui/material";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeButton from "@/component/common_component/themebutton";
import StepperProgress from "@/component/common_component/stepperprogress";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useAppDispatch, useAppSelector } from "@/store";
import { getOrderByIdThunk, updateOrderThunk } from "@/store/slices/orderSlice";
import ViewFilesDialog from "@/component/reusablecomponents/ViewFilesDialog";
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ThemeSelect from "@/component/common_component/themeselect";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";

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
  const { singleOrder } = useAppSelector((state) => state.orders);
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
  const [paperFields, setPaperFields] = useState<PaperField[]>([]);

  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      if (orderId && typeof orderId === "string") {
        try {
          setPageLoading(true);
          await dispatch(getOrderByIdThunk(orderId)).unwrap();
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
  }, [])

  // Initialize formik values and selected staff when singleOrder changes
  useEffect(() => {
    if (singleOrder) {
      formik.setValues({
        companyName: singleOrder.companyName?.companyName || "",
        partyName: singleOrder.party?.partyName || "",
        itemName: singleOrder.productItem?.itemName || "",
        qty: singleOrder.qty?.toString() || "",
        size: singleOrder.size || "",
        binding: singleOrder.binding || "",
        subPaper: singleOrder.subPaper || "",
        usedPaper: singleOrder.usedPaper || "",
        pType: singleOrder.pType || "",
        printingrate: singleOrder.printingrate || "",
        printingratePerUnit: singleOrder.printingratePerUnit || "",
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
          numberOfSheetsUsed: "",
          sheetSize: "",
          paperType: "",
          gsm: "",
          ratePerUnit: "",
          paperSize: "",
        }]);
      }
    }
  }, [singleOrder]);



  const formik = useFormik({
    initialValues: {
      companyName: "",
      partyName: "",
      itemName: "",
      qty: "",
      size: "",
      binding: "",
      subPaper: "",
      usedPaper: "",
      pType: "",
      printingrate: "",
      printingratePerUnit: "",
      gsm: "",
      rowPaperSize: "",
      rowPaperUser: "",
      printerRemarks: "",
    },
    validationSchema: Yup.object({
      size: Yup.string().required("Size is required"),
      binding: Yup.string().required("Binding is required"),
      subPaper: Yup.string().required("Sub Paper is required"),
      usedPaper: Yup.string().required("Used Paper is required"),
      pType: Yup.string().required("Product Type is required"),
      printingrate: Yup.string().required("Printing Rate is required"),
      printingratePerUnit: Yup.string().required("Printing Rate Per Unit is required"),
      // gsm: Yup.string().required("GSM is required"),
      // rowPaperSize: Yup.string().required("Raw Paper Size is required"),
      // rowPaperUser: Yup.string().required("Raw Paper User is required"),
      printerRemarks: Yup.string().required("Remarks are required"),
      printerPapers: Yup.array().of(
        Yup.object().shape({
          numberOfSheetsUsed: Yup.string().required("Number of Sheets Used is required"),
          sheetSize: Yup.string().required("Sheet Size is required"),
          paperType: Yup.string().required("Paper Type is required"),
          gsm: Yup.string().required("GSM is required"),
          ratePerUnit: Yup.string().required("Rate Per Unit is required"),
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
          subPaper: values.subPaper,
          usedPaper: values.usedPaper,
          pType: values.pType,
          printingrate: values.printingrate,
          printingratePerUnit: values.printingratePerUnit,
          gsm: values.gsm,
          rowPaperSize: values.rowPaperSize,
          rowPaperUser: values.rowPaperUser,
          printerRemarks: values.printerRemarks,
          printer: selectedPrinterStaff.value,
          printerStatus: "Pending",
          status: "Printer",
          printerPapers: paperFields, // Save paper fields to order
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

  const materialNameOptions = Array.from(new Set(materials.map(material => material.materialName))).map(name => ({
    value: name,
    label: name
  }));

  const getMaterialGSMOptions = (materialName: string) => {
    const filteredMaterials = materials.filter(material => material.materialName === materialName);
    return Array.from(new Set(filteredMaterials.map(material => material.materialGSM.toString()))).map(gsm => ({
      value: gsm,
      label: `${gsm} GSM`
    }));
  };

  const getMaterialSizeOptions = (materialName: string, materialGSM: string) => {
    const filteredMaterials = materials.filter(
      material =>
        material.materialName === materialName &&
        material.materialGSM.toString() === materialGSM
    );
    return Array.from(new Set(filteredMaterials.map(material => material.materialSize))).map(size => ({
      value: size,
      label: size
    }));
  };

  // Handle material selection for a specific paper field
  const handleMaterialNameChange = (index: number, value: string) => {
    const updatedFields = [...paperFields];
    updatedFields[index] = {
      ...updatedFields[index],
      materialName: value,
      paperType: value,
      gsm: "", // Reset GSM when material name changes
      materialSize: "", // Reset size when material name changes
    };
    setPaperFields(updatedFields);
  };

  const handleMaterialGSMChange = (index: number, value: string) => {
    const updatedFields = [...paperFields];
    updatedFields[index] = {
      ...updatedFields[index],
      gsm: value,
      materialSize: "", // Reset size when GSM changes
    };
    setPaperFields(updatedFields);
  };

  const handleMaterialSizeChange = (index: number, value: string) => {
    const updatedFields = [...paperFields];
    updatedFields[index] = {
      ...updatedFields[index],
      materialSize: value,
      sheetSize: value // Set sheetSize to match material size
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
        bookletBinder: null, // Will be set in BookletFolderBinderForm
        printerStatus: singleOrder?.printerStatus === "Pending" ? "Done" : singleOrder?.printerStatus,
        binderStatus: singleOrder?.binderStatus || "Pending", // Mark binder as skipped
      };

      await dispatch(updateOrderThunk({ id: orderId, data: updateData })).unwrap();
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
      ratePerUnit: ""
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
    const updatedFields = paperFields.filter((_, i) => i !== index);
    setPaperFields(updatedFields);
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

  // Determine if fields should be read-only
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

          {/* Specs Section - Single Row */}
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
              labelName="Binding"
              value={formik.values.binding}
              name="binding"
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.binding && Boolean(formik.errors.binding)}
              helperText={formik.touched.binding && formik.errors.binding}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Sub Paper"
              name="subPaper"
              value={formik.values.subPaper}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.subPaper && Boolean(formik.errors.subPaper)}
              helperText={formik.touched.subPaper && formik.errors.subPaper}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Used Paper"
              name="usedPaper"
              value={formik.values.usedPaper}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.usedPaper && Boolean(formik.errors.usedPaper)}
              helperText={formik.touched.usedPaper && formik.errors.usedPaper}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            <ThemeInput
              labelName="Printing Type"
              name="pType"
              value={formik.values.pType}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.pType && Boolean(formik.errors.pType)}
              helperText={formik.touched.pType && formik.errors.pType}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
          </Stack>

          {/* Paper Fields Section */}
          {paperFields.map((paper, index) => (
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
                {/* <Stack direction="row" spacing={2} mb={2}> */}
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
                {/* </Stack> */}
                <ThemeInput
                  labelName="Paper No. Of Sheet Used"
                  name="rowPaperUser"
                  value={formik.values.rowPaperUser}
                  onChange={formik.handleChange}
                  fullWidth
                  error={formik.touched.rowPaperUser && Boolean(formik.errors.rowPaperUser)}
                  helperText={formik.touched.rowPaperUser && formik.errors.rowPaperUser}
                  InputProps={{ readOnly: areFieldsReadOnly }}
                />

                <ThemeInput
                  labelName="Rate / Unit"
                  value={paper.ratePerUnit}
                  onChange={(e) => handlePaperFieldChange(index, 'ratePerUnit', e.target.value)}
                  fullWidth
                  required
                  error={!paper.ratePerUnit && formik.submitCount > 0}
                  helperText={!paper.ratePerUnit && formik.submitCount > 0 ? "This field is required" : ""}
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
                  "&:hover": { backgroundColor: "#4F46E5" }, // hover effect
                }}
              >
                Add Paper
              </ThemeButton>
            </Box>
          )}

          {/* Specs Section - Second Row */}
          <Stack direction="row" spacing={2} mb={3}>
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
            <ThemeInput
              labelName="Printing Rate Per Unit"
              name="printingratePerUnit"
              value={formik.values.printingratePerUnit}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.printingratePerUnit && Boolean(formik.errors.printingratePerUnit)}
              helperText={formik.touched.printingratePerUnit && formik.errors.printingratePerUnit}
              InputProps={{ readOnly: areFieldsReadOnly }}
            />
            {/* <ThemeInput
              labelName="Raw Paper Size"
              name="rowPaperSize"
              value={formik.values.rowPaperSize}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.rowPaperSize && Boolean(formik.errors.rowPaperSize)}
              helperText={formik.touched.rowPaperSize && formik.errors.rowPaperSize}
              InputProps={{ readOnly: areFieldsReadOnly }}
            /> */}
            {/* <ThemeInput
              labelName="Raw Paper No. Of Sheet Used"
              name="rowPaperUser"
              value={formik.values.rowPaperUser}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.rowPaperUser && Boolean(formik.errors.rowPaperUser)}
              helperText={formik.touched.rowPaperUser && formik.errors.rowPaperUser}
              InputProps={{ readOnly: areFieldsReadOnly }}
            /> */}
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

          {/* Specs Section - Third Row */}
          {/* <Stack direction="row" spacing={2} mb={3}>
            
          </Stack> */}

          {/* Remarks */}
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

          {/* View Design Files */}
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
              View Design Files ({singleOrder?.designFiles?.length || 0})
            </ThemeButton>
          </Stack>

          {/* Action Buttons */}
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

          {/* Printer Status Done Section */}
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
      {/* Files Dialog */}
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
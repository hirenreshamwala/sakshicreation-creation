"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Box, TextField, Autocomplete, FormControlLabel, Checkbox } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomDialog from "@/component/customdialog";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  createPerformanceInvoiceThunk,
  updatePerformanceInvoiceThunk,
  getPerformanceInvoiceByIdThunk,
  clearSuccessMessage,
  clearError,
} from "@/store/slices/performanceInvoiceSlice"
import { orderService } from "@/services/order.service"
import { performanceInvoiceService } from "@/services/performanceInvoice.service"
import InvoicePDFGenerator from "../InvoicePDFGenerator"
import { assignTaskService } from "@/services/assignTask.service";
import { getAllMarketsThunk } from "@/store/slices/marketDataSlice";
import { updateOrderThunk } from "@/store/slices/orderSlice";

interface FormData {
  orderNumber: string;
  companyName: string;
  partyName: string;
  quantity: number;
  color?: string;
  pType?: string;
  size?: string;
  GSTNo: string;
  remarks?: string;
  ownerMobileNo?: string;
  addressName: string;
  servicePerformance: string;
  unitPrice?: number;
  total?: number;
  applyGST: boolean;
  gstPercentage?: number;
  finalAmount?: number;
  assignedTo?: string;
  daysAfterConfirmation?: number;
  paymentDate?: number;
  description?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  companyName: {
    _id: string;
    companyName: string;
  };
  party: {
    _id: string;
    partyName: string;
    GSTNo?: string;
    address?: {
      unitNo?: string;
      // streetAddress?: string;
      marketName?: string;
      landMark?: string;
      area?: string;
      pincode?: string;
    };
    ownerMobileNo?: string;
  };
  productItem: {
    _id: string;
    itemName: string;
  };
  color?: string;
  size?: string;
  pType?: string;
  qty: number;
  remarks?: string;
  status: string;
  unitPrice?: number;
  applyGST?: boolean;
  gstPercentage?: number;
  total?: number;
  finalAmount?: number;
  daysAfterConfirmation?: number;
  paymentDate?: number;
  description?: string;
}

interface AddNewPerformanceInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId?: string;
  refreshData?: () => void;
  data?: any;
  orderId: string;
  onInvoiceSaved?: () => void;
}

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
}

const validationSchema = Yup.object({
  orderNumber: Yup.string().required("Order Number is required"),
  companyName: Yup.string()
    .required("Company Name ID is required")
    .matches(/^[0-9a-fA-F]{24}$/, "Invalid Company Name ID"),
  partyName: Yup.string()
    .required("Party Name ID is required")
    .matches(/^[0-9a-fA-F]{24}$/, "Invalid Party Name ID"),
  quantity: Yup.number().required("Quantity is required").min(1, "Quantity must be at least 1"),
  applyGST: Yup.boolean(),
  gstPercentage: Yup.number()
    .min(0, "GST Percentage cannot be negative")
    .max(100, "GST Percentage cannot exceed 100%")
    .when('applyGST', {
      is: true,
      then: (schema) => schema.required("GST Percentage is required when GST is applied"),
      otherwise: (schema) => schema.optional()
    }),
  GSTNo: Yup.string(),
  addressName: Yup.string(),
  servicePerformance: Yup.string().required("Service/Performance is required"),
  daysAfterConfirmation: Yup.number()
    .min(0, "Days after confirmation cannot be negative")
    .optional(),
  paymentDate: Yup.number() // Add this
    .min(0, "Payment date cannot be negative")
    .optional(),
});

const AddNewPerformanceInvoiceDialog: React.FC<AddNewPerformanceInvoiceDialogProps> = ({
  open,
  onClose,
  invoiceId,
  refreshData,
  data,
  orderId,
  onInvoiceSaved,
}) => {
  const dispatch = useAppDispatch();
  const { loading: invoiceLoading, error: invoiceError } = useAppSelector((state) => state.performanceInvoices);
  const { loading: orderLoading } = useAppSelector((state) => state.orders);
  const { markets } = useAppSelector((state) => state.markets);
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditMode, setIsEditMode] = useState(!!invoiceId);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | undefined>(invoiceId);
  const [isSaved, setIsSaved] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  

  useEffect(() => {
    if (!markets.length) dispatch(getAllMarketsThunk())
  }, [])


  useEffect(() => {
    if (!open) return;
    dispatch(clearSuccessMessage());
    dispatch(clearError());

    const fetchStaffList = async () => {
      try {
        const response = await assignTaskService.getAllAssignTasks();
        if (response.success && response.data) {
          const uniqueStaff = new Map<string, Staff>();
          response.data.forEach(task => {
            if (task.assignTo && typeof task.assignTo === 'object') {
              const staff = task.assignTo as unknown as Staff;
              if (!uniqueStaff.has(staff._id)) {
                uniqueStaff.set(staff._id, staff);
              }
            }
          });
          setStaffList(Array.from(uniqueStaff.values()));
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch staff list");
      }
    };

    fetchStaffList();

    const fetchOrders = async () => {
      try {
        const response = await orderService.getAllOrders();
        if (response.success && Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          toast.error("Invalid response format: orders array not found");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch orders");
      }
    };
    fetchOrders();
  }, [open, dispatch]);

  // Get last quotation data
  // const getLastQuotation = () => {
  //   if (!data?.quotation || data.quotation.length === 0) {
  //     return { qty: 0, unitPrice: 0, gst: 0 };
  //   }
  //   return data.quotation[data.quotation.length - 1];
  // };

  const formik = useFormik<FormData>({
    initialValues: {
      orderNumber: "",
      companyName: "",
      partyName: "",
      quantity: 0,
      color: "",
      pType: "",
      size: "",
      GSTNo: "",
      remarks: "",
      ownerMobileNo: "",
      addressName: "",
      servicePerformance: "",
      unitPrice: 0,
      total: 0,
      applyGST: false,
      gstPercentage: 0,
      finalAmount: 0,
      assignedTo: "",
      daysAfterConfirmation: undefined,
      paymentDate: undefined,
      description: "",
    },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setSubmitting }) => {
      const validationErrors = await formik.validateForm(values);
      if (Object.keys(validationErrors).length > 0) {
        toast.error(`Validation failed: ${JSON.stringify(validationErrors)}`, { autoClose: 5000 });
        setIsLoading(false);
        setSubmitting(false);
        return;
      }

      if (isEditMode && !currentInvoiceId) {
        toast.error("Invalid invoice ID for update");
        setIsLoading(false);
        setSubmitting(false);
        return;
      }

      setIsLoading(true);
      setSubmitting(true);

      try {
        const invoiceData: any = {
          orderNumber: values.orderNumber,
          companyName: values.companyName,
          partyName: values.partyName,
          quantity: values.quantity,
          color: values.color || "",
          size: values.size || "",
          pType: values.pType || "",
          GSTNo: values.GSTNo || "",
          remarks: values.remarks || "",
          ownerMobileNo: values.ownerMobileNo || "",
          partyAddress: {
            landMark: values.addressName || "",
            unitNo: "",
            marketName: "",
            area: "",
            pincode: "",
          },
          servicePerformance: values.servicePerformance,
          unitPrice: values.unitPrice || 0,
          total: values.total || 0,
          applyGST: values.applyGST,
          gstPercentage: values.gstPercentage?.toString() || "0", // ✅ String में convert करें
          assignedTo: values.assignedTo,
          finalAmount: values.finalAmount || 0,
          daysAfterConfirmation: values.daysAfterConfirmation,
          paymentDate: values.paymentDate,
          description: values.description || "",
        };

        // ✅ Order ID निकालें
        const selectedOrder = orders.find(order => order.orderNumber === values.orderNumber);
        if (!selectedOrder) {
          throw new Error("Order not found");
        }

        // ✅ HISTORY MANAGEMENT LOGIC - IMPROVED
        if (isEditMode && currentInvoiceId) {
          try {
            // Existing invoice fetch करें
            const existingInvoice = await performanceInvoiceService.getPerformanceInvoiceById(currentInvoiceId);

            if (existingInvoice.success && existingInvoice.data) {
              const existingData = existingInvoice.data;

              // ✅ Old values को history में add करें (सभी required fields सही तरीके से)
              const historyEntry = {
                unitPrice: existingData.unitPrice || 0,
                total: existingData.total || 0,
                applyGST: existingData.applyGST || false,
                gstPercentage: existingData.gstPercentage?.toString() || "0", // ✅ String ensure करें
                finalAmount: existingData.finalAmount || 0,
                createdAt: new Date()
              };

              // ✅ History array को set करें
              invoiceData.proformaHistory = [
                ...(existingData.proformaHistory || []),
                historyEntry
              ];

              console.log("✅ Added to history:", historyEntry);
              console.log("✅ Total history entries:", invoiceData.proformaHistory.length);
            }
          } catch (err) {
            console.error("Could not fetch existing invoice:", err);
            invoiceData.proformaHistory = [];
          }
        } else {
          // नया invoice के लिए empty history
          invoiceData.proformaHistory = [];
        }

        // Order update data
        const orderUpdateData = {
          unitPrice: values.unitPrice || 0,
          total: values.total || 0,
          applyGST: values.applyGST,
          gstPercentage: values.gstPercentage?.toString() || "0", // ✅ String में convert
          finalAmount: values.finalAmount || 0,
          daysAfterConfirmation: values.daysAfterConfirmation,
          paymentDate: values.paymentDate,
          description: values.description || "",
        };

        let response;

        // ✅ यहाँ भी Order में history update करें
        const orderHistoryEntry = {
          unitPrice: values.unitPrice || 0,
          total: values.total || 0,
          applyGST: values.applyGST,
          gstPercentage: values.gstPercentage?.toString() || "0",
          finalAmount: values.finalAmount || 0,
          createdAt: new Date(),
          invoiceId: currentInvoiceId || "new"
        };

        // Order में भी history add करें
        if (selectedOrder) {
          // Existing order history लें
          const existingOrderHistory = selectedOrder.proformaHistory || [];
          orderUpdateData.proformaHistory = [
            ...existingOrderHistory,
            orderHistoryEntry
          ];
        }

        // Parallel operations
        if (isEditMode && currentInvoiceId) {
          [response] = await Promise.all([
            dispatch(updatePerformanceInvoiceThunk({
              id: currentInvoiceId,
              data: invoiceData
            })).unwrap(),
            dispatch(updateOrderThunk({
              id: selectedOrder._id,
              data: orderUpdateData
            })).unwrap()
          ]);
          toast.success("Performance invoice and order updated successfully");
        } else {
          [response] = await Promise.all([
            dispatch(createPerformanceInvoiceThunk(invoiceData)).unwrap(),
            dispatch(updateOrderThunk({
              id: selectedOrder._id,
              data: orderUpdateData
            })).unwrap()
          ]);
          toast.success("Performance invoice created and order updated successfully");
        }

        setIsSaved(true);
        if (refreshData) refreshData();
        if (onInvoiceSaved) onInvoiceSaved();

      } catch (err: any) {
        console.error("Submission error:", err);
        toast.error(err.message || "Operation failed");
      } finally {
        setIsLoading(false);
        setSubmitting(false);
      }
    },
  });

  const staffOptions = staffList.map((staff) => ({
    label: `${staff.firstName} ${staff.lastName}`,
    value: staff._id,
  }));

  useEffect(() => {
    if (!open || !invoiceId || !isEditMode) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await dispatch(getPerformanceInvoiceByIdThunk(invoiceId)).unwrap();
        if (result) {
          console.log(result, 'result')
          setInvoiceData(result)
          const fullAddress = [
            result.partyAddress?.unitNo || "",
            result.partyAddress?.marketName?.marketName || "",
            result.partyAddress?.landMark?.landMark || "",
            result.partyAddress?.area?.area || "",
            result.partyAddress?.pincode?.pincode || "",
          ]
            .filter((part) => part?.trim() !== "")
            .join(", ");

          const assignedToValue = result.assignedTo?._id
            ? result.assignedTo._id.toString()
            : result.assignedTo || "";

          // ✅ Directly use the invoice data instead of quotation
          formik.setValues({
            orderNumber: result.orderNumber || "",
            companyName: result.companyName?._id?.toString() || result.companyName || "",
            partyName: result.party?._id?.toString() || result.partyName || "",
            quantity: result.quantity || 0,
            color: result.color || "",
            pType: result.pType || "",
            size: result.size || "",
            GSTNo: result.GSTNo || "",
            remarks: result.remarks || "",
            ownerMobileNo: result.ownerMobileNo || "",
            addressName: fullAddress || "",
            servicePerformance: result.servicePerformance || "",
            unitPrice: result.unitPrice || 0,
            total: result.total || 0,
            applyGST: result.applyGST || false,
            gstPercentage: result.gstPercentage || 0,
            finalAmount: result.finalAmount || 0,
            assignedTo: assignedToValue,
            daysAfterConfirmation: result.daysAfterConfirmation,
            paymentDate: result.paymentDate,
            description: result.description || "",
          });
          setIsSaved(true);
        }
      } catch (err: any) {
        console.error("Error fetching invoice:", err);
        toast.error(err.message || "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [open, isEditMode, invoiceId, dispatch, data]);

  // इस पूरे useEffect को नए कोड से बदलें:
  useEffect(() => {
    if (!open || orders.length === 0) {
      if (!invoiceId && !data?.orderNumber) {
        formik.resetForm();
        setIsEditMode(false);
        setCurrentInvoiceId(undefined);
        setIsSaved(false);
      }
      return;
    }

    const orderNumber = data?.orderNumber || "";
    if (!orderNumber) return;

    formik.setFieldValue("orderNumber", orderNumber);

    const selectedOrder = orders.find((order) => order.orderNumber === orderNumber);
    if (!selectedOrder) {
      toast.error("Selected order not found");
      return;
    }

    console.log("DEBUG : AddNewPerformanceInvoiceDialog : selectedOrder:", selectedOrder);
    const fullAddress = [
      selectedOrder.party.address?.unitNo || "", selectedOrder.party.address?.marketName?.marketName, selectedOrder.party.address?.area?.area, selectedOrder.party.address?.pincode
?.pincode]
      .filter((part) => part?.trim() !== "")
      .join(", ");


    const checkInvoice = async () => {
      try {
        const response = await performanceInvoiceService.getPerformanceInvoices();
        const existingInvoice = response.data?.find((invoice) => invoice.orderNumber === orderNumber);

        if (existingInvoice && !invoiceId) {
          setIsEditMode(true);
          setInvoiceData(existingInvoice);
          setCurrentInvoiceId(existingInvoice._id);
          setIsSaved(true);

          const invoiceAddress = [
            existingInvoice.partyAddress?.unitNo || "",
            existingInvoice.partyAddress?.marketName?.marketName || "",
            existingInvoice.partyAddress?.landMark?.landmark || "",
            existingInvoice.partyAddress?.area?.area || "",
            existingInvoice.partyAddress?.pincode?.pincode || "",
          ]
            .filter((part) => part?.trim() !== "")
            .join(", ");
          console.log("DEBUG : checkInvoice : invoiceAddress:", invoiceAddress);


          const assignedToValue = existingInvoice.assignedTo?._id
            ? existingInvoice.assignedTo._id.toString()
            : existingInvoice.assignedTo || "";

          // ✅ यहाँ existing invoice के values set करें
          formik.setValues({
            orderNumber: existingInvoice.orderNumber || "",
            companyName: existingInvoice.companyName?._id?.toString() || existingInvoice.companyName || "",
            partyName: existingInvoice.party?._id?.toString() || existingInvoice.partyName || "",
            quantity: existingInvoice.quantity || 0,
            color: existingInvoice.color || "",
            pType: existingInvoice.pType || "",
            size: existingInvoice.size || "",
            GSTNo: existingInvoice.GSTNo || "",
            remarks: existingInvoice.remarks || "",
            ownerMobileNo: existingInvoice.ownerMobileNo || "",
            addressName: invoiceAddress || fullAddress,
            servicePerformance: existingInvoice.servicePerformance || "",
            unitPrice: existingInvoice.unitPrice || 0,
            total: existingInvoice.total || 0,
            applyGST: existingInvoice.applyGST || false,
            gstPercentage: existingInvoice.gstPercentage || 0,
            finalAmount: existingInvoice.finalAmount || 0,
            assignedTo: assignedToValue,
            daysAfterConfirmation: existingInvoice.daysAfterConfirmation,
            paymentDate: existingInvoice.paymentDate,
            description: existingInvoice.description || "",

          });
        } else {
          // नया invoice create करते समय:
          // Order से unitPrice और अन्य values लें यदि available हों
          const orderUnitPrice = selectedOrder?.unitPrice || 0;
          const orderTotal = selectedOrder?.total || 0;
          const orderFinalAmount = selectedOrder?.finalAmount || 0;
          const orderApplyGST = selectedOrder?.applyGST || false;
          const orderGSTPercentage = selectedOrder?.gstPercentage || 0;

          formik.setValues({
            orderNumber,
            companyName: selectedOrder.companyName._id || "",
            partyName: selectedOrder.party._id || "",
            quantity: selectedOrder.qty || 0, // Order से quantity लें
            color: selectedOrder.color || "",
            pType: selectedOrder.pType || "",
            size: selectedOrder.size || "",
            GSTNo: selectedOrder.party.GSTNo || "",
            remarks: selectedOrder.remarks || "",
            ownerMobileNo: selectedOrder.party.ownerMobileNo || "",
            addressName: fullAddress || "",
            servicePerformance: selectedOrder.productItem.itemName || "",
            unitPrice: orderUnitPrice, // Order से unitPrice लें
            total: orderTotal, // Order से total लें
            applyGST: orderApplyGST, // Order से applyGST लें
            gstPercentage: orderGSTPercentage, // Order से gstPercentage लें
            finalAmount: orderFinalAmount, // Order से finalAmount लें
            assignedTo: "",
            daysAfterConfirmation: selectedOrder?.daysAfterConfirmation || undefined,
            paymentDate: selectedOrder?.paymentDate || undefined,
            description: selectedOrder?.description || "",
            
          });
        }
      } catch (err: any) {
        console.error("Error checking existing invoice:", err);
        toast.error(err.message || "Failed to check existing invoice");
      }
    };

    checkInvoice();
  }, [open, data?.orderNumber, orders, invoiceId, dispatch, markets, data]);

  // Calculate total and final amount when values change
  useEffect(() => {
    const total = (formik.values.quantity || 0) * (formik.values.unitPrice || 0);
    const gstAmount = formik.values.applyGST ? total * (formik.values.gstPercentage / 100) : 0;
    const finalAmount = total + gstAmount;

    formik.setFieldValue("total", total);
    formik.setFieldValue("finalAmount", finalAmount);
  }, [formik.values.quantity, formik.values.unitPrice, formik.values.gstPercentage, formik.values.applyGST]);

  const selectedOrder = orders.find((o) => o.orderNumber === formik.values.orderNumber);
  const displayCompanyName = selectedOrder?.companyName?.companyName || formik.values.companyName || "N/A";
  const displayPartyName = selectedOrder?.party?.partyName || formik.values.partyName || "N/A";

  useEffect(() => {
    if (invoiceError) {
      toast.error(invoiceError, { autoClose: 5000 });
    }
  }, [invoiceError]);

  const orderOptions = orders.map((order) => ({
    label: order.orderNumber,
    value: order.orderNumber,
  }));

  const disabledLabelStyle = {
    "& .MuiInputLabel-root": {
      fontWeight: "bold",
      borderRadius: "4px",
      color: "#333",
    },
    "& .MuiInputLabel-root.Mui-disabled": {
      color: "#333",
    },
  };

  return (
    <CustomDialog
      open={open}
      maxWidth="md"
      onClose={() => {
        formik.resetForm();
        setIsEditMode(!!invoiceId);
        setCurrentInvoiceId(invoiceId);
        setIsSaved(false);
        onClose();
      }}
      title={isEditMode ? "Edit Proforma Invoice" : "Add New Proforma Invoice"}
    >
      <Box
        sx={{ background: "#fff", borderRadius: 2 }}
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          formik.handleSubmit();
        }}
      >
        <Box display="flex" flexDirection="column" gap={2} mb={1} width="100%">
          <Autocomplete
            options={orderOptions}
            getOptionLabel={(option) => option.label}
            onChange={() => { }} // No-op since field is disabled
            value={orderOptions.find((opt) => opt.value === formik.values.orderNumber) || null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Order Number"
                error={formik.touched.orderNumber && Boolean(formik.errors.orderNumber)}
                helperText={formik.touched.orderNumber && formik.errors.orderNumber}
                required
                sx={disabledLabelStyle}
              />
            )}
            disabled
          />
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
            <TextField
              label="Company Name"
              value={displayCompanyName}
              disabled
              fullWidth
              sx={disabledLabelStyle}
            />
            <TextField
              label="Party Name"
              value={displayPartyName}
              disabled
              fullWidth
              sx={disabledLabelStyle}
            />
          </Box>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField
              label="GST No"
              value={formik.values.GSTNo}
              onChange={formik.handleChange("GSTNo")}
              disabled
              fullWidth
            />
            <TextField
              label="Color"
              value={formik.values.color || ""}
              onChange={formik.handleChange("color")}
              disabled
              fullWidth
              sx={disabledLabelStyle}
            />
          </Box>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField
              label="Size"
              value={formik.values.size || ""}
              onChange={formik.handleChange("size")}
              disabled
              fullWidth
              sx={disabledLabelStyle}
            />
            <TextField
              label="Printing type"
              value={formik.values.pType || ""}
              onChange={formik.handleChange("pType")}
              disabled
              fullWidth
              sx={disabledLabelStyle}
            />
          </Box>
          <TextField
            label="Address Name"
            value={`${data?.party?.address?.unitNo}, ${data?.party?.address?.marketName?.marketName}, ${data?.party?.address?.area?.area}, ${data?.party?.address?.pincode?.pincode}`}
            onChange={formik.handleChange("addressName")}
            disabled
            fullWidth
            sx={disabledLabelStyle}
          />
          <TextField
            label="Description"
            name="description"
            value={formik.values.description || ""}
            onChange={formik.handleChange}
            multiline
            rows={2}
            fullWidth
            margin="normal"
          />
          <Autocomplete
            options={staffOptions}
            getOptionLabel={(option) => option.label}
            onChange={(event, newValue) => {
              formik.setFieldValue("assignedTo", newValue?.value || "");
            }}
            value={
              staffOptions.find(option =>
                option.value === formik.values.assignedTo
              ) || null
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sales Credit"
                fullWidth
                margin="normal"
              />
            )}
          />
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField
              label="Quantity"
              type="number"
              value={formik.values.quantity}
              onChange={formik.handleChange("quantity")} // ✅ Change होंगे
              error={formik.touched.quantity && Boolean(formik.errors.quantity)}
              helperText={formik.touched.quantity && formik.errors.quantity}
              fullWidth
              sx={disabledLabelStyle}
            />
            <TextField
              label="Unit Price"
              name="unitPrice"
              type="number"
              value={formik.values.unitPrice}
              onChange={formik.handleChange("unitPrice")} // ✅ Change होंगे
              error={formik.touched.unitPrice && Boolean(formik.errors.unitPrice)}
              helperText={formik.touched.unitPrice && formik.errors.unitPrice}
              fullWidth
            />
          </Box>
          <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2} alignItems="center">
            <TextField
              label="Delivery Date"
              placeholder="Enter number of days"
              name="daysAfterConfirmation"
              type="number"
              value={formik.values.daysAfterConfirmation || ""}
              onChange={formik.handleChange}
              error={formik.touched.daysAfterConfirmation && Boolean(formik.errors.daysAfterConfirmation)}
              helperText={formik.touched.daysAfterConfirmation && formik.errors.daysAfterConfirmation}
              fullWidth
            />
            <TextField
              label="Payment Date"
              placeholder="Enter number of days"
              name="paymentDate"
              type="number"
              value={formik.values.paymentDate || ""}
              onChange={formik.handleChange}
              error={formik.touched.paymentDate && Boolean(formik.errors.paymentDate)}
              helperText={formik.touched.paymentDate && formik.errors.paymentDate}
              fullWidth
            />
            <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formik.values.applyGST}
                    onChange={(e) => {
                      formik.setFieldValue("applyGST", e.target.checked);
                      if (!e.target.checked) {
                        formik.setFieldValue("gstPercentage", 0);
                      }
                    }}
                    name="applyGST"
                    color="primary"
                  />
                }
                label="Apply GST"
              />
              {formik.values.applyGST && (
                <TextField
                  label="GST %"
                  name="gstPercentage"
                  value={formik.values.gstPercentage}
                  onChange={formik.handleChange}
                  error={formik.touched.gstPercentage && Boolean(formik.errors.gstPercentage)}
                  helperText={formik.touched.gstPercentage && formik.errors.gstPercentage}
                  sx={{ width: 100 }}
                  size="small"
                />
              )}
            </Box>
          </Box>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField
              label="Total"
              type="number"
              value={formik.values.total || ""}
              disabled
              fullWidth
              sx={disabledLabelStyle}
            />
            <TextField
              label="Final Amount"
              type="number"
              value={formik.values.finalAmount ? formik.values.finalAmount.toFixed(2) : "0.00"}
              disabled
              fullWidth
              sx={disabledLabelStyle}
            />
          </Box>
        </Box>
        <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
          <ThemeButton
            type="submit"
            sx={{ minWidth: 120, height: 40, mt: 2 }}
            disabled={isLoading || invoiceLoading || formik.isSubmitting || orderLoading ||
              !formik.values.orderNumber ||
              !formik.values.quantity}
          >
            {isLoading || invoiceLoading || orderLoading || formik.isSubmitting ? "Saving..." : "Save"}
          </ThemeButton>
          <InvoicePDFGenerator
            formData={{
              companyName: displayCompanyName,
              orderNumber: formik.values.orderNumber,
              remarks: formik.values.remarks || "",
              ownerMobileNo: formik.values.ownerMobileNo || `${data?.party?.ownerMobileNo}` || "",
              partyName: displayPartyName,
              addressName: `${data?.party?.address?.unitNo}, ${data?.party?.address?.marketName?.marketName}, ${data?.party?.address?.area?.area}, ${data?.party?.address?.pincode?.pincode}`,
              GSTNo: formik.values.GSTNo,
              servicePerformance: formik.values.servicePerformance,
              quantity: formik.values.quantity,
              unitPrice: formik.values.unitPrice || 0,
              total: formik.values.total || 0,
              finalAmount: formik.values.finalAmount || 0,
              applyGST: formik.values.applyGST,
              gstPercentage: formik.values.gstPercentage,
              daysAfterConfirmation: formik.values.daysAfterConfirmation,
              paymentDate: formik.values.paymentDate,
              description: formik.values.description || "",
              quotation: true
            }}
            isSaved={isSaved}
            onClose={onClose}
          />
        </Box>
      </Box>
    </CustomDialog>
  );
};

export default AddNewPerformanceInvoiceDialog;
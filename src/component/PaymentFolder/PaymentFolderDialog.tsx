"use client";

import { useState, useEffect, memo } from "react";
import { Box, Stack, Chip } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import CustomDialog from "@/component/customdialog";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  createPaymentFolderThunk,
  updatePaymentFolderInState,
  updatePaymentFolderThunk,
} from "@/store/slices/paymentFolderSlice";
import { getAllStaffThunk } from "@/store/slices/staffSlice";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import moment from "moment";

const areaOptions = [
  { label: "K-1", value: "K-1" },
  { label: "K-2", value: "K-2" },
  { label: "K-3", value: "K-3" },
  { label: "K-4", value: "K-4" },
]

const monthOptions = [
  { label: "Jan", value: "Jan" },
  { label: "Feb", value: "Feb" },
  { label: "Mar", value: "Mar" },
  { label: "Apr", value: "Apr" },
  { label: "May", value: "May" },
  { label: "Jun", value: "Jun" },
  { label: "Jul", value: "Jul" },
  { label: "Aug", value: "Aug" },
  { label: "Sep", value: "Sep" },
  { label: "Oct", value: "Oct" },
  { label: "Nov", value: "Nov" },
  { label: "Dec", value: "Dec" },
]

// Quick action buttons for common payment terms
const quickPaymentTerms = [
  { label: "30 Days", value: "30" },
  { label: "60 Days", value: "60" },
  { label: "90 Days", value: "90" },
]

interface OptionType {
  label: string;
  value: string;
}

interface PaymentFolderDialogProps {
  open: boolean;
  onClose: () => void;
  folderId?: string | null;
  refreshData?: () => void;
  companyTab?: number;
  company?: any;
}

const PaymentFolderDialog: React.FC<PaymentFolderDialogProps> = memo(({
  open,
  onClose,
  rowData,
  modalType
}: any) => {

  const dispatch = useAppDispatch();
  const { staffList } = useAppSelector((state) => state.staff || {});
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPaymentTerm, setCustomPaymentTerm] = useState("");
  const isEditMode = modalType === 'Edit';

  const staffOptions = staffList.map((staff: any) => ({
    label: `${staff.firstName} ${staff.lastName}`,
    value: staff._id,
  }))

  const validationSchema = Yup.object({
    companyName: Yup.string().required("Company Name is required"),
    partyName: Yup.string().required("Party Name is required"),
    area: Yup.string().required("Area is required"),
    month: Yup.string().required("Month is required"),
    paymentAmount: Yup.number().required("Payment Amount is required").positive("Must be positive"),
    assignTo: Yup.string().required("Assign To is required"),
    assignedDate: Yup.string().required("Assigned Date is required"),
    paymentTerms: Yup.string(),
    remarks: Yup.string(),
  });

  const calculateDueDate = (month1: string, paymentTerm: string) => {
    if (!month1 || !paymentTerm) return "";

    const days = parseInt(paymentTerm, 10);
    if (isNaN(days) || days <= 0) return "";

    const monthMap: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3,
      May: 4, Jun: 5, Jul: 6, Aug: 7,
      Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };

    const monthNumber = monthMap[month1];
    if (monthNumber === undefined) return "";

    const year = moment().year();

    // ✅ Month ke first day se start
    const startDate = moment({ year, month: monthNumber, day: 1 });

    // ✅ Day-1 logic (important)
    const dueDate = startDate.add(days - 1, "days");

    return dueDate.format("YYYY-MM-DD");
  };

  // Get initial values based on modal type and rowData
  const getInitialValues = () => {
    if (isEditMode && rowData) {
      // For edit mode, we need to extract the number from the payment term
      let paymentTermValue = "";
      if (rowData?.paymentTerms) {
        // Extract just the number from the payment term
        const match = rowData.paymentTerms.match(/(\d+)/);
        paymentTermValue = match ? match[1] : "";
      }

      return {
        companyName: rowData?.company?._id || "",
        partyName: rowData?.party?._id || "",
        area: rowData?.area || "",
        month: rowData?.month || "",
        paymentAmount: rowData?.paymentAmount || 0,
        assignTo: rowData?.assignedTo?._id || "",
        assignedDate: moment(rowData?.assignedDate).format('YYYY-MM-DD') || "",
        paymentTerms: paymentTermValue,
        remarks: rowData?.remarks || "",
        receivedAmount: rowData?.receivedAmount || 0,
      };
    }
    return {
      companyName: "",
      partyName: "",
      area: "",
      month: "",
      paymentAmount: 0,
      assignTo: "",
      assignedDate: "",
      paymentTerms: "",
      remarks: "",
      receivedAmount: 0,
    };
  };

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        // Format paymentTerms for submission (add "Days" suffix if it's just a number)
        const formattedPaymentTerms = /^\d+$/.test(values.paymentTerms)
          ? `${values.paymentTerms} Days`
          : values.paymentTerms;

        const submitData = {
          ...values,
          company: values.companyName,
          party: values.partyName,
          assignedTo: values.assignTo,
          assignedDate: values.assignedDate,
          month: values.month,
          paymentAmount: values.paymentAmount,
          area: values.area,
          paymentTerms: formattedPaymentTerms,
          remarks: values.remarks,
          ...(isEditMode && { receivedAmount: values.receivedAmount }),
        };

        if (isEditMode) {
          const res = await dispatch(updatePaymentFolderThunk({ id: rowData._id, data: submitData })).unwrap();
          dispatch(updatePaymentFolderInState(res));
          toast.success("Payment folder updated successfully");
        } else {
          await dispatch(createPaymentFolderThunk(submitData)).unwrap();
          toast.success("Payment folder created successfully");
        }

        handleClose();
      } catch (err: any) {
        Swal.fire({
          title: "Error!",
          text: err.message || "Operation failed",
          icon: "error",
          confirmButtonColor: "#7F56D9",
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    if (!staffList?.length) dispatch(getAllStaffThunk());
  }, []);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (open) {
      const initialValues = getInitialValues();
      formik.resetForm({ values: initialValues });

      // Check if current payment term is a custom one (not in quick options)
      const currentTerm = initialValues.paymentTerms;
      if (currentTerm && !quickPaymentTerms.some(term => term.value === currentTerm)) {
        setShowCustomInput(true);
        setCustomPaymentTerm(currentTerm);
      } else {
        setShowCustomInput(false);
        setCustomPaymentTerm("");
      }
    }
  }, [open, modalType, rowData]);

  // Update assigned date when month or payment terms change
  useEffect(() => {
    // Only auto-calculate in create mode, not in edit mode
    if (!isEditMode && formik.values.month && formik.values.paymentTerms) {
      const dueDate = calculateDueDate(formik.values.month, formik.values.paymentTerms);
      if (dueDate) {
        formik.setFieldValue("assignedDate", dueDate);
      }
    }
  }, [formik.values.month, formik.values.paymentTerms, isEditMode]);

  const handleCompanyChange = (event: any, newValue: any) => {
    const companyId = newValue ? newValue.value : "";
    formik.setFieldValue("companyName", companyId);
    formik.setFieldValue("partyName", "");
  };

  const handlePartyChange = (event: any, newValue: any) => {
    const partyId = newValue ? newValue.value : "";
    formik.setFieldValue("partyName", partyId);
  };

  const handleQuickPaymentTermClick = (term: string) => {
    formik.setFieldValue("paymentTerms", term);
    setShowCustomInput(false);
    setCustomPaymentTerm("");
  };

  const handleCustomPaymentTermChange = (value: string) => {
    setCustomPaymentTerm(value);
    formik.setFieldValue("paymentTerms", value);
  };

  const handleShowCustomInput = () => {
    setShowCustomInput(true);
    // If there's already a custom value, keep it, otherwise clear
    if (formik.values.paymentTerms && !quickPaymentTerms.some(term => term.value === formik.values.paymentTerms)) {
      setCustomPaymentTerm(formik.values.paymentTerms);
    } else {
      setCustomPaymentTerm("");
      formik.setFieldValue("paymentTerms", "");
    }
  };

  const handleClose = () => {
    formik.resetForm();
    setShowCustomInput(false);
    setCustomPaymentTerm("");
    onClose();
  };

  const getSelectedOption = (value: string, options: OptionType[]) => {
    return options.find((option) => option.value === value) || null;
  };

  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      title={`${modalType} Payment Folder`}
      maxWidth="md"
      fullWidth
    >
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          background: "#fff",
          borderRadius: 2,
          maxHeight: "70vh",
          overflowY: "auto",
        }}
        component="form"
        onSubmit={formik.handleSubmit}
      >
        <Box mb={2}>
          <CompanySelect
            name="companyName"
            value={formik.values.companyName}
            onChange={handleCompanyChange}
            error={formik.touched.companyName && Boolean(formik.errors.companyName)}
            helperText={formik.touched.companyName && formik.errors.companyName as any}
            hasParties={true}
            required
            showPartyName={true}
            partyName={formik.values.partyName}
            onPartyChange={handlePartyChange}
            partyError={formik.touched.partyName && Boolean(formik.errors.partyName)}
            partyHelperText={formik.touched.partyName && formik.errors.partyName as any}
          />
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <ThemeSelect
            label="Area"
            options={areaOptions}
            value={areaOptions.find((item) => item.value === formik.values.area)}
            onChange={(event, newValue) => formik.setFieldValue("area", newValue ? newValue.value : "")}
            error={formik.touched.area && Boolean(formik.errors.area)}
            helperText={formik.touched.area && formik.errors.area}
            required
          />
          <ThemeSelect
            label="Month"
            options={monthOptions}
            value={monthOptions.find((item) => item.value === formik.values.month)}
            onChange={(event, newValue) => formik.setFieldValue("month", newValue ? newValue.value : "")}
            error={formik.touched.month && Boolean(formik.errors.month)}
            helperText={formik.touched.month && formik.errors.month}
            required
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <ThemeInput
            labelName="Payment Amount"
            type="number"
            value={formik.values.paymentAmount}
            onChange={(e) => {
              let val = e.target.value;

              if (val === "0") return;

              if (formik.values.amount === "0" && val !== "" && val !== "0") {
                formik.setFieldValue("paymentAmount", val.replace(/^0+/, ""));
                return;
              }
              val = val.replace(/^0+/, "");
              formik.setFieldValue("paymentAmount", val);
            }}
            error={formik.touched.paymentAmount && Boolean(formik.errors.paymentAmount)}
            helperText={formik.touched.paymentAmount && formik.errors.paymentAmount}
            required
          />
          <ThemeInput
            labelName="Assigned Date"
            type="date"
            value={formik.values.assignedDate}
            onChange={(e) => formik.setFieldValue("assignedDate", e.target.value)}
            error={formik.touched.assignedDate && Boolean(formik.errors.assignedDate)}
            helperText={formik.touched.assignedDate && formik.errors.assignedDate}
            required
            disabled={!isEditMode && formik.values.month && formik.values.paymentTerms}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <ThemeSelect
            label="Assign To"
            options={staffOptions}
            value={getSelectedOption(formik.values.assignTo, staffOptions)}
            onChange={(event, newValue) => formik.setFieldValue("assignTo", newValue ? newValue.value : "")}
            error={formik.touched.assignTo && Boolean(formik.errors.assignTo)}
            helperText={formik.touched.assignTo && formik.errors.assignTo}
            required
          />

          {/* Payment Terms Section */}
          <Box sx={{ width: "100%" }}>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ fontSize: "14px", fontWeight: 500, mb: 1, color: "text.secondary" }}>
                Payment Terms {formik.touched.paymentTerms && formik.errors.paymentTerms && (
                  <span style={{ color: "#d32f2f", fontSize: "12px" }}>
                    {formik.errors.paymentTerms as string}
                  </span>
                )}
              </Box>

              {/* Quick Action Buttons */}
              {!showCustomInput && (
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  {quickPaymentTerms.map((term) => (
                    <Chip
                      key={term.value}
                      label={term.label}
                      onClick={() => handleQuickPaymentTermClick(term.value)}
                      variant={formik.values.paymentTerms === term.value ? "filled" : "outlined"}
                      color={formik.values.paymentTerms === term.value ? "primary" : "default"}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 1,
                        fontWeight: 500,
                        border: formik.values.paymentTerms === term.value ? "2px solid" : "1px solid",
                        borderColor: formik.values.paymentTerms === term.value ? "primary.main" : "grey.300",
                      }}
                    />
                  ))}
                  <Chip
                    label="Custom"
                    onClick={handleShowCustomInput}
                    variant="outlined"
                    sx={{
                      cursor: "pointer",
                      borderRadius: 1,
                      fontWeight: 500,
                      border: "1px solid",
                      borderColor: "grey.300",
                    }}
                  />
                </Stack>
              )}

              {/* Custom Input Field */}
              {showCustomInput && (
                <ThemeInput
                  labelName="Custom Payment Term (days)"
                  type="number"
                  value={customPaymentTerm}
                  onChange={(e) => handleCustomPaymentTermChange(e.target.value)}
                  error={formik.touched.paymentTerms && Boolean(formik.errors.paymentTerms)}
                  helperText={formik.touched.paymentTerms && formik.errors.paymentTerms}
                />
              )}

              {/* Show current payment term value for debugging */}
              {formik.values.paymentTerms && (
                <Box sx={{ fontSize: "12px", color: "text.secondary", mt: 0.5 }}>
                  Current value: {formik.values.paymentTerms} days
                </Box>
              )}
            </Box>
          </Box>
        </Stack>

        <Box mb={2}>
          <ThemeInput
            labelName="Remarks"
            type="text"
            value={formik.values.remarks}
            onChange={(e) => formik.setFieldValue("remarks", e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Box>

        <ThemeButton
          type="submit"
          sx={{
            background: "#A409F8",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            width: "100%",
            mt: 1,
            "&:hover": { background: "#7B06C2" },
          }}
          disabled={isLoading || formik.isSubmitting}
        >
          {isLoading || formik.isSubmitting
            ? isEditMode ? "Updating..." : "Creating..."
            : isEditMode ? "Update Payment Folder" : "Create Payment Folder"}
        </ThemeButton>
      </Box>
    </CustomDialog>
  );
});

export default PaymentFolderDialog;